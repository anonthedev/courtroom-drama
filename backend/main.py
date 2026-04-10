from __future__ import annotations

import asyncio
import uuid
import os
import logging
from datetime import datetime, timezone
from typing import Annotated, Any, Literal, TypedDict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field, field_validator

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

# Pydantic Models

Turn = Literal["Prosecution", "Witness", "Judge", "Defense"]

JUROR_PERSONAS: list[str] = [
    "The Skeptic",
    "The Empath",
    "The Analyst",
    "The Traditionalist",
    "The Rebel",
    "The Peacemaker",
    "The Idealist",
    "The Pragmatist",
    "The Observer",
    "The Advocate",
    "The Conformist",
    "The Wildcard",
]


class Message(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class JurorSentiment(BaseModel):
    juror_id: int = Field(ge=1, le=12)
    persona_type: str
    sentiment_score: int = Field(ge=1, le=100)
    reasoning: str


class JuryVerdict(BaseModel):
    jurors: list[JurorSentiment]

    @field_validator("jurors")
    @classmethod
    def must_have_twelve(cls, v: list[JurorSentiment]) -> list[JurorSentiment]:
        if len(v) != 12:
            raise ValueError(f"Jury must have exactly 12 jurors, got {len(v)}")
        return v


class CaseFile(BaseModel):
    case_name: str
    summary: str
    session_id: str


class InitRequest(BaseModel):
    case_name: str = "The State vs. Cyberdyne Systems"


# LangGraph State

TURN_ORDER: list[Turn] = ["Prosecution", "Witness", "Defense"]


class TrialState(TypedDict):
    current_turn: Turn
    transcript: Annotated[list, add_messages]
    jury_sentiments: list[dict[str, Any]]
    is_objection_active: bool
    case_summary: str
    objection_ground: str


#LLM helpers

def _get_llm(temperature: float = 0.8) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=temperature)


SYSTEM_PROMPTS: dict[str, str] = {
    "Prosecution": (
        "You are the Prosecution attorney in a courtroom trial. "
        "Present evidence, question witnesses, and build a compelling case against the defendant. "
        "Be assertive, logical, and persuasive. Keep responses to 1-2 paragraphs. "
        "Address the court formally. Reference prior testimony when relevant."
    ),
    "Witness": (
        "You are a key witness in a courtroom trial. "
        "Answer questions truthfully based on what you observed. "
        "Show realistic emotions — nervousness, hesitation, or confidence as appropriate. "
        "Keep responses to 1-2 paragraphs. You may be evasive on details you're unsure about."
    ),
    "Judge": (
        "You are the presiding Judge in a courtroom trial. "
        "You are fair, authoritative, and follow proper legal procedure. "
        "When ruling on objections, evaluate the legal ground cited (e.g., Hearsay, Relevance, "
        "Leading, Speculation, Argumentative) against the statement in question. "
        "Clearly state 'SUSTAINED' or 'OVERRULED' with a brief legal rationale. "
        "Keep responses to 1-2 paragraphs."
    ),
}

JURY_EVALUATION_PROMPT = (
    "You are an expert jury analyst. Based on the trial transcript below, evaluate how each "
    "of the 12 jurors would currently feel about the defendant's guilt or innocence.\n\n"
    "Each juror has a distinct persona that shapes how they interpret testimony:\n"
    "{personas}\n\n"
    "Transcript so far:\n{transcript}\n\n"
    "For each juror, provide:\n"
    "- juror_id (1-12)\n"
    "- persona_type (their persona name)\n"
    "- sentiment_score (1 = fully believes innocent, 100 = fully believes guilty)\n"
    "- reasoning (1-2 sentences explaining why this persona feels this way)\n"
)


#Node Functions

async def prosecution_node(state: TrialState) -> dict[str, Any]:
    llm = _get_llm()
    transcript_text = _format_transcript(state)
    messages = [
        SystemMessage(content=SYSTEM_PROMPTS["Prosecution"]),
        HumanMessage(content=(
            f"Case: {state['case_summary']}\n\n"
            f"Trial transcript so far:\n{transcript_text}\n\n"
            "Continue the prosecution's argument or examination."
        )),
    ]
    response = await llm.ainvoke(messages)
    return {
        "current_turn": "Witness",
        "transcript": [{"role": "Prosecution", "content": response.content}],
    }


