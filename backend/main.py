from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import os

from .agent import VoiceAgent

app = FastAPI(
    title="Home Credit LAP AI Voice Agent API",
    description="Backend engine for Home Credit Loan Against Property conversational qualification",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
sessions: Dict[str, VoiceAgent] = {}

class StartCallRequest(BaseModel):
    session_id: str
    company_name: str = "Home Credit"
    customer_name: str = "Rahul Sharma"
    agent_name: str = "Priya"
    agent_gender: str = "Female"
    language_to_speak: str = "English"

class ChatRequest(BaseModel):
    session_id: str
    utterance: str

class RunScenarioRequest(BaseModel):
    scenario_id: str
    utterances: List[str]

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Home Credit LAP Voice Agent API"}

@app.post("/api/start")
def start_call(req: StartCallRequest):
    agent = VoiceAgent(
        company_name=req.company_name,
        customer_name=req.customer_name,
        agent_name=req.agent_name,
        agent_gender=req.agent_gender,
        language_to_speak=req.language_to_speak
    )
    sessions[req.session_id] = agent
    opening = agent.generate_opening_message()
    return {
        "session_id": req.session_id,
        "message": opening,
        "state": agent.engine.state.model_dump(),
        "is_ended": False
    }

@app.post("/api/chat")
def chat(req: ChatRequest):
    if req.session_id not in sessions:
        # Default initialization
        sessions[req.session_id] = VoiceAgent()
    agent = sessions[req.session_id]
    result = agent.process_utterance(req.utterance)
    return {
        "session_id": req.session_id,
        "message": result["response"],
        "state": result["state"],
        "is_ended": result["is_ended"]
    }

@app.post("/api/reset")
def reset(req: Dict[str, str]):
    session_id = req.get("session_id", "default")
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "reset", "session_id": session_id}

@app.get("/api/scenarios")
def get_scenarios():
    from .scenarios_data import SCENARIOS
    return SCENARIOS

@app.post("/api/run-scenario")
def run_scenario(req: RunScenarioRequest):
    agent = VoiceAgent()
    transcript = []
    opening = agent.generate_opening_message()
    transcript.append({"speaker": "Agent", "text": opening})

    for u in req.utterances:
        transcript.append({"speaker": "Customer", "text": u})
        res = agent.process_utterance(u)
        transcript.append({"speaker": "Agent", "text": res["response"]})
        if res["is_ended"]:
            break

    return {
        "scenario_id": req.scenario_id,
        "transcript": transcript,
        "final_state": agent.engine.state.model_dump(),
        "passed": agent.engine.state.handoff_ready,
        "disqualified": agent.engine.state.disqualified,
        "transfer_required": agent.engine.state.transfer_required
    }

# Retell AI webhook compatibility endpoint
@app.post("/webhook/retell")
def retell_webhook(payload: Dict[str, Any]):
    """Receives event webhooks or custom LLM calls from Retell AI."""
    event = payload.get("event")
    call = payload.get("call", {})
    return {"status": "received", "event": event, "call_id": call.get("call_id")}
