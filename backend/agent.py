"""
Agent Orchestrator and Dialogue Generator
Handles:
- Dynamic prompt variable injection
- Generation of conversational voice responses
- Hybrid mode: Intelligent rule-based dialog engine + Optional LLM backend
"""

import os
from typing import Dict, Any, List, Optional
from .state_machine import StateEngine, QualificationState

class VoiceAgent:
    def __init__(
        self,
        company_name: str = "Home Credit",
        customer_name: str = "Rahul Sharma",
        agent_name: str = "Priya",
        agent_gender: str = "Female",
        language_to_speak: str = "English"
    ):
        self.company_name = company_name
        self.customer_name = customer_name
        self.agent_name = agent_name
        self.agent_gender = agent_gender
        self.language_to_speak = language_to_speak
        self.engine = StateEngine(customer_name=customer_name, company_name=company_name)

    def generate_opening_message(self) -> str:
        cust = self.customer_name if (self.customer_name and not self.customer_name.startswith("{")) else "Chandra Mohan"
        agent = self.agent_name if (self.agent_name and not self.agent_name.startswith("{")) else "Priya"
        comp = self.company_name if (self.company_name and not self.company_name.startswith("{")) else "Home Credit"

        if self.language_to_speak.lower() == "hindi":
            if self.agent_gender.lower() == "female":
                return f"Namaste! Main {comp} se {agent} bol rahi hoon. Kya meri baat {cust} ji se ho rahi hai?"
            else:
                return f"Namaste! Main {comp} se {agent} bol raha hoon. Kya meri baat {cust} ji se ho rahi hai?"
        return f"Hello! This is {agent} calling from {comp}. Am I speaking with {cust}?"

    def process_utterance(self, utterance: str) -> Dict[str, Any]:
        """Processes customer utterance, updates state machine, and returns audio-optimized text response."""
        prev_phase = self.engine.state.current_phase
        self.engine.extract_and_update(utterance)
        state = self.engine.state

        response_text = ""

        # 1. Verification Failed
        if state.customer_verified is False:
            response_text = f"I apologize for the disturbance. Have a great day!"

        # 2. Busy Customer
        elif state.customer_busy and state.callback_time is None:
            response_text = "I completely understand. What would be a convenient time for us to call you back?"
        elif state.customer_busy and state.callback_time:
            response_text = f"Thank you, {self.customer_name}. We will schedule a callback for {state.callback_time}. Have a wonderful day!"

        # 3. Transfer Logic Switch (Existing loan / EMI reduction)
        elif state.transfer_required:
            response_text = "Thank you for letting me know. Since you already have an existing loan on this property, this will be handled directly by our Loan Transfer Specialist. A specialist will contact you shortly to assist with this transfer. Thank you for your time!"

        # 4. Immediate Disqualification
        elif state.disqualified:
            if "agricultural" in (state.disqualification_reason or "").lower():
                response_text = f"I understand. Unfortunately, our current offer does not cover agricultural properties, so we won't be able to proceed at this time. Thank you so much for your time, {self.customer_name}, and have a great day."
            elif "cash" in (state.disqualification_reason or "").lower():
                response_text = "I understand. As per our lending policy, income must be routed through a bank account, so we cannot proceed with cash income. Thank you for speaking with us today."
            elif "document" in (state.disqualification_reason or "").lower() or "original" in (state.disqualification_reason or "").lower():
                response_text = f"I see. Original documents are mandatory for verification to process this loan, so we won't be able to proceed further at this time. Thank you for your time, {self.customer_name}."
            elif "tenure" in (state.disqualification_reason or "").lower():
                response_text = f"Our repayment tenure ranges strictly between 3 to 15 years, so we cannot offer that specific tenure under this scheme. Thank you for your time, {self.customer_name}."
            elif "exceeds" in (state.disqualification_reason or "").lower():
                response_text = "We understand. Since your requirement exceeds our maximum limit, we won't be able to proceed with this offer today. Thank you for your time."
            else:
                response_text = f"Unfortunately, based on our preliminary criteria, we won't be able to proceed with this offer today. Thank you for your time, {self.customer_name}."

        # 5. Loan Amount Exceeded Cap Question
        elif state.loan_amount_pending_cap_consent:
            response_text = "Our pre-approved offer has a maximum limit of 75 Lakh rupees. Would you like to proceed with the maximum amount of 75 Lakhs?"

        # 6. Final Qualification Passed Handoff
        elif state.handoff_ready:
            response_text = f"Congratulations, {self.customer_name}! Based on the details provided, you meet all preliminary criteria for our Loan Against Property offer. A senior loan expert will call you shortly to discuss the exact interest rates and finalize your application. Thank you for banking with {self.company_name}, and have a wonderful day!"

        # 7. Presentation of Offer (If just verified)
        elif prev_phase == "GREETING" and state.current_phase == "OFFER":
            next_q = self.get_question_for_item(self.engine.get_earliest_missing_item())
            response_text = f"As one of our valued customers, {self.company_name} is pleased to inform you that you have a pre-approved Loan Against Property offer of up to 75 Lakh rupees as a loyalty reward. I'd just like to check a few quick details to see if this suits your requirements. {next_q}"

        # 8. Next Checklist Question (Slot Filling)
        else:
            missing_item = self.engine.get_earliest_missing_item()
            if missing_item:
                response_text = self.get_question_for_item(missing_item)
            else:
                response_text = "Thank you for confirming all those details."

        return {
            "response": response_text,
            "state": state.model_dump(),
            "earliest_missing_item": self.engine.get_earliest_missing_item(),
            "is_ended": state.call_ended
        }

    def get_question_for_item(self, item_index: Optional[int]) -> str:
        questions = {
            1: "Could you tell me if your property is residential, commercial, or industrial?",
            2: "Are you the sole owner of the property, or is it jointly owned?",
            3: "Do you have the original property documents available for verification?",
            4: "How much loan amount are you looking to borrow?",
            5: "Are you salaried or self-employed, and do you receive your income through bank transfer or in cash?",
            6: "What is the approximate current market value of your property?",
            7: "Over how many years would you prefer to repay the loan?"
        }
        # If occupation captured but not income mode:
        if item_index == 5:
            if self.engine.state.occupation and not self.engine.state.income_mode:
                return "Understood. And is your income received directly into your bank account or in cash?"
            elif self.engine.state.income_mode and not self.engine.state.occupation:
                return "Great. And are you currently salaried or self-employed?"
        return questions.get(item_index, "Could you share the remaining property details?")
