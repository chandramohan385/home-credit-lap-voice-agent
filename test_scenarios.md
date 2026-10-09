# Home Credit LAP Voice Agent - Test Suite & Verification Matrix

This document outlines **12 rigorous test scenarios** designed to validate every business rule, logic branch, edge case, and slot-filling capability of the AI Voice Agent before submitting the assignment.

---

## Summary of Test Coverage

| Test ID | Scenario Description | Expected Outcome | Critical Checkpoint |
| :--- | :--- | :--- | :--- |
| **TC-01** | Happy Path: Perfect Eligible Lead | **QUALIFIED -> HANDOFF** | All 7 items captured; warm handoff |
| **TC-02** | Disqualification: Agricultural Property | **DISQUALIFIED -> CALL END** | Stops immediately after Q1; no further questions |
| **TC-03** | Disqualification: Cash Income Mode | **DISQUALIFIED -> CALL END** | Disqualifies at Q5; bank income required |
| **TC-04** | Disqualification: Missing Original Documents | **DISQUALIFIED -> CALL END** | Disqualifies at Q3; photocopies rejected |
| **TC-05** | Disqualification: Tenure Too Short (<3 Years) | **DISQUALIFIED -> CALL END** | Disqualifies at Q7 for 2-year tenure |
| **TC-06** | Disqualification: Tenure Too Long (>15 Years) | **DISQUALIFIED -> CALL END** | Disqualifies at Q7 for 20-year tenure |
| **TC-07A**| Loan Amount > ₹75L (Customer Accepts Cap) | **QUALIFIED -> HANDOFF** | Explains ₹75L cap; customer accepts ₹75L |
| **TC-07B**| Loan Amount > ₹75L (Customer Rejects Cap) | **DISQUALIFIED -> CALL END** | Customer insists on >₹75L; polite exit |
| **TC-08** | Joint Ownership Qualification | **QUALIFIED -> HANDOFF** | Confirms Joint ownership is fully eligible |
| **TC-09** | Existing Property Loan Switch | **TRANSFER TO SPECIALIST** | Bypasses Q1-Q7 completely; transfers to specialist |
| **TC-10** | EMI Reduction Request Switch | **TRANSFER TO SPECIALIST** | Bypasses Q1-Q7 completely; transfers to specialist |
| **TC-11** | Out-of-Order & Compound Information | **QUALIFIED -> HANDOFF** | Extracts 3 slots in 1 sentence; asks only missing |
| **TC-12** | Busy Customer Flow | **SCHEDULE CALLBACK -> CALL END** | Asks preferred callback time; does not pitch |
| **TC-13** | Adversarial Contradiction Test | **DISQUALIFIED -> CALL END** | Latest correction overrides earlier pass |

---

## Detailed Test Scenarios & Scripts

### Test 1: Perfect Eligible Lead (Happy Path)
* **Goal**: Verify full end-to-end qualification and transition to senior loan expert.
* **Customer Profile**:
  - Name: Rahul Sharma
  - Property Type: Residential
  - Ownership: Sole
  - Documents: Originals available at home
  - Loan Amount: 50 Lakhs
  - Occupation & Mode: Salaried, received via Bank
  - Market Value: 1.2 Crore
  - Tenure: 10 years
* **Conversation Script**:
  - **Agent**: "Hello, may I speak with Rahul Sharma?"
  - **User**: "Yes, speaking."
  - **Agent**: [Presents LAP offer up to 75 Lakhs]
  - **User**: "Sure, tell me more."
  - **Agent**: "Could you tell me if your property is residential, commercial, or industrial?"
  - **User**: "It is a residential flat."
  - **Agent**: "Are you the sole owner of the property, or is it jointly owned?"
  - **User**: "I am the sole owner."
  - **Agent**: "Do you have the original property documents available for verification?"
  - **User**: "Yes, all original documents are safely kept at home."
  - **Agent**: "How much loan amount are you looking to borrow?"
  - **User**: "Around 50 Lakhs."
  - **Agent**: "Are you salaried or self-employed, and do you receive your income through bank transfer or in cash?"
  - **User**: "I'm salaried with a tech company, and my salary comes directly into my bank."
  - **Agent**: "What is the approximate current market value of your property?"
  - **User**: "Around 1 Crore 20 Lakhs."
  - **Agent**: "Over how many years would you prefer to repay the loan?"
  - **User**: "10 years."
* **Expected Outcome**: Agent congratulates the customer and states a senior loan expert will call back to discuss exact rates. Call ends cleanly.

---

### Test 2: Immediate Disqualification - Agricultural Land
* **Goal**: Verify immediate termination when property is agricultural.
* **Conversation Script**:
  - **Agent**: "Could you tell me if your property is residential, commercial, or industrial?"
  - **User**: "Actually, it's agricultural land in my hometown."
* **Expected Agent Response**: Polite disqualification explaining that agricultural properties are not covered under this offer, followed by an immediate call termination.
* **Negative Check**: Agent must NOT ask question 2 (ownership) or continue the pitch.

---

### Test 3: Immediate Disqualification - Cash Income Mode
* **Goal**: Verify cash income rule enforcement.
* **Conversation Script**:
  - Steps 1-4 pass.
  - **Agent**: "Are you salaried or self-employed, and do you receive your income through bank transfer or in cash?"
  - **User**: "I run a wholesale shop, but all my earnings are taken in cash."
