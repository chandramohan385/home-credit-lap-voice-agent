// State Machine and Dialogue Engine for Home Credit LAP Voice Agent (Browser Client)

export const INITIAL_STATE = {
  customer_verified: null,
  customer_busy: false,
  callback_time: null,
  transfer_required: false,
  transfer_reason: null,
  
  // 7 Checklist items
  property_type: null,          // Residential, Commercial, Industrial, Agricultural
  ownership_status: null,       // Sole, Joint
  original_documents: null,     // Available, Unavailable
  loan_amount: null,            // <= 7500000
  loan_amount_raw: null,
  loan_amount_pending_cap_consent: false,
  occupation: null,             // Salaried, Self-Employed
  income_mode: null,            // Bank, Cash
  market_value: null,           // Estimated value
  tenure: null,                 // 3 to 15 years
  
  disqualified: false,
  disqualification_reason: null,
  handoff_ready: false,
  call_ended: false,
  current_phase: "GREETING"     // GREETING, BUSY, OFFER, QUALIFICATION, DISQUALIFIED, TRANSFER, HANDOFF, ENDED
};

export const CHECKLIST_ITEMS = [
  { id: 1, key: "property_type", label: "Property Type", rule: "Residential, Commercial, Industrial (Agri = Fail)" },
  { id: 2, key: "ownership_status", label: "Ownership Status", rule: "Sole or Joint" },
  { id: 3, key: "original_documents", label: "Original Documents", rule: "Originals Available (Xerox = Fail)" },
  { id: 4, key: "loan_amount", label: "Loan Amount", rule: "Up to ₹75 Lakhs (>75L = Cap Offer)" },
  { id: 5, key: "occupation_income", label: "Occupation & Mode", rule: "Salaried/Self-Employed + Bank Mode (Cash = Fail)" },
  { id: 6, key: "market_value", label: "Market Value", rule: "Customer Estimated Value" },
  { id: 7, key: "tenure", label: "Repayment Tenure", rule: "3 to 15 Years (<3 or >15 = Fail)" },
];

export function getEarliestMissingItem(state) {
  if (!state.property_type) return 1;
  if (!state.ownership_status) return 2;
  if (!state.original_documents) return 3;
  if (state.loan_amount === null && !state.loan_amount_pending_cap_consent) return 4;
  if (!state.occupation || !state.income_mode) return 5;
  if (!state.market_value) return 6;
  if (state.tenure === null) return 7;
  return null;
}

export function isFullyQualified(state) {
  if (state.disqualified || state.transfer_required) return false;
  return (
    ["Residential", "Commercial", "Industrial"].includes(state.property_type) &&
    ["Sole", "Joint"].includes(state.ownership_status) &&
    state.original_documents === "Available" &&
    state.loan_amount !== null && state.loan_amount <= 7500000 &&
    ["Salaried", "Self-Employed"].includes(state.occupation) &&
    state.income_mode === "Bank" &&
    state.market_value !== null &&
    state.tenure !== null && (state.tenure >= 3 && state.tenure <= 15)
  );
}

export function getQuestionForItem(itemIndex, state) {
  const questions = {
    1: "Could you tell me if your property is residential, commercial, or industrial?",
    2: "Are you the sole owner of the property, or is it jointly owned?",
    3: "Do you have the original property documents available for verification?",
    4: "How much loan amount are you looking to borrow?",
    5: "Are you salaried or self-employed, and do you receive your income through bank transfer or in cash?",
    6: "What is the approximate current market value of your property?",
    7: "Over how many years would you prefer to repay the loan?"
  };

  if (itemIndex === 5) {
    if (state.occupation && !state.income_mode) {
      return "Understood. And is your income received directly into your bank account or in cash?";
    } else if (state.income_mode && !state.occupation) {
      return "Great. And are you currently salaried or self-employed?";
    }
  }

  return questions[itemIndex] || "Could you share the remaining property details?";
}

