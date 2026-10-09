"""
State Machine and Slot-Filling Engine for Home Credit LAP Voice Agent
Implements:
- 7-item qualification checklist tracking
- Earliest-unanswered-question resolution ("First Missing Question" algorithm)
- Out-of-order / compound entity extraction
- Immediate disqualification gates (Agricultural, Cash, Missing Documents, Tenure <3 or >15)
- Transfer logic switch (Existing Loan, EMI reduction)
- Busy customer handling
"""

import re
from typing import Dict, Any, Optional, Tuple, List
from pydantic import BaseModel, Field

class QualificationState(BaseModel):
    customer_verified: Optional[bool] = None
    customer_busy: bool = False
    callback_time: Optional[str] = None
    transfer_required: bool = False
    transfer_reason: Optional[str] = None
    
    # 7 Checklist items
    property_type: Optional[str] = None          # Residential, Commercial, Industrial, Agricultural
    ownership_status: Optional[str] = None       # Sole, Joint
    original_documents: Optional[str] = None     # Available, Unavailable
    loan_amount: Optional[float] = None          # <= 75,00,000
    loan_amount_raw: Optional[str] = None
    loan_amount_pending_cap_consent: bool = False
    occupation: Optional[str] = None             # Salaried, Self-Employed
    income_mode: Optional[str] = None            # Bank, Cash
    market_value: Optional[str] = None           # Estimated value
    tenure: Optional[int] = None                 # 3 to 15 years
    
    disqualified: bool = False
    disqualification_reason: Optional[str] = None
    handoff_ready: bool = False
    call_ended: bool = False
    current_phase: str = "GREETING"              # GREETING, BUSY, OFFER, QUALIFICATION, DISQUALIFIED, TRANSFER, HANDOFF, ENDED


