export const TEST_SCENARIOS = [
  {
    id: "TC-01",
    title: "Happy Path: Fully Eligible Lead",
    category: "Full Qualification",
    badge: "PASS",
    badgeColor: "#10b981",
    description: "Tests full end-to-end qualification across all 7 items resulting in senior expert handoff.",
    utterances: [
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
    expected: "Handoff to Senior Loan Expert"
  },
  {
    id: "TC-02",
    title: "Agricultural Land Disqualification",
    category: "Disqualification",
    badge: "DISQUALIFIED",
    badgeColor: "#ef4444",
    description: "Customer specifies agricultural land; agent disqualifies immediately and stops calling.",
    utterances: [
      "Yes, this is Rahul.",
      "Okay, sounds good.",
      "Actually, it is an agricultural farmland in Punjab."
    ],
    expected: "Immediate Disqualification at Item 1"
  },
  {
    id: "TC-03",
    title: "Cash Income Disqualification",
    category: "Disqualification",
    badge: "DISQUALIFIED",
    badgeColor: "#ef4444",
    description: "Customer receives income in cash; bank mode requirement triggers termination.",
    utterances: [
      "Speaking.",
      "Sure, what are the details?",
      "It's a commercial shop.",
      "Sole owner.",
      "Yes, original deed is in bank locker.",
      "Around 40 Lakhs.",
      "I run a local shop and take all my earnings in cash."
    ],
    expected: "Immediate Disqualification at Item 5"
  },
  {
    id: "TC-04",
    title: "Missing Original Documents",
    category: "Disqualification",
    badge: "DISQUALIFIED",
    badgeColor: "#ef4444",
    description: "Customer only has photocopies; originals are lost or unavailable.",
    utterances: [
      "Yes, Rahul speaking.",
      "Go ahead.",
      "It's a residential house.",
      "Jointly owned with my wife.",
      "I only have photocopies, original papers are misplaced."
    ],
    expected: "Immediate Disqualification at Item 3"
  },
  {
    id: "TC-05",
    title: "Tenure Too Short (<3 Years)",
    category: "Disqualification",
    badge: "DISQUALIFIED",
    badgeColor: "#ef4444",
    description: "Repayment tenure requested is 2 years (outside 3-15 years window).",
    utterances: [
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
    expected: "Immediate Disqualification at Item 7"
  },
  {
    id: "TC-06",
    title: "Loan Amount > ₹75L Capped (Accepted)",
    category: "Cap Handling",
    badge: "CAPPED PASS",
    badgeColor: "#8b5cf6",
    description: "Customer requests 90 Lakhs; agent explains 75L maximum limit; customer agrees to proceed.",
    utterances: [
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
    expected: "Qualified at ₹75L Cap -> Handoff"
  },
  {
    id: "TC-07",
    title: "Existing Loan on Property (Transfer)",
    category: "Transfer Switch",
    badge: "SPECIALIST TRANSFER",
    badgeColor: "#f59e0b",
    description: "Customer already has an active loan; agent switches to loan transfer specialist.",
    utterances: [
      "Speaking, yes.",
      "Actually, I already have an existing running loan on this property from SBI."
    ],
    expected: "Transfer to Loan Transfer Specialist -> End Call"
  },
  {
    id: "TC-08",
    title: "EMI Reduction Request (Transfer)",
    category: "Transfer Switch",
    badge: "SPECIALIST TRANSFER",
    badgeColor: "#f59e0b",
    description: "Customer asks to lower their current EMI; agent routes to transfer specialist.",
    utterances: [
      "Yes Rahul here.",
      "I already have a mortgage and I really want to reduce my monthly EMI."
    ],
    expected: "Transfer to Loan Transfer Specialist -> End Call"
  },
  {
    id: "TC-09",
    title: "Compound Out-of-Order Slot Filling",
    category: "Slot Filling",
    badge: "COMPOUND PASS",
    badgeColor: "#3b82f6",
    description: "Customer provides property type, joint ownership, and market value in a single sentence.",
    utterances: [
      "Yes speaking.",
      "Yes, tell me.",
      "It's a residential apartment, jointly owned with my spouse, and currently worth about 90 Lakhs.",
      "Yes, original title deeds are available with me.",
      "45 Lakhs.",
      "Self-employed with all business revenue deposited into bank.",
      "7 years tenure."
    ],
    expected: "Slots Extracted Correctly -> Handoff"
  },
  {
    id: "TC-10",
    title: "Busy Customer Flow",
    category: "Busy Handling",
    badge: "CALLBACK SCHEDULED",
    badgeColor: "#6b7280",
    description: "Customer indicates they are busy; agent captures preferred callback time and ends call.",
    utterances: [
      "Yes, but I am in an important client meeting right now and cannot talk.",
      "Please call me tomorrow at 4 PM."
    ],
    expected: "Callback Scheduled -> End Call"
  }
];