export function processTurn(currentState, utterance, config) {
  const state = { ...currentState };
  const text = (utterance || "").toLowerCase().trim();
  const prevPhase = state.current_phase;

  // 1. Identity Verification
  if (state.customer_verified === null) {
    if (["yes", "speaking", "this is", "myself", "haan", "bol raha hoon", "bol rahi hoon", "sahi hai"].some(p => text.includes(p))) {
      state.customer_verified = true;
      state.current_phase = "OFFER";
    } else if (["wrong number", "not rahul", "no", "nahi hoon", "galat number"].some(p => text.includes(p))) {
      state.customer_verified = false;
      state.call_ended = true;
      state.current_phase = "ENDED";
      return {
        state,
        response: "I apologize for the disturbance. Have a great day!",
        is_ended: true
      };
    }
  }

  // 2. Busy Customer Check
  const busyKeywords = ["busy", "meeting", "driving", "driving now", "call later", "call back", "not a good time", "can't talk", "cannot talk", "abhi busy"];
  if (busyKeywords.some(p => text.includes(p)) && !state.customer_busy) {
    state.customer_busy = true;
    state.current_phase = "BUSY";
    return {
      state,
      response: "I completely understand. What would be a convenient time for us to call you back?",
      is_ended: false
    };
  }

  if (state.customer_busy && !state.callback_time) {
    state.callback_time = utterance;
    state.call_ended = true;
    state.current_phase = "ENDED";
    return {
      state,
      response: `Thank you, ${config.customer_name}. We will schedule a callback for ${utterance}. Have a wonderful day!`,
      is_ended: true
    };
  }

  // 3. Transfer Logic Switch (Existing Loan / EMI Reduction)
  const transferKeywords = [
    "existing loan", "already have a loan", "already have loan", "current loan",
    "running loan", "reduce emi", "reduce my emi", "lower emi", "transfer loan",
    "balance transfer", "loan chal raha hai", "emi kam"
  ];
  if (transferKeywords.some(p => text.includes(p))) {
    state.transfer_required = true;
    state.transfer_reason = "Customer has existing loan or requested EMI reduction";
    state.call_ended = true;
    state.current_phase = "TRANSFER";
    return {
      state,
      response: "Thank you for letting me know. Since you already have an existing loan on this property, this will be handled directly by our Loan Transfer Specialist. A specialist will contact you shortly to assist with this transfer. Thank you for your time!",
      is_ended: true
    };
  }

  // 4. Property Type Extraction
  if (["agricultural", "agriculture", "farmland", "kheti"].some(p => text.includes(p))) {
    state.property_type = "Agricultural";
    state.disqualified = true;
    state.disqualification_reason = "Agricultural properties are not eligible for this LAP offer.";
    state.call_ended = true;
    state.current_phase = "DISQUALIFIED";
    return {
      state,
      response: `I understand. Unfortunately, our current offer does not cover agricultural properties, so we won't be able to proceed at this time. Thank you so much for your time, ${config.customer_name}, and have a great day.`,
      is_ended: true
    };
  } else if (["commercial", "shop", "office", "dukan"].some(p => text.includes(p))) {
    state.property_type = "Commercial";
  } else if (["industrial", "factory", "warehouse", "karkhana"].some(p => text.includes(p))) {
    state.property_type = "Industrial";
  } else if (["residential", "house", "flat", "apartment", "home", "villa", "makan", "ghar"].some(p => text.includes(p))) {
    state.property_type = "Residential";
  }

  // 5. Ownership Status
  if (["joint", "with my wife", "with my brother", "with partner", "jointly", "family"].some(p => text.includes(p))) {
    state.ownership_status = "Joint";
  } else if (["sole", "own", "only me", "single", "myself", "mera hi hai"].some(p => text.includes(p))) {
    state.ownership_status = "Sole";
  }

  // 6. Documents Availability
  if (["photocopy", "only photocopy", "xerox", "lost", "unavailable", "don't have original"].some(p => text.includes(p))) {
    state.original_documents = "Unavailable";
    state.disqualified = true;
    state.disqualification_reason = "Original documents are strictly required for verification.";
    state.call_ended = true;
    state.current_phase = "DISQUALIFIED";
    return {
      state,
      response: `I see. Original documents are mandatory for verification to process this loan, so we won't be able to proceed further at this time. Thank you for your time, ${config.customer_name}.`,
      is_ended: true
    };
  } else if (["original", "available at home", "in locker", "ready", "have papers", "original papers"].some(p => text.includes(p))) {
    state.original_documents = "Available";
  }

  // 7. Loan Amount & Cap Consent
  if (state.loan_amount_pending_cap_consent) {
    if (["yes", "proceed", "fine", "ok", "okay", "haan", "chalega", "sure"].some(p => text.includes(p))) {
      state.loan_amount = 7500000;
      state.loan_amount_pending_cap_consent = false;
    } else if (["no", "won't work", "need more", "nahi", "not enough"].some(p => text.includes(p))) {
      state.disqualified = true;
      state.disqualification_reason = "Customer requirement exceeds the maximum offer limit of 75 Lakhs.";
      state.call_ended = true;
      state.current_phase = "DISQUALIFIED";
      return {
        state,
        response: "We understand. Since your requirement exceeds our maximum limit, we won't be able to proceed with this offer today. Thank you for your time.",
        is_ended: true
      };
    }
  }

  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|cr|crore|crores)?/);
  if (amountMatch && state.loan_amount === null && !state.loan_amount_pending_cap_consent) {
    if (!text.includes("worth") && !text.includes("market value") && !text.includes("price")) {
      const val = parseFloat(amountMatch[1]);
      const unit = amountMatch[2] || "lakh";
      const numericVal = unit.includes("cr") ? val * 10000000 : val * 100000;

      if (numericVal > 7500000) {
        state.loan_amount_raw = `${val} ${unit}`;
        state.loan_amount_pending_cap_consent = true;
        return {
          state,
          response: "Our pre-approved offer has a maximum limit of 75 Lakh rupees. Would you like to proceed with the maximum amount of 75 Lakhs?",
          is_ended: false
        };
      } else {
        state.loan_amount = numericVal;
      }
    }
  }

  // 8. Occupation & Income Mode
  if (["salaried", "job", "employed", "working in"].some(p => text.includes(p))) {
    state.occupation = "Salaried";
  } else if (["business", "self employed", "self-employed", "freelance", "dukan", "shopkeeper"].some(p => text.includes(p))) {
    state.occupation = "Self-Employed";
  }

  if (["cash", "in hand"].some(p => text.includes(p))) {
    state.income_mode = "Cash";
    state.disqualified = true;
    state.disqualification_reason = "Income must be received via bank account. Cash income is not eligible.";
    state.call_ended = true;
    state.current_phase = "DISQUALIFIED";
    return {
      state,
      response: "I understand. As per our lending policy, income must be routed through a bank account, so we cannot proceed with cash income. Thank you for speaking with us today.",
      is_ended: true
    };
  } else if (["bank", "account", "transfer", "direct deposit", "neft"].some(p => text.includes(p))) {
    state.income_mode = "Bank";
  }

  // 9. Market Value
  const mvMatch = text.match(/(?:worth|value|around|property is)\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|cr|crore|crores)?/);
  if (mvMatch && !state.market_value) {
    state.market_value = `${mvMatch[1]} ${mvMatch[2] || "Lakhs"}`;
  } else if ((text.includes("crore") || text.includes("lakh")) && (text.includes("worth") || text.includes("market"))) {
    state.market_value = utterance.trim();
  }

  // 10. Repayment Tenure
  const tenureMatch = text.match(/(\d+)\s*(?:years|year|saal)/);
  if (tenureMatch) {
    const yrs = parseInt(tenureMatch[1], 10);
    state.tenure = yrs;
    if (yrs < 3 || yrs > 15) {
      state.disqualified = true;
      state.disqualification_reason = `Repayment tenure of ${yrs} years is outside the eligible 3-15 years window.`;
      state.call_ended = true;
      state.current_phase = "DISQUALIFIED";
      return {
        state,
        response: `Our repayment tenure ranges strictly between 3 to 15 years, so we cannot offer that specific tenure under this scheme. Thank you for your time, ${config.customer_name}.`,
        is_ended: true
      };
    }
  }

  // Check if fully qualified
  if (isFullyQualified(state)) {
    state.handoff_ready = true;
    state.call_ended = true;
    state.current_phase = "HANDOFF";
    return {
      state,
      response: `Congratulations, ${config.customer_name}! Based on the details provided, you meet all preliminary criteria for our Loan Against Property offer. A senior loan expert will call you shortly to discuss the exact interest rates and finalize your application. Thank you for banking with ${config.company_name}, and have a wonderful day!`,
      is_ended: true
    };
  }

  // Presentation of offer if fresh
  if (prevPhase === "GREETING" && state.current_phase === "OFFER") {
    state.current_phase = "QUALIFICATION";
    const nextQ = getQuestionForItem(getEarliestMissingItem(state), state);
    return {
      state,
      response: `As one of our valued customers, ${config.company_name} is pleased to inform you that you have a pre-approved Loan Against Property offer of up to 75 Lakh rupees as a loyalty reward. I'd just like to check a few quick details to see if this suits your requirements. ${nextQ}`,
      is_ended: false
    };
  }

  // Slot-filling: Ask earliest missing item
  const nextItem = getEarliestMissingItem(state);
  return {
    state,
    response: getQuestionForItem(nextItem, state),
    is_ended: false
  };
}