async def witness_node(state: TrialState) -> dict[str, Any]:
    llm = _get_llm()
    transcript_text = _format_transcript(state)
    messages = [
        SystemMessage(content=SYSTEM_PROMPTS["Witness"]),
        HumanMessage(content=(
            f"Case: {state['case_summary']}\n\n"
            f"Trial transcript so far:\n{transcript_text}\n\n"
            "Respond to the latest question or statement directed at you."
        )),
    ]
    response = await llm.ainvoke(messages)
    return {
        "current_turn": "Defense",
        "transcript": [{"role": "Witness", "content": response.content}],
    }


async def judge_node(state: TrialState) -> dict[str, Any]:
    llm = _get_llm(temperature=0.3)
    transcript_text = _format_transcript(state)
    objection_ground = state.get("objection_ground", "unspecified")

    messages = [
        SystemMessage(content=SYSTEM_PROMPTS["Judge"]),
        HumanMessage(content=(
            f"Case: {state['case_summary']}\n\n"
            f"Trial transcript so far:\n{transcript_text}\n\n"
            f"The Defense has raised an objection on the ground of: {objection_ground}.\n"
            "Review the last statement and rule on this objection."
        )),
    ]
    response = await llm.ainvoke(messages)
    return {
        "current_turn": "Prosecution",
        "is_objection_active": False,
        "objection_ground": "",
        "transcript": [{"role": "Judge", "content": response.content}],
    }


def _format_transcript(state: TrialState) -> str:
    lines: list[str] = []
    for msg in state.get("transcript", []):
        if hasattr(msg, "content"):
            role = getattr(msg, "name", None) or msg.type
            lines.append(f"[{role}]: {msg.content}")
    return "\n".join(lines[-20:]) if lines else "(No testimony yet)"

#conditional routing

def route_after_prosecution(state: TrialState) -> str:
    if state.get("is_objection_active"):
        return "judge"
    return "witness"


def route_after_witness(state: TrialState) -> str:
    if state.get("is_objection_active"):
        return "judge"
    return END


def route_after_judge(state: TrialState) -> str:
    return END


# Build LangGraph

def build_trial_graph() -> StateGraph:
    graph = StateGraph(TrialState)

    graph.add_node("prosecution", prosecution_node)
    graph.add_node("witness", witness_node)
    graph.add_node("judge", judge_node)

    graph.set_entry_point("prosecution")

    graph.add_conditional_edges("prosecution", route_after_prosecution, {
        "witness": "witness",
        "judge": "judge",
    })
    graph.add_conditional_edges("witness", route_after_witness, {
        "judge": "judge",
        END: END,
    })
    graph.add_edge("judge", END)

    return graph.compile()

#Jury sentiments (Structured Output)

async def evaluate_jury_sentiment(transcript: list[Any], case_summary: str) -> JuryVerdict:
    llm = _get_llm(temperature=0.6)
    structured_llm = llm.with_structured_output(JuryVerdict)

    personas_text = "\n".join(
        f"  Juror {i+1}: {persona}" for i, persona in enumerate(JUROR_PERSONAS)
    )
    lines: list[str] = []
    for msg in transcript:
        if hasattr(msg, "content"):
            role = getattr(msg, "name", None) or msg.type
            lines.append(f"[{role}]: {msg.content}")
    transcript_text = "\n".join(lines[-30:]) if lines else "(No testimony yet)"

    prompt = JURY_EVALUATION_PROMPT.format(
        personas=personas_text,
        transcript=transcript_text,
    )

    result = await structured_llm.ainvoke(prompt)
    return result


#Session store

class Session:
    def __init__(self, state: TrialState):
        self.state: TrialState = state
        self.graph = build_trial_graph()


sessions: dict[str, Session] = {}


def _default_jury_sentiments() -> list[dict[str, Any]]:
    return [
        {
            "juror_id": i + 1,
            "persona_type": JUROR_PERSONAS[i],
            "sentiment_score": 50,
            "reasoning": "Trial has not yet begun.",
        }
        for i in range(12)
    ]


#fastApi setup

app = FastAPI(title="Courtroom Simulation", version="0.1.0")


