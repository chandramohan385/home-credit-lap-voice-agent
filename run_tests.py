import unittest
import sys
import os

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from backend.state_machine import StateEngine
from backend.agent import VoiceAgent
from backend.scenarios_data import SCENARIOS

class TestVoiceAgentEngine(unittest.TestCase):
    def test_happy_path(self):
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
            agent.process_utterance(u)
        
        self.assertTrue(agent.engine.state.handoff_ready)
        self.assertFalse(agent.engine.state.disqualified)
        self.assertEqual(agent.engine.state.property_type, "Residential")
        self.assertEqual(agent.engine.state.ownership_status, "Sole")
        self.assertEqual(agent.engine.state.original_documents, "Available")
        self.assertEqual(agent.engine.state.loan_amount, 5000000.0)
        self.assertEqual(agent.engine.state.occupation, "Salaried")
        self.assertEqual(agent.engine.state.income_mode, "Bank")
        self.assertEqual(agent.engine.state.tenure, 10)

    def test_agricultural_disqualification(self):
        agent = VoiceAgent()
        agent.process_utterance("Yes speaking.")
        agent.process_utterance("Tell me more.")
        res = agent.process_utterance("Actually, it is agricultural land in Haryana.")
        
        self.assertTrue(agent.engine.state.disqualified)
        self.assertEqual(agent.engine.state.property_type, "Agricultural")
        self.assertIn("agricultural", agent.engine.state.disqualification_reason.lower())
        self.assertTrue(res["is_ended"])

    def test_cash_income_disqualification(self):
        agent = VoiceAgent()
        agent.process_utterance("Yes speaking.")
        agent.process_utterance("Go ahead.")
        agent.process_utterance("Residential flat.")
        agent.process_utterance("Sole owner.")
        agent.process_utterance("Original documents available.")
        agent.process_utterance("40 Lakhs.")
        res = agent.process_utterance("I run a business and receive all income in cash.")
        
        self.assertTrue(agent.engine.state.disqualified)
        self.assertEqual(agent.engine.state.income_mode, "Cash")
        self.assertIn("cash", agent.engine.state.disqualification_reason.lower())
        self.assertTrue(res["is_ended"])

    def test_existing_loan_transfer(self):
        agent = VoiceAgent()
        agent.process_utterance("Yes speaking.")
        res = agent.process_utterance("Actually, I already have an existing running loan on this property.")
        
        self.assertTrue(agent.engine.state.transfer_required)
        self.assertFalse(agent.engine.state.disqualified)
        self.assertIn("Loan Transfer Specialist", res["response"])
        self.assertTrue(res["is_ended"])

    def test_loan_cap_exceeded_and_accepted(self):
        agent = VoiceAgent()
        agent.process_utterance("Yes speaking.")
        agent.process_utterance("Proceed.")
        agent.process_utterance("Residential.")
        agent.process_utterance("Sole owner.")
        agent.process_utterance("Originals available.")
        res_cap = agent.process_utterance("I need 90 Lakhs.")
        self.assertIn("maximum limit of 75 Lakh", res_cap["response"])
        
        res_accept = agent.process_utterance("Yes, 75 Lakhs is fine, let's proceed.")
        self.assertEqual(agent.engine.state.loan_amount, 7500000.0)

    def test_all_10_scenarios(self):
        for scenario in SCENARIOS:
            agent = VoiceAgent()
            for u in scenario["utterances"]:
                res = agent.process_utterance(u)
                if res["is_ended"]:
                    break
            self.assertTrue(len(res["response"]) > 0)

if __name__ == "__main__":
    unittest.main()