class StateEngine:
    def __init__(self, customer_name: str = "Rahul Sharma", company_name: str = "Home Credit"):
        self.customer_name = customer_name
        self.company_name = company_name
        self.state = QualificationState()
        self.history: List[Dict[str, str]] = []

    def get_earliest_missing_item(self) -> Optional[int]:
        """Returns the index (1-7) of the earliest missing checklist item."""
        if self.state.property_type is None:
            return 1
        if self.state.ownership_status is None:
            return 2
        if self.state.original_documents is None:
            return 3
        if self.state.loan_amount is None and not self.state.loan_amount_pending_cap_consent:
            return 4
        if self.state.occupation is None or self.state.income_mode is None:
            return 5
        if self.state.market_value is None:
            return 6
        if self.state.tenure is None:
            return 7
        return None

    def is_fully_qualified(self) -> bool:
        """Returns True only when all 7 checklist items have passed and no disqualifications occurred."""
        if self.state.disqualified or self.state.transfer_required:
            return False
        
        return (
            self.state.property_type in ["Residential", "Commercial", "Industrial"] and
            self.state.ownership_status in ["Sole", "Joint"] and
            self.state.original_documents == "Available" and
            self.state.loan_amount is not None and self.state.loan_amount <= 7500000 and
            self.state.occupation in ["Salaried", "Self-Employed"] and
            self.state.income_mode == "Bank" and
            self.state.market_value is not None and
            self.state.tenure is not None and (3 <= self.state.tenure <= 15)
        )

    def extract_and_update(self, utterance: str) -> Dict[str, Any]:
        """Extracts entities, updates state slots, and evaluates business rules."""
        text = utterance.lower().strip()
        updates = {}

        # 1. Verification Check
        if self.state.customer_verified is None:
            if any(p in text for p in ["yes", "speaking", "this is", "myself", "haan", "bol raha hoon", "bol rahi hoon", "sahi hai"]):
                self.state.customer_verified = True
                updates["customer_verified"] = True
                self.state.current_phase = "OFFER"
            elif any(p in text for p in ["wrong number", "not rahul", "no", "nahi hoon", "galat number"]):
                self.state.customer_verified = False
                updates["customer_verified"] = False
                self.state.call_ended = True
                self.state.current_phase = "ENDED"
                return updates

        # 2. Busy Customer Check
        busy_patterns = ["busy", "meeting", "driving", "driving now", "call later", "call back", "not a good time", "can't talk", "cannot talk", "abhi busy"]
        if any(p in text for p in busy_patterns) and not self.state.customer_busy:
            self.state.customer_busy = True
            self.state.current_phase = "BUSY"
            updates["customer_busy"] = True
            return updates

        if self.state.customer_busy and self.state.callback_time is None:
            # Capture callback time
            self.state.callback_time = utterance
            self.state.call_ended = True
            self.state.current_phase = "ENDED"
            updates["callback_time"] = utterance
            return updates

        # 3. Transfer Logic Switch (Existing Loan / EMI Reduction)
        transfer_keywords = [
            "existing loan", "already have a loan", "already have loan", "current loan",
            "running loan", "reduce emi", "reduce my emi", "lower emi", "transfer loan",
            "balance transfer", "loan chal raha hai", "emi kam"
        ]
        if any(p in text for p in transfer_keywords):
            self.state.transfer_required = True
            self.state.transfer_reason = "Customer has existing loan / requested EMI reduction"
            self.state.call_ended = True
            self.state.current_phase = "TRANSFER"
            updates["transfer_required"] = True
            return updates

        # 4. Property Type Extraction
        if "agricultural" in text or "agriculture" in text or "farmland" in text or "kheti" in text:
            self.state.property_type = "Agricultural"
            self.state.disqualified = True
            self.state.disqualification_reason = "Agricultural properties are not eligible for this LAP offer."
            self.state.call_ended = True
            self.state.current_phase = "DISQUALIFIED"
            updates["property_type"] = "Agricultural"
            return updates
        elif "commercial" in text or "shop" in text or "office" in text or "dukan" in text:
            self.state.property_type = "Commercial"
            updates["property_type"] = "Commercial"
        elif "industrial" in text or "factory" in text or "warehouse" in text or "karkhana" in text:
            self.state.property_type = "Industrial"
            updates["property_type"] = "Industrial"
        elif any(p in text for p in ["residential", "house", "flat", "apartment", "home", "villa", "makan", "ghar"]):
            self.state.property_type = "Residential"
            updates["property_type"] = "Residential"

        # 5. Ownership Status Extraction
        if "joint" in text or "with my wife" in text or "with my brother" in text or "with partner" in text or "jointly" in text or "family" in text:
            self.state.ownership_status = "Joint"
            updates["ownership_status"] = "Joint"
        elif "sole" in text or "own" in text or "only me" in text or "single" in text or "myself" in text or "mera hi hai":
            self.state.ownership_status = "Sole"
            updates["ownership_status"] = "Sole"

        # 6. Document Availability Extraction
        if "original" in text or "available at home" in text or "in locker" in text or "ready" in text or "have papers" in text or "original papers" in text:
            if "photocopy" not in text and "no original" not in text and "lost" not in text:
                self.state.original_documents = "Available"
                updates["original_documents"] = "Available"
        if "photocopy" in text or "only photocopy" in text or "xerox" in text or "lost" in text or "unavailable" in text or "don't have original" in text:
            self.state.original_documents = "Unavailable"
            self.state.disqualified = True
            self.state.disqualification_reason = "Original documents are strictly required for verification."
            self.state.call_ended = True
            self.state.current_phase = "DISQUALIFIED"
            updates["original_documents"] = "Unavailable"
            return updates

        # 7. Loan Amount & Cap Handling
        if self.state.loan_amount_pending_cap_consent:
            if any(p in text for p in ["yes", "proceed", "fine", "ok", "okay", "haan", "chalega", "sure"]):
                self.state.loan_amount = 7500000.0
                self.state.loan_amount_pending_cap_consent = False
                updates["loan_amount"] = 7500000.0
            elif any(p in text for p in ["no", "won't work", "need more", "nahi", "not enough"]):
                self.state.disqualified = True
                self.state.disqualification_reason = "Customer requirement exceeds the maximum offer limit of 75 Lakhs."
                self.state.call_ended = True
                self.state.current_phase = "DISQUALIFIED"
                updates["loan_amount_rejected"] = True
                return updates

        amount_match = re.search(r'(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|cr|crore|crores)?', text)
        if amount_match and not self.state.loan_amount:
            val = float(amount_match.group(1))
            unit = amount_match.group(2) or "lakh"
            if "cr" in unit:
                numeric_val = val * 10000000
            else:
                numeric_val = val * 100000

            # Guard against capturing market value as loan amount if phrased as property worth
            if "worth" not in text and "market value" not in text and "price" not in text:
                if numeric_val > 7500000:
                    self.state.loan_amount_raw = f"{val} {unit}"
                    self.state.loan_amount_pending_cap_consent = True
                    updates["loan_amount_pending_cap"] = self.state.loan_amount_raw
                else:
                    self.state.loan_amount = numeric_val
                    updates["loan_amount"] = numeric_val

        # 8. Occupation & Income Mode Extraction
        if "salaried" in text or "job" in text or "employed" in text or "working in" in text:
            self.state.occupation = "Salaried"
            updates["occupation"] = "Salaried"
        elif "business" in text or "self employed" in text or "self-employed" in text or "freelance" in text or "dukan" in text or "shopkeeper" in text:
            self.state.occupation = "Self-Employed"
            updates["occupation"] = "Self-Employed"

        if "cash" in text or "in hand" in text:
            self.state.income_mode = "Cash"
            self.state.disqualified = True
            self.state.disqualification_reason = "Income must be received via bank account. Cash income is not eligible."
            self.state.call_ended = True
            self.state.current_phase = "DISQUALIFIED"
            updates["income_mode"] = "Cash"
            return updates
        elif "bank" in text or "account" in text or "transfer" in text or "direct deposit" in text or "neft" in text:
            self.state.income_mode = "Bank"
            updates["income_mode"] = "Bank"

        # 9. Market Value Extraction
        mv_match = re.search(r'(?:worth|value|around|property is)\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|cr|crore|crores)?', text)
        if mv_match and not self.state.market_value:
            v = mv_match.group(1)
            u = mv_match.group(2) or "lakhs"
            self.state.market_value = f"{v} {u}"
            updates["market_value"] = self.state.market_value
        elif any(w in text for w in ["crore", "lakh"]) and ("worth" in text or "market" in text):
            self.state.market_value = utterance.strip()
            updates["market_value"] = self.state.market_value

        # 10. Repayment Tenure Extraction
        tenure_match = re.search(r'(\d+)\s*(?:years|year|saal)', text)
        if tenure_match:
            yrs = int(tenure_match.group(1))
            self.state.tenure = yrs
            updates["tenure"] = yrs
            if yrs < 3 or yrs > 15:
                self.state.disqualified = True
                self.state.disqualification_reason = f"Repayment tenure of {yrs} years is outside the eligible 3-15 years window."
                self.state.call_ended = True
                self.state.current_phase = "DISQUALIFIED"
                return updates

        # Check for qualification completion
        if self.is_fully_qualified():
            self.state.handoff_ready = True
            self.state.call_ended = True
            self.state.current_phase = "HANDOFF"
            updates["handoff_ready"] = True

        return updates
