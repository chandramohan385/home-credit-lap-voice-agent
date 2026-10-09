import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Play, RotateCcw, Download, 
  FileText, CheckCircle2, XCircle, AlertCircle, Sparkles, 
  Settings, Bot, User, Volume2, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_STATE, CHECKLIST_ITEMS, processTurn, getEarliestMissingItem } from './stateEngine';
import { TEST_SCENARIOS } from './scenariosData';

export default function App() {
  // Agent Configuration
  const [config, setConfig] = useState({
    company_name: "Home Credit",
    customer_name: "Rahul Sharma",
    agent_name: "Priya",
    agent_gender: "Female",
    language_to_speak: "English"
  });

  // Call & State Management
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [state, setState] = useState(INITIAL_STATE);
  const [transcript, setTranscript] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const transcriptEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    let timer;
    if (callActive) {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  // Speech Recognition (Microphone) setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = config.language_to_speak === "Hindi" ? "hi-IN" : "en-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text) {
          handleCustomerUtterance(text);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [config.language_to_speak]);

  // Text-to-Speech (TTS)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language_to_speak === "Hindi" ? "hi-IN" : "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = config.agent_gender === "Female" ? 1.1 : 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start Call
  const handleStartCall = () => {
    setCallActive(true);
    setState(INITIAL_STATE);
    const opening = config.language_to_speak === "Hindi"
      ? (config.agent_gender === "Female"
          ? `Namaste! Kya meri baat ${config.customer_name} ji se ho rahi hai? Main ${config.company_name} se ${config.agent_name} bol rahi hoon.`
          : `Namaste! Kya meri baat ${config.customer_name} ji se ho rahi hai? Main ${config.company_name} se ${config.agent_name} bol raha hoon.`)
      : `Hello, may I speak with ${config.customer_name}? I am ${config.agent_name} calling from ${config.company_name}.`;

    const initialMsg = {
      speaker: "Agent",
      text: opening,
      timestamp: new Date().toLocaleTimeString()
    };
    setTranscript([initialMsg]);
    speakText(opening);
  };

  // End Call
  const handleEndCall = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    setCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (!callActive) {
      handleStartCall();
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  // Process Utterance
  const handleCustomerUtterance = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      speaker: "Customer",
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setTranscript(prev => [...prev, userMsg]);
    setInputText("");

    // Execute state engine turn
    const result = processTurn(state, text, config);
    setState(result.state);

    const agentMsg = {
      speaker: "Agent",
      text: result.response,
      timestamp: new Date().toLocaleTimeString()
    };

    setTimeout(() => {
      setTranscript(prev => [...prev, agentMsg]);
      speakText(result.response);

      if (result.state.handoff_ready) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      if (result.is_ended) {
        setCallActive(false);
      }
    }, 400);
  };

  // Run Automated Test Scenario
  const handleRunScenario = async (scenario) => {
    handleEndCall();
    setActiveScenarioId(scenario.id);
    setCallActive(true);
    setState(INITIAL_STATE);

    const opening = `Hello, may I speak with ${config.customer_name}? I am ${config.agent_name} calling from ${config.company_name}.`;
    const initialTranscript = [{
      speaker: "Agent",
      text: opening,
      timestamp: new Date().toLocaleTimeString()
    }];
    setTranscript(initialTranscript);
    speakText(opening);

    let currentState = INITIAL_STATE;

    for (let i = 0; i < scenario.utterances.length; i++) {
      const userUtterance = scenario.utterances[i];
      await new Promise(r => setTimeout(r, 2200));

      const uMsg = {
        speaker: "Customer",
        text: userUtterance,
        timestamp: new Date().toLocaleTimeString()
      };
      setTranscript(prev => [...prev, uMsg]);

      const res = processTurn(currentState, userUtterance, config);
      currentState = res.state;
      setState(currentState);

      await new Promise(r => setTimeout(r, 600));
      const aMsg = {
        speaker: "Agent",
        text: res.response,
        timestamp: new Date().toLocaleTimeString()
      };
      setTranscript(prev => [...prev, aMsg]);
      speakText(res.response);

      if (res.state.handoff_ready) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      if (res.is_ended) {
        setCallActive(false);
        break;
      }
    }
  };

  // Download Transcript JSON
  const downloadTranscriptJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      config,
      final_state: state,
      transcript
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `home_credit_call_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Format Timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-area">
          <div className="logo-icon">
            <Phone size={26} color="#ffffff" />
          </div>
          <div>
            <h1 className="logo-title">Home Credit LAP Voice Agent</h1>
            <p className="logo-subtitle">AI Intern Assignment Demo • State-Machine Driven Lead Qualification</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowPromptModal(true)}>
            <FileText size={16} /> View System Prompt
          </button>
          <button className="btn btn-outline" onClick={downloadTranscriptJson} disabled={transcript.length === 0}>
            <Download size={16} /> Export Call Log
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="main-grid">
        {/* Left Column: 7 Eligibility Checklist Tracker */}
        <aside className="card">
          <h2 className="card-title">
            <ShieldCheck size={20} color="#3b82f6" /> 7-Point Eligibility Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Real-time state tracking with earliest-missing question slot filling.
          </p>

          <div className="checklist-container">
            {CHECKLIST_ITEMS.map((item) => {
              let valueText = "Pending";
              let statusClass = "";

              if (item.key === "property_type") {
                if (state.property_type === "Agricultural") {
                  valueText = "Agricultural (Failed)";
                  statusClass = "failed";
                } else if (state.property_type) {
                  valueText = state.property_type;
                  statusClass = "passed";
                }
              } else if (item.key === "ownership_status") {
                if (state.ownership_status) {
                  valueText = state.ownership_status;
                  statusClass = "passed";
                }
              } else if (item.key === "original_documents") {
                if (state.original_documents === "Unavailable") {
                  valueText = "Photocopies Only (Failed)";
                  statusClass = "failed";
                } else if (state.original_documents) {
                  valueText = state.original_documents;
                  statusClass = "passed";
                }
              } else if (item.key === "loan_amount") {
                if (state.loan_amount) {
                  valueText = `₹${(state.loan_amount / 100000).toFixed(1)} Lakhs`;
                  statusClass = "passed";
                } else if (state.loan_amount_pending_cap_consent) {
                  valueText = "Cap Consent Pending";
                  statusClass = "active";
                }
              } else if (item.key === "occupation_income") {
                if (state.income_mode === "Cash") {
                  valueText = "Cash Income (Failed)";
                  statusClass = "failed";
                } else if (state.occupation && state.income_mode) {
                  valueText = `${state.occupation} (${state.income_mode})`;
                  statusClass = "passed";
                } else if (state.occupation) {
                  valueText = `${state.occupation} (Mode Pending)`;
                  statusClass = "active";
                }
              } else if (item.key === "market_value") {
                if (state.market_value) {
                  valueText = state.market_value;
                  statusClass = "passed";
                }
              } else if (item.key === "tenure") {
                if (state.tenure && (state.tenure < 3 || state.tenure > 15)) {
                  valueText = `${state.tenure} Years (Failed)`;
                  statusClass = "failed";
                } else if (state.tenure) {
                  valueText = `${state.tenure} Years`;
                  statusClass = "passed";
                }
              }

              const isCurrentTarget = getEarliestMissingItem(state) === item.id && callActive;

              return (
                <div key={item.id} className={`checklist-item ${statusClass} ${isCurrentTarget ? 'active' : ''}`}>
                  <div>
                    <div className="checklist-label">
                      {item.id}. {item.label}
                    </div>
                    <div className="checklist-val">{valueText}</div>
                  </div>
                  <div>
                    {statusClass === "passed" && <CheckCircle2 size={18} color="#10b981" />}
                    {statusClass === "failed" && <XCircle size={18} color="#ef4444" />}
                    {statusClass === "" && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #64748b' }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Internal Flags Summary */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Transfer Switch:</strong> {state.transfer_required ? <span style={{ color: '#f59e0b' }}>Triggered</span> : 'Normal'}</div>
              <div><strong>Disqualified:</strong> {state.disqualified ? <span style={{ color: '#ef4444' }}>YES ({state.disqualification_reason})</span> : 'NO'}</div>
              <div><strong>Handoff Gate:</strong> {state.handoff_ready ? <span style={{ color: '#10b981' }}>PASSED (Ready)</span> : 'Gated'}</div>
            </div>
          </div>
        </aside>

        {/* Center Column: Live Voice Call Console */}
        <main className="card call-console">
          <div className="call-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`call-status-badge ${
                state.handoff_ready ? 'badge-qualified' :
                state.disqualified ? 'badge-disqualified' :
                state.transfer_required ? 'badge-transfer' :
                callActive ? 'badge-active' : 'badge-idle'
              }`}>
                <span className="pulse-dot" />
                {state.handoff_ready ? "QUALIFIED" :
                 state.disqualified ? "DISQUALIFIED" :
                 state.transfer_required ? "TRANSFER SPECIALIST" :
                 callActive ? "CALL IN PROGRESS" : "STANDBY"}
              </span>

              {callActive && (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {formatTime(callDuration)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!callActive ? (
                <button className="btn btn-success" onClick={handleStartCall}>
                  <Phone size={16} /> Start Call
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleEndCall}>
                  <PhoneOff size={16} /> End Call
                </button>
              )}
              <button className="btn btn-outline" onClick={() => { handleEndCall(); setState(INITIAL_STATE); setTranscript([]); }}>
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="transcript-box">
            {transcript.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', textAlign: 'center', gap: '0.75rem' }}>
                <Phone size={36} color="#475569" />
                <p>Click <strong>Start Call</strong> or select any <strong>Test Scenario</strong> to test the agent.</p>
              </div>
            ) : (
              transcript.map((msg, idx) => (
                <div key={idx} className={`message-bubble ${msg.speaker === 'Agent' ? 'agent-bubble' : 'customer-bubble'}`}>
                  <div className="bubble-meta">
                    {msg.speaker === 'Agent' ? `${config.agent_name} (${config.company_name})` : config.customer_name} • {msg.timestamp}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Audio Activity & Live Input */}
          <div className="call-controls">
            <button 
              className={`mic-btn ${isListening ? 'active' : 'idle'}`} 
              onClick={toggleListening}
              title={isListening ? "Listening... Click to stop" : "Click to speak via microphone"}
            >
              {isListening ? <Mic size={22} /> : <MicOff size={22} />}
            </button>

            <input
              type="text"
              className="input-box"
              placeholder={callActive ? "Type customer response or use mic..." : "Start call to speak or type..."}
              value={inputText}
              disabled={!callActive}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomerUtterance(inputText);
                }
              }}
            />

            <button 
              className="btn btn-primary" 
              disabled={!callActive || !inputText.trim()} 
              onClick={() => handleCustomerUtterance(inputText)}
            >
              <ArrowRight size={16} /> Send
            </button>
          </div>
        </main>

        {/* Right Column: 1-Click Test Scenarios */}
        <aside className="card">
          <h2 className="card-title">
            <Sparkles size={20} color="#6366f1" /> Test Suite Runner
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Simulate complete edge case calls with automatic turn-taking.
          </p>

          <div style={{ maxHeight: '580px', overflowY: 'auto', paddingRight: '4px' }}>
            {TEST_SCENARIOS.map((sc) => (
              <div 
                key={sc.id} 
                className="scenario-item" 
                onClick={() => handleRunScenario(sc)}
                style={{
                  borderColor: activeScenarioId === sc.id ? sc.badgeColor : undefined,
                  background: activeScenarioId === sc.id ? `${sc.badgeColor}15` : undefined
                }}
              >
                <div className="scenario-header">
                  <span className="scenario-id">{sc.id}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 12, background: `${sc.badgeColor}25`, color: sc.badgeColor, fontWeight: 700 }}>
                    {sc.badge}
                  </span>
                </div>
                <div className="scenario-title">{sc.title}</div>
                <div className="scenario-desc">{sc.description}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* System Prompt Modal */}
      {showPromptModal && (
        <div className="modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>System Prompt Specification</h3>
              <button className="btn btn-outline" onClick={() => setShowPromptModal(false)}>Close</button>
            </div>
            <div className="modal-body">
{`# 1. AGENT IDENTITY, CONTEXT & TECHNICAL VARIABLES
- You are {{agent_name}}, an intelligent AI Voice Agent representing {{company_name}}.
- Agent Gender: {{agent_gender}} (Strict adherence required in tone and grammar).
- Customer Name: {{customer_name}}.
- Date & Context: Today is {{current_day}}, {{current_date}}, and current time is {{current_time}}.
- Language: Conduct the entire call strictly in {{language_to_speak}}.
- Dynamic Inputs: {{customer_utterance}}, {{conversation_history}}, {{additional_context_from_rag}}.

# 2. CALL OBJECTIVE & HIGH-LEVEL FLOW
1. Verify Customer Identity.
2. Check for Busy Status & Capture Callback.
3. Present the Pre-Approved Loyalty Offer (up to ₹75 Lakhs).
4. Detect Existing Loan / EMI Reduction Transfer Intent.
5. Dynamically Qualify the 7 Eligibility Checklist Items.
6. Immediate Disqualification OR Final Senior Loan Expert Handoff.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