* **Expected Agent Response**: Politely informs the customer that income must be routed through a bank account, wishes them well, and terminates the call.

---

### Test 4: Immediate Disqualification - Only Photocopies
* **Goal**: Verify that lack of original documents triggers disqualification.
* **Conversation Script**:
  - Steps 1-2 pass.
  - **Agent**: "Do you have the original property documents available for verification?"
  - **User**: "I only have scanned photocopies, the originals are lost."
* **Expected Agent Response**: Explains that original documents are mandatory for verification and terminates the call.

---

### Test 5 & 6: Tenure Boundary Rejections (<3 Years / >15 Years)
* **Goal**: Validate strict 3-15 years boundary rule.
* **Script A (<3 yrs)**:
  - **Agent**: "Over how many years would you prefer to repay the loan?"
  - **User**: "I want to finish it quickly in 2 years."
  - **Expected**: Disqualification (tenure must be between 3 and 15 years) -> End call.
* **Script B (>15 yrs)**:
  - **Agent**: "Over how many years would you prefer to repay the loan?"
  - **User**: "Can I get a 20-year or 25-year tenure?"
  - **Expected**: Disqualification (tenure cannot exceed 15 years) -> End call.

---

### Test 7A & 7B: Loan Amount > ₹75 Lakhs Capping Rule
* **Goal**: Ensure the agent offers the ₹75 Lakh cap instead of an outright rejection.
* **Script 7A (Acceptance)**:
  - **Agent**: "How much loan amount are you looking to borrow?"
  - **User**: "I need around 90 Lakhs."
  - **Expected Agent**: "Our pre-approved offer has a maximum limit of 75 Lakh rupees. Would you like to proceed with the maximum amount of 75 Lakhs?"
  - **User**: "Yes, 75 Lakhs would work for me."
  - **Expected Agent**: Records loan amount as 75 Lakhs and proceeds to Question 5.
* **Script 7B (Refusal)**:
  - **User**: "No, I strictly need 90 Lakhs, 75 won't be enough."
  - **Expected Agent**: Acknowledges requirement exceeds limit, concludes politely, and ends call.

---

### Test 8: Joint Ownership Verification
* **Goal**: Confirm that Joint Ownership is NOT disqualified.
* **Conversation Script**:
  - **Agent**: "Are you the sole owner of the property, or is it jointly owned?"
  - **User**: "It is jointly registered under my name and my spouse's name."
* **Expected Agent Response**: Accepts joint ownership as eligible and proceeds seamlessly to question 3 (original documents).

---

### Test 9: Transfer Switch - Existing Loan on Property
* **Goal**: Verify that an active loan switches to the Transfer Specialist flow immediately.
* **Conversation Script**:
  - **Agent**: [Presents offer]
  - **User**: "Actually, I already have an existing loan running on this property with another bank."
* **Expected Agent Response**: "Thank you for letting me know. Since you already have an existing loan on this property, this will be handled directly by our Loan Transfer Specialist. A specialist will contact you shortly to assist with this transfer. Thank you for your time!"
* **Negative Check**: Agent must NOT ask questions 1 through 7. Call terminates.

---

### Test 10: Transfer Switch - EMI Reduction Request
* **Goal**: Verify that an EMI reduction request triggers the specialist transfer.
* **Conversation Script**:
  - **Agent**: [Presents offer]
  - **User**: "Can you help me reduce my current monthly EMI? It's too high."
* **Expected Agent Response**: Routes to Loan Transfer Specialist and ends call.

---

### Test 11: Out-of-Order & Compound Information (Slot Filling)
* **Goal**: Verify the "First Missing Question" algorithm when customer speaks naturally.
* **Conversation Script**:
  - **Agent**: "Could you tell me if your property is residential, commercial, or industrial?"
  - **User**: "It's a residential apartment, jointly owned with my brother, and its market value is around 90 Lakh rupees."
  - *Internal State Captured*: `property_type = Residential`, `ownership_status = Joint`, `market_value = 90 Lakhs`.
* **Expected Agent Response**: Must acknowledge and ask question 3 (Original documents):
  - *"Thank you. Do you have the original property documents available for verification?"*
* **Negative Check**: Agent must NOT re-ask "Is it jointly owned?" or "What is the market value?".

---

### Test 12: Busy Customer Flow
* **Goal**: Verify respect for customer time and callback scheduling.
* **Conversation Script**:
  - **Agent**: "Hello, may I speak with Rahul Sharma?"
  - **User**: "Hey, I'm driving right now / I am in an important client meeting, can't speak."
* **Expected Agent Response**:
  - "I completely understand. What would be a convenient time for us to call you back?"
  - **User**: "Call me tomorrow around 4 PM."
  - **Expected Agent**: "Thank you, Rahul. We will schedule a callback for then. Have a wonderful day!" -> Ends call.
* **Negative Check**: Agent must NOT pitch the 75 Lakh offer or ask eligibility questions.

---

### Test 13: Adversarial Contradiction Test
* **Goal**: Verify that mid-sentence corrections override previous eligibility.
* **Conversation Script**:
  - **Agent**: "Could you tell me if your property is residential, commercial, or industrial?"
  - **User**: "It's residential... wait, actually no, the registration says agricultural farmland."
* **Expected Agent Response**: The latest answer (`Agricultural`) overrides `Residential` and triggers immediate polite disqualification.
