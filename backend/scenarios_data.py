SCENARIOS = [
    {
        "id": "TC-01",
        "title": "Happy Path: Fully Eligible Lead",
        "category": "Qualification",
        "description": "Tests full end-to-end qualification across all 7 items resulting in senior expert handoff.",
        "utterances": [
            "Yes, Rahul Sharma speaking.",
            "Sure, tell me more about this offer.",
            "It is a residential flat.",
            "I am the sole owner.",
            "Yes, all original documents are safely kept at home.",
            "I am looking for around 50 Lakhs.",
            "I am salaried, and my income is directly credited to my bank account.",
            "The property is worth approximately 1.2 Crore.",
            "I want a repayment tenure of 10 years."
        ],
        "expected_result": "Handoff to Senior Loan Expert"
    },
    {
        "id": "TC-02",
        "title": "Agricultural Property Disqualification",
        "category": "Disqualification",
        "description": "Customer specifies agricultural land; agent must disqualify immediately and end call.",
        "utterances": [
            "Yes, this is Rahul.",
            "Okay, sounds good.",
            "Actually, it is an agricultural farmland in Punjab."
        ],
        "expected_result": "Immediate Disqualification at Item 1"
    },
    {
        "id": "TC-03",
        "title": "Cash Income Disqualification",
        "category": "Disqualification",
        "description": "Customer receives income in cash; agent must terminate qualification.",
        "utterances": [
            "Speaking.",
            "Sure, what are the details?",
            "It's a commercial shop.",
            "Sole owner.",
            "Yes, original deed is in bank locker.",
            "Around 40 Lakhs.",
            "I run a local shop and take all my earnings in cash."
        ],
        "expected_result": "Immediate Disqualification at Item 5"
    },
    {
        "id": "TC-04",
        "title": "Missing Original Documents Disqualification",
        "category": "Disqualification",
        "description": "Customer only has photocopies; originals are lost or unavailable.",
        "utterances": [
            "Yes, Rahul speaking.",
            "Go ahead.",
            "It's a residential house.",
            "Jointly owned with my wife.",
            "I only have photocopies, original papers are misplaced."
        ],
        "expected_result": "Immediate Disqualification at Item 3"
    },
    {
        "id": "TC-05",
        "title": "Tenure Too Short (<3 Years)",
        "category": "Disqualification",
        "description": "Repayment tenure requested is 2 years (outside 3-15 years window).",
        "utterances": [
            "Yes speaking.",
            "Okay.",
            "Residential apartment.",
            "Sole owner.",
            "Originals available at home.",
            "25 Lakhs.",
            "Salaried through bank transfer.",
            "Around 60 Lakhs.",
            "I want to clear it quickly in 2 years."
        ],
        "expected_result": "Immediate Disqualification at Item 7"
    },
    {
        "id": "TC-06",
        "title": "Loan Amount > ₹75L Capped (Accepted)",
        "category": "Cap Handling",
        "description": "Customer asks for 90 Lakhs; agent offers 75L maximum cap; customer agrees to proceed.",
        "utterances": [
            "Yes, Rahul here.",
            "Tell me more.",
            "Residential villa.",
            "Sole owner.",
            "Originals available.",
            "I need 90 Lakhs.",
            "Yes, 75 Lakhs works for me, let's proceed.",
            "Salaried, salary comes in HDFC bank account.",
            "Property worth is 1.8 Crore.",
            "12 years tenure."
        ],
        "expected_result": "Qualified at ₹75L Cap -> Handoff"
    },
    {
        "id": "TC-07",
        "title": "Existing Loan on Property (Transfer Switch)",
        "category": "Transfer Switch",
        "description": "Customer has an existing loan running; agent must immediately transfer to specialist.",
        "utterances": [
            "Speaking, yes.",
            "Actually, I already have an existing running loan on this property from SBI."
        ],
        "expected_result": "Transfer to Loan Transfer Specialist -> End Call"
    },
    {
        "id": "TC-08",
        "title": "EMI Reduction Request (Transfer Switch)",
        "category": "Transfer Switch",
        "description": "Customer asks to lower their current EMI; agent routes to transfer specialist.",
        "utterances": [
            "Yes Rahul here.",
            "I already have a mortgage and I really want to reduce my monthly EMI."
        ],
        "expected_result": "Transfer to Loan Transfer Specialist -> End Call"
    },
    {
        "id": "TC-09",
        "title": "Compound Out-of-Order Slot Filling",
        "category": "Slot Filling",
        "description": "Customer provides property type, ownership, and market value in a single sentence.",
        "utterances": [
            "Yes speaking.",
            "Yes, tell me.",
            "It's a residential apartment, jointly owned with my spouse, and currently worth about 90 Lakhs.",
            "Yes, original title deeds are available with me.",
            "45 Lakhs.",
            "Self-employed with all business revenue deposited into bank.",
            "7 years tenure."
        ],
        "expected_result": "Slots Extracted Correctly -> Handoff"
    },
    {
        "id": "TC-10",
        "title": "Busy Customer Flow",
        "category": "Busy Flow",
        "description": "Customer indicates they are driving/busy; agent captures callback time and ends call.",
        "utterances": [
            "Yes, but I am in an important client meeting right now and cannot talk.",
            "Please call me tomorrow at 4 PM."
        ],
        "expected_result": "Callback Scheduled -> End Call"
    }
]