class CORSHTTPOnly:
    """Applies CORS headers only to HTTP requests; WebSocket passes through untouched."""

    def __init__(self, app: ASGIApp):
        self.app = app
        self.cors = CORSMiddleware(
            app,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "websocket":
            logger.info(f"WebSocket upgrade bypassing CORS: {scope['path']}")
            await self.app(scope, receive, send)
        else:
            await self.cors(scope, receive, send)


app.add_middleware(CORSHTTPOnly)


# POST /api/game/init

@app.post("/api/game/init", response_model=CaseFile)
async def init_game(req: InitRequest) -> CaseFile:
    llm = _get_llm(temperature=0.9)
    summary_response = await llm.ainvoke([
        SystemMessage(content=(
            "You are a creative legal fiction writer. Generate a compelling, "
            "detailed case summary for a courtroom trial. Include the charges, "
            "key players, and a brief overview of the alleged events. "
            "Keep it to 2-3 paragraphs."
        )),
        HumanMessage(content=f"Generate a case summary for: {req.case_name}"),
    ])

    session_id = uuid.uuid4().hex[:16]

    initial_state: TrialState = {
        "current_turn": "Prosecution",
        "transcript": [],
        "jury_sentiments": _default_jury_sentiments(),
        "is_objection_active": False,
        "case_summary": summary_response.content,
        "objection_ground": "",
    }

    sessions[session_id] = Session(initial_state)

    return CaseFile(
        case_name=req.case_name,
        summary=summary_response.content,
        session_id=session_id,
    )


# GET /api/stt/token

@app.get("/api/stt/token")
async def stt_token() -> dict[str, str]:
    key = os.getenv("DEEPGRAM_API_KEY", "")
    if not key:
        raise ValueError("DEEPGRAM_API_KEY is not configured")
    return {"key": key}


# WebSocket /ws/trial/{session_id}

async def _stream_agent_turn(
    session: Session,
    websocket: WebSocket,
) -> str:
    """Stream the current agent's response token-by-token. Returns the full text."""
    state = session.state
    current_turn: str = state["current_turn"]
    llm = _get_llm() if current_turn != "Judge" else _get_llm(temperature=0.3)

    transcript_text = _format_transcript(state)

    if current_turn == "Judge":
        objection_ground = state.get("objection_ground", "unspecified")
        user_content = (
            f"Case: {state['case_summary']}\n\n"
            f"Trial transcript so far:\n{transcript_text}\n\n"
            f"The Defense has raised an objection on the ground of: {objection_ground}.\n"
            "Review the last statement and rule on this objection."
        )
    elif current_turn == "Prosecution":
        user_content = (
            f"Case: {state['case_summary']}\n\n"
            f"Trial transcript so far:\n{transcript_text}\n\n"
            "Continue the prosecution's argument or examination."
        )
    else:
        user_content = (
            f"Case: {state['case_summary']}\n\n"
            f"Trial transcript so far:\n{transcript_text}\n\n"
            "Respond to the latest question or statement directed at you."
        )

    messages = [
        SystemMessage(content=SYSTEM_PROMPTS[current_turn]),
        HumanMessage(content=user_content),
    ]

    collected_tokens: list[str] = []

    async for chunk in llm.astream(messages):
        if isinstance(chunk, AIMessageChunk) and chunk.content:
            collected_tokens.append(chunk.content)
            await websocket.send_json({
                "type": "token",
                "speaker": current_turn,
                "content": chunk.content,
            })

    full_text = "".join(collected_tokens)
    await websocket.send_json({
        "type": "turn_complete",
        "speaker": current_turn,
        "content": full_text,
    })

    return full_text


def _advance_turn(state: TrialState) -> None:
    """Move to the next turn in the normal rotation after a completed agent turn."""
    current = state["current_turn"]
    if current == "Judge":
        state["current_turn"] = "Prosecution"
        state["is_objection_active"] = False
        state["objection_ground"] = ""
    elif current == "Prosecution":
        state["current_turn"] = "Witness"
    elif current == "Witness":
        state["current_turn"] = "Defense"
    elif current == "Defense":
        state["current_turn"] = "Prosecution"


@app.websocket("/ws/trial/{session_id}")
async def trial_websocket(websocket: WebSocket, session_id: str) -> None:
    logger.info(f"WebSocket connection attempt for session: {session_id}")
    try:
        await websocket.accept()
        logger.info(f"WebSocket accepted for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket accept failed: {e}")
        return

    if session_id not in sessions:
        logger.warning(f"Invalid session_id: {session_id}")
        await websocket.send_json({"type": "error", "content": "Invalid session_id"})
        await websocket.close()
        return

    session = sessions[session_id]
    logger.info(f"Session found: {session_id}, starting loop")

    await websocket.send_json({
        "type": "session_joined",
        "session_id": session_id,
        "case_summary": session.state["case_summary"],
        "current_turn": session.state["current_turn"],
        "jury": session.state["jury_sentiments"],
    })

    try:
        while True:
            state = session.state
            current_turn: str = state["current_turn"]
            logger.info(f"Current turn: {current_turn}")


            # ---- Defense turn: wait for player input ----
            if current_turn == "Defense":
                logger.info("Defense turn: awaiting input")
                await websocket.send_json({
                    "type": "awaiting_input",
                    "speaker": "Defense",
                    "message": "Your turn, counselor. Present your argument or cross-examine.",
                })

                data = await websocket.receive_json()
                logger.info(f"Received data: {data}")
                action = data.get("action", "")

                if action == "STATEMENT":
                    content = data.get("content", "")
                    state["transcript"] = state.get("transcript", []) + [
                        HumanMessage(content=content, name="Defense")
                    ]
                    _advance_turn(state)

                    await websocket.send_json({
                        "type": "turn_complete",
                        "speaker": "Defense",
                        "content": content,
                    })
                    continue

                elif action == "OBJECTION":
                    # Defense objects during their own turn — unusual but allowed.
                    # Treat it as an out-of-order objection to the last AI statement.
                    ground = data.get("ground", "unspecified")
                    state["is_objection_active"] = True
                    state["objection_ground"] = ground
                    state["current_turn"] = "Judge"
                    state["transcript"] = state.get("transcript", []) + [
                        HumanMessage(
                            content=f"OBJECTION! On the ground of: {ground}",
                            name="Defense",
                        )
                    ]
                    await websocket.send_json({
                        "type": "objection_received",
                        "ground": ground,
                    })
                    continue

                else:
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Unknown action: {action}. Use STATEMENT or OBJECTION.",
                    })
                    continue

            # ---- AI agent turn: stream with objection interruption ----
            logger.info(f"AI turn: {current_turn}, starting stream")
            collected_tokens: list[str] = []
            was_interrupted = False
            objection_data: dict[str, Any] | None = None

            stream_task = asyncio.create_task(
                _stream_agent_turn(session, websocket)
            )
            listen_task: asyncio.Task[Any] = asyncio.create_task(
                websocket.receive_json()
            )

            done, pending = await asyncio.wait(
                {stream_task, listen_task},
                return_when=asyncio.FIRST_COMPLETED,
            )

            if listen_task in done:
                # Client sent a message while AI was streaming
                client_msg = listen_task.result()
                logger.info(f"Received message during stream: {client_msg}")

                if client_msg.get("action") == "OBJECTION":
                    stream_task.cancel()
                    try:
                        await stream_task
                    except asyncio.CancelledError:
                        pass

                    was_interrupted = True
                    objection_data = client_msg

                    await websocket.send_json({
                        "type": "stream_interrupted",
                        "speaker": current_turn,
                    })

                    ground = objection_data.get("ground", "unspecified")

                    state["transcript"] = state.get("transcript", []) + [
                        HumanMessage(
                            content=f"[{current_turn}'s testimony was interrupted]",
                            name=current_turn,
                        ),
                        HumanMessage(
                            content=f"OBJECTION! On the ground of: {ground}",
                            name="Defense",
                        ),
                    ]

                    state["is_objection_active"] = True
                    state["objection_ground"] = ground
                    state["current_turn"] = "Judge"

                    await websocket.send_json({
                        "type": "objection_received",
                        "ground": ground,
                    })
                else:
                    # Non-objection message during AI turn — ignore and let stream finish
                    if stream_task in pending:
                        full_text = await stream_task
                        state["transcript"] = state.get("transcript", []) + [
                            HumanMessage(content=full_text, name=current_turn)
                        ]
                        _advance_turn(state)

            if stream_task in done and not was_interrupted:
                listen_task.cancel()
                try:
                    await listen_task
                except asyncio.CancelledError:
                    pass

                full_text = stream_task.result()
                state["transcript"] = state.get("transcript", []) + [
                    HumanMessage(content=full_text, name=current_turn)
                ]
                _advance_turn(state)

            # ---- Jury sentiment update after each completed turn ----
            try:
                verdict = await evaluate_jury_sentiment(
                    state.get("transcript", []),
                    state["case_summary"],
                )
                state["jury_sentiments"] = [j.model_dump() for j in verdict.jurors]
                await websocket.send_json({
                    "type": "jury_update",
                    "jurors": state["jury_sentiments"],
                })
            except Exception:
                # Jury evaluation is non-critical; don't break the trial loop
                await websocket.send_json({
                    "type": "jury_update",
                    "jurors": state["jury_sentiments"],
                })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "content": str(exc)})
            await websocket.close()
        except Exception:
            pass


#uvicorn entry point

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, ws="wsproto")
