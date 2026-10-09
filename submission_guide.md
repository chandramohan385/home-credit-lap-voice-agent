# Home Credit AI Voice Agent - Setup & Submission Guide

This guide walks you through deploying your prompt on **Retell AI** (or Bolna), conducting test calls with audio recordings, and preparing your final assignment submission.

---

## 1. Voice Platform Setup (Retell AI Recommended)

Retell AI offers a free trial with free credits, natural speech latency (<600ms), and built-in public share links for call recordings and transcripts.

### Step 1: Sign Up
1. Go to [https://www.retellai.com/](https://www.retellai.com/) and click **Start for Free**.
2. Sign in with Google or GitHub.

### Step 2: Create a New Voice Agent
1. From the dashboard, navigate to **Agents** and click **Create New Agent**.
2. Select **Prompt-based Agent** (or Custom LLM / Retell LLM).
3. Set the LLM to **GPT-4o** or **Claude 3.5 Sonnet**.
4. Set the **Temperature** to **0.1 or 0.2** (Low temperature ensures strict adherence to eligibility rules).

### Step 3: Configure Voice & Gender
1. Select a voice that strictly matches your `{{agent_gender}}` setting:
   - For Female (`agent_gender = Female`): Choose a professional Indian English voice (e.g., *Priya*, *Neerja*, or a clear neutral Indian English voice on ElevenLabs / Cartesia).
   - For Male (`agent_gender = Male`): Choose a professional Indian English voice (e.g., *Arun*, *Rohan*).
2. Adjust responsiveness/latency settings:
   - Turn sensitivity: Medium
   - Interruptibility: Enabled (so the agent pauses when the customer speaks).

### Step 4: Paste the System Prompt
1. Open [`system_prompt.md`](file:///c:/Users/A%20chandra%20mohan/OneDrive/Desktop/SalesAgents%20AI%20-%20AI%20Intern%20Assignment/system_prompt.md).
2. Copy the full prompt text into the **General Prompt / Instructions** box.
3. Configure the dynamic variables in Retell AI:
   - In Retell AI's dynamic variables or test configuration, you can specify default test values:
     - `company_name`: `Home Credit`
     - `agent_name`: `Priya` (or your chosen name)
     - `agent_gender`: `Female` (or `Male`)
     - `customer_name`: `Rahul Sharma`
     - `current_day`: `Friday`
     - `current_date`: `October 9, 2026`
     - `current_time`: `3:30 PM`
     - `language_to_speak`: `English`
     - `additional_context_from_rag`: `Home Credit offers competitive personal finance and Loan Against Property options with quick processing and transparent documentation across all major cities in India.`

---

## 2. Conducting Test Calls

Retell AI allows you to test directly from your browser using **Web Call** (no actual phone number required for testing):

1. Click **Test Agent** or **Web Call** in the top-right corner.
2. Ensure your microphone is enabled.
3. Conduct calls referencing the test scripts in [`test_scenarios.md`](file:///c:/Users/A%20chandra%20mohan/OneDrive/Desktop/SalesAgents%20AI%20-%20AI%20Intern%20Assignment/test_scenarios.md):
   - **Call 1 (Primary Submission)**: **Test 1 - Perfect Eligible Customer** (Full Happy Path).
   - **Call 2**: **Test 2 - Agricultural Disqualification** or **Test 3 - Cash Income Disqualification**.
   - **Call 3**: **Test 9 - Existing Loan / Transfer Switch**.
   - **Call 4**: **Test 11 - Out-of-Order / Compound Slot Filling**.

---

## 3. Capturing Call Recordings & Public Links

After completing each call in Retell AI:
1. Navigate to the **Call History** or **Call Logs** tab on the dashboard.
2. Click on the call you just completed.
3. You will see:
   - Full audio player with playback.
   - Complete speech-to-text transcript with timestamps.
   - Latency metrics and LLM token usage.
4. Click the **Share** button (or **Public Link**) at the top right of the call log.
5. Set permissions to **Public / Anyone with the link can view**.
6. Copy the URL.

---

## 4. Final Submission Package Structure

When you submit to the hiring team, structure your response cleanly:

```markdown
# Submission: AI Voice Agent (Prompt Engineer) - Home Credit LAP Qualification

Candidate Name: [Your Name]
Position: AI Intern (Prompt Engineer)

### 1. System Prompt
[Paste text from system_prompt.md or attach the file]

### 2. Platform & Model Architecture
- Voice Platform: Retell AI
- LLM: GPT-4o / Claude 3.5 Sonnet (Temp: 0.1)
- Voice Engine: Indian English (Cartesia / ElevenLabs)

### 3. Public Call Logs & Recordings
- Test Call 1 (Happy Path - Fully Qualified Lead): [Public Link to Retell Call Log]
- Test Call 2 (Immediate Disqualification - Agricultural): [Public Link to Retell Call Log]
- Test Call 3 (Transfer Switch - Existing Loan): [Public Link to Retell Call Log]
- Test Call 4 (Out-of-Order Compound Slot Filling): [Public Link to Retell Call Log]

### 4. Test Summary & Edge-Case Validation
(Brief summary table showing tested scenarios, customer inputs, and agent compliance)
```
