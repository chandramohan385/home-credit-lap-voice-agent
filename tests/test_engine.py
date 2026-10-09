"""
Unit and integration tests for the Home Credit Voice Agent State Machine
"""
import pytest
from backend.state_machine import StateEngine
from backend.agent import VoiceAgent
from backend.scenarios_data import SCENARIOS

def test_happy_path_qualification():
    agent = VoiceAgent()
    utterances = [
        "Yes, Rahul Sharma speaking.",
        "Sure, tell me more about this offer.",
        "It is a residential flat.",
        "I am the sole owner.",
        "Yes, all original documents are safely kept at home.",
        "I am looking for around 50 Lakhs.",
        "I am salaried, and my income is directly credited to my bank account.",
        "The property is worth approximately 1.2 Crore.",
        "I want a repayment tenure of 10 years."
    ]
    for u in utterances:
        res = agent.process_utterance(u)
    
    assert agent.engine.state.handoff_ready is True
    assert agent.engine.state.disqualified is False
    assert agent.engine.state.property_type == "Residential"
    assert agent.engine.state.ownership_status == "Sole"
    assert agent.engine.state.original_documents == "Available"
    assert agent.engine.state.loan_amount == 5000000.0
    assert agent.engine.state.occupation == "Salaried"
    assert agent.engine.state.income_mode == "Bank"
    assert agent.engine.state.tenure == 10

def test_agricultural_disqualification():
    agent = VoiceAgent()
    agent.process_utterance("Yes speaking.")
    agent.process_utterance("Tell me more.")
    res = agent.process_utterance("Actually, it is agricultural land in Haryana.")
    
    assert agent.engine.state.disqualified is True
    assert agent.engine.state.property_type == "Agricultural"
    assert "agricultural" in agent.engine.state.disqualification_reason.lower()
    assert res["is_ended"] is True

def test_cash_income_disqualification():
    agent = VoiceAgent()
    agent.process_utterance("Yes speaking.")
    agent.process_utterance("Go ahead.")
    agent.process_utterance("Residential flat.")
    agent.process_utterance("Sole owner.")
    agent.process_utterance("Original documents available.")
    agent.process_utterance("40 Lakhs.")
    res = agent.process_utterance("I run a business and receive all income in cash.")
    
    assert agent.engine.state.disqualified is True
    assert agent.engine.state.income_mode == "Cash"
    assert "cash" in agent.engine.state.disqualification_reason.lower()
    assert res["is_ended"] is True

def test_existing_loan_transfer_switch():
    agent = VoiceAgent()
    agent.process_utterance("Yes speaking.")
    res = agent.process_utterance("Actually, I already have an existing running loan on this property.")
    
    assert agent.engine.state.transfer_required is True
    assert agent.engine.state.disqualified is False
    assert "Loan Transfer Specialist" in res["response"]
    assert res["is_ended"] is True

def test_loan_cap_exceeded_and_accepted():
    agent = VoiceAgent()
    agent.process_utterance("Yes speaking.")
    agent.process_utterance("Proceed.")
    agent.process_utterance("Residential.")
    agent.process_utterance("Sole owner.")
    agent.process_utterance("Originals available.")
    res_cap = agent.process_utterance("I need 90 Lakhs.")
    assert "maximum limit of 75 Lakh" in res_cap["response"]
    
    res_accept = agent.process_utterance("Yes, 75 Lakhs is fine, let's proceed.")
    assert agent.engine.state.loan_amount == 7500000.0

def test_all_scenarios_execute_cleanly():
    for scenario in SCENARIOS:
        agent = VoiceAgent()
        for u in scenario["utterances"]:
            res = agent.process_utterance(u)
            if res["is_ended"]:
                break
        assert res["response"] != ""
