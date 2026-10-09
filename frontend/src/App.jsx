import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Play, RotateCcw, Download, 
  FileText, CheckCircle2, XCircle, AlertCircle, Sparkles, 
  Settings, Bot, User, Volume2, ArrowRight, ShieldCheck, 
  ExternalLink, Globe, RefreshCw, Radio, Layers, Check, Copy, Code
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_STATE, CHECKLIST_ITEMS, processTurn, getEarliestMissingItem } from './stateEngine';
import { TEST_SCENARIOS } from './scenariosData';
import WaveformVisualizer from './WaveformVisualizer';
import { playRingingSound, playConnectedChime, playHangupTone } from './audioEffects';

export default function App() {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'matrix' | 'scenarios' | 'prompt'

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
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
    utterance.rate = 1.05;
    utterance.pitch = config.agent_gender === "Female" ? 1.15 : 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start Call
  const handleStartCall = () => {
    playRingingSound();
    setCallActive(true);
    setState(INITIAL_STATE);

    setTimeout(() => {
      playConnectedChime();
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
    }, 1200);
  };

  // End Call
  const handleEndCall = () => {
    playHangupTone();
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
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      if (result.is_ended) {
        setTimeout(() => handleEndCall(), 1800);
      }
    }, 400);
  };

  // Run Automated Test Scenario
  const handleRunScenario = async (scenario) => {
    handleEndCall();
    setActiveScenarioId(scenario.id);
    setActiveTab('studio');
    setCallActive(true);
    setState(INITIAL_STATE);

    playRingingSound();

    await new Promise(r => setTimeout(r, 1200));
    playConnectedChime();

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
      await new Promise(r => setTimeout(r, 2400));

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
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
      }

      if (res.is_ended) {
        setTimeout(() => handleEndCall(), 1600);
        break;
      }
    }
  };

  // Download Transcript JSON
  const downloadTranscriptJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      candidate: "Avuram Chandra Mohan Reddy",
      github: "https://github.com/chandramohan385/home-credit-lap-voice-agent",
      config,
      final_state: state,
      transcript
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `home_credit_voice_call_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy System Prompt
  const copySystemPrompt = () => {
    const promptText = `# 1. AGENT IDENTITY, CONTEXT & TECHNICAL VARIABLES
- You are {{agent_name}}, an intelligent AI Voice Agent representing {{company_name}}.
- Agent Gender: {{agent_gender}} (Strict adherence required).
- Customer Name: {{customer_name}}.
- Language: {{language_to_speak}}.

# 2. 7-ITEM ELIGIBILITY CHECKLIST & BUSINESS RULES
1. Property Type: Residential, Commercial, Industrial eligible. Agricultural = Disqualify.
2. Ownership: Sole and Joint eligible.
3. Original Documents: Original papers mandatory. Photocopies = Disqualify.
4. Loan Amount: <= 75 Lakhs. If > 75L, offer 75L cap before disqualification.
5. Occupation & Income Mode: Bank payout required. Cash income = Disqualify.
6. Market Value: Capture customer estimate without cutoff.
7. Tenure: 3 to 15 years. <3 or >15 = Disqualify.

# 3. SPECIAL LOGIC SWITCHES
- Existing Loan / EMI Reduction: Transfer to specialist and end call.
- Busy Customer: Capture callback time and end call.
- Handoff Gate: Hand off only after all 7 items pass.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner & Submission Link Bar */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border-b border-white/10 px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">SalesAgents AI - AI Intern (Prompt Engineer) Hiring Assignment</span>
            <span className="text-slate-400">• Candidate:</span>
            <span className="font-medium text-blue-400">Avuram Chandra Mohan Reddy</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <a 
              href="https://github.com/chandramohan385/home-credit-lap-voice-agent" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Code size={14} />
              <span>github.com/chandramohan385</span>
            </a>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Globe size={14} />
              <span>Production Voice Engine v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Header */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Phone size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Home Credit Voice Agent</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  LAP Underwriting
                </span>
              </div>
              <p className="text-xs text-slate-400">Pre-approved ₹75L Loan Against Property Conversational Qualifier</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'studio' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio size={14} /> Voice Studio
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={14} /> 7-Slot Underwriter
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'scenarios' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} /> Scenario Lab (10)
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'prompt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={14} /> System Prompt
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTranscriptJson}
              disabled={transcript.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export Logs
            </button>
            <button
              onClick={copySystemPrompt}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              {copiedPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedPrompt ? "Copied!" : "Copy Prompt"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Phone Console (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Active Call Widget Card */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Calling Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
                    {config.agent_name[0]}
                  </div>
                  {callActive && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping"></span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{config.agent_name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                      AI Loan Underwriter
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{config.company_name}</span>
                    <span>•</span>
                    <span>To: {config.customer_name}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Call Timer */}
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  state.handoff_ready ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  state.disqualified ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  state.transfer_required ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  callActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${callActive ? 'bg-current animate-pulse' : 'bg-slate-500'}`}></span>
                  {state.handoff_ready ? "QUALIFIED (HANDOFF)" :
                   state.disqualified ? "DISQUALIFIED" :
                   state.transfer_required ? "TRANSFER SPECIALIST" :
                   callActive ? "CALL ACTIVE" : "STANDBY"}
                </span>

                {callActive && (
                  <span className="text-xs font-mono text-slate-400 tracking-wider">
                    {formatTime(callDuration)}
                  </span>
                )}
              </div>
            </div>

            {/* Audio Waveform Visualizer */}
            <div className="my-2 bg-slate-950/60 rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center min-h-[70px]">
              <WaveformVisualizer 
                isActive={callActive} 
                isSpeaking={isSpeaking} 
                isListening={isListening} 
              />
              <div className="text-[11px] text-slate-400 tracking-wide font-medium flex items-center gap-2">
                {isSpeaking && <span className="text-blue-400">Agent Speaking...</span>}
                {isListening && <span className="text-red-400 animate-pulse">Listening to Customer Microphone...</span>}
                {!isSpeaking && !isListening && callActive && <span>Call Connected • Speak into mic or type below</span>}
                {!callActive && <span>Agent Idle • Click Start Call to Begin</span>}
              </div>
            </div>

            {/* Live Conversation Transcript */}
            <div className="h-72 overflow-y-auto pr-1 flex flex-col gap-3 my-2 scroll-smooth">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3 py-10">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    <Phone size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Ready for Live Underwriting</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click <strong>Start Call</strong> to simulate via mic, or click any <strong>Test Scenario</strong> on the right.
                    </p>
                  </div>
                </div>
              ) : (
                transcript.map((msg, idx) => {
                  const isAgent = msg.speaker === "Agent";
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[85%] ${isAgent ? 'self-start' : 'self-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        {isAgent ? (
                          <>
                            <Bot size={12} className="text-blue-400" />
                            <span>{config.agent_name} ({config.company_name})</span>
                          </>
                        ) : (
                          <>
                            <User size={12} className="text-indigo-400" />
                            <span>{config.customer_name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isAgent 
                          ? 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-tl-sm' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Call Action Controls */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                {!callActive ? (
                  <button
                    onClick={handleStartCall}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Phone size={18} /> Start Voice Call
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                  >
                    <PhoneOff size={18} /> End Call
                  </button>
                )}

                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isListening 
                      ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                  title={isListening ? "Listening... click to pause" : "Click to speak into microphone"}
                >
                  {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  onClick={() => {
                    handleEndCall();
                    setState(INITIAL_STATE);
                    setTranscript([]);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
                  title="Reset Conversation"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Text Input Fallback */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  disabled={!callActive}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomerUtterance(inputText)}
                  placeholder={callActive ? "Type customer utterance or speak into mic..." : "Start call to speak or type..."}
                  className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                />

                <button
                  onClick={() => handleCustomerUtterance(inputText)}
                  disabled={!callActive || !inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <span>Send</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Quick Prompt Helper Pills */}
              {callActive && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-semibold shrink-0">Quick reply:</span>
                  {[
                    "Residential flat",
                    "Sole owner",
                    "Original papers available at home",
                    "50 Lakhs",
                    "Salaried via bank account",
                    "Worth 1.2 Crore",
                    "10 years"
                  ].map((phrase, i) => (
                    <button
                      key={i}
                      onClick={() => handleCustomerUtterance(phrase)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 shrink-0 transition-colors cursor-pointer"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic State Machine & 7-Item Underwriting (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* 7 Checklist Parameters Visualizer */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-400" />
                <h2 className="text-sm font-bold text-white">Underwriting Slot Tracker (7 Items)</h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Slot-filling Engine
              </span>
            </div>

            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map((item) => {
                let status = "pending"; // 'passed' | 'failed' | 'pending' | 'active'
                let displayVal = "Awaiting response";

                if (item.key === "property_type") {
                  if (state.property_type === "Agricultural") {
                    status = "failed";
                    displayVal = "Agricultural Land (Disqualified)";
                  } else if (state.property_type) {
                    status = "passed";
                    displayVal = state.property_type;
                  }
                } else if (item.key === "ownership_status") {
                  if (state.ownership_status) {
                    status = "passed";
                    displayVal = `${state.ownership_status} Ownership`;
                  }
                } else if (item.key === "original_documents") {
                  if (state.original_documents === "Unavailable") {
                    status = "failed";
                    displayVal = "Photocopies Only (Disqualified)";
                  } else if (state.original_documents) {
                    status = "passed";
                    displayVal = "Originals Available";
                  }
                } else if (item.key === "loan_amount") {
                  if (state.loan_amount) {
                    status = "passed";
                    displayVal = `₹${(state.loan_amount / 100000).toFixed(1)} Lakhs (Approved Cap)`;
                  } else if (state.loan_amount_pending_cap_consent) {
                    status = "active";
                    displayVal = "Pending 75L Cap Consent";
                  }
                } else if (item.key === "occupation_income") {
                  if (state.income_mode === "Cash") {
                    status = "failed";
                    displayVal = "Cash Income (Disqualified)";
                  } else if (state.occupation && state.income_mode) {
                    status = "passed";
                    displayVal = `${state.occupation} via Bank`;
                  } else if (state.occupation) {
                    status = "active";
                    displayVal = `${state.occupation} (Mode Pending)`;
                  }
                } else if (item.key === "market_value") {
                  if (state.market_value) {
                    status = "passed";
                    displayVal = `₹${state.market_value}`;
                  }
                } else if (item.key === "tenure") {
                  if (state.tenure && (state.tenure < 3 || state.tenure > 15)) {
                    status = "failed";
                    displayVal = `${state.tenure} Years (Out of 3-15 Range)`;
                  } else if (state.tenure) {
                    status = "passed";
                    displayVal = `${state.tenure} Years Repayment`;
                  }
                }

                const isCurrentQuestion = getEarliestMissingItem(state) === item.id && callActive;

                return (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      status === "passed" ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' :
                      status === "failed" ? 'bg-red-950/20 border-red-500/30 text-red-200' :
                      isCurrentQuestion ? 'bg-blue-900/20 border-blue-500/40 text-blue-200 shadow-sm' :
                      'bg-slate-900/50 border-white/5 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {item.id}. {item.label}
                        </span>
                        {isCurrentQuestion && (
                          <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded text-[9px] font-bold">
                            Current Question
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{displayVal}</p>
                    </div>

                    <div>
                      {status === "passed" && <CheckCircle2 size={18} className="text-emerald-400" />}
                      {status === "failed" && <XCircle size={18} className="text-red-400" />}
                      {status === "pending" && <div className="w-4 h-4 rounded-full border border-slate-600"></div>}
                      {status === "active" && <RefreshCw size={16} className="text-blue-400 animate-spin" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Business Decision Logic State */}
            <div className="mt-4 pt-3 border-t border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Transfer Switch (Existing Loan):</span>
                <span className={state.transfer_required ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {state.transfer_required ? 'Triggered (Specialist Route)' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Disqualification Gate:</span>
                <span className={state.disqualified ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  {state.disqualified ? `FAIL (${state.disqualification_reason})` : 'PASSED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Senior Loan Expert Handoff:</span>
                <span className={state.handoff_ready ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {state.handoff_ready ? 'APPROVED & READY' : 'Pending 7 Checklist Items'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Scenario Runner Drawer */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Scenario Lab (1-Click Run)</h3>
              </div>
              <span className="text-[11px] text-slate-400">10 Edge Cases</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {TEST_SCENARIOS.slice(0, 5).map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleRunScenario(sc)}
                  className={`p-2.5 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between ${
                    activeScenarioId === sc.id ? 'border-blue-500 bg-blue-900/20' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-400">{sc.id}</span>
                      <span className="text-xs font-semibold text-white">{sc.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-[240px] mt-0.5">{sc.expected}</p>
                  </div>
                  <Play size={14} className="text-slate-400 hover:text-white" />
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('scenarios')}
              className="mt-3 text-xs text-center text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              View all 10 scenarios in Scenario Lab →
            </button>
          </div>
        </div>
      </main>

      {/* Scenarios Full Modal / Tab */}
      {activeTab === 'scenarios' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-400" />
                <h3 className="text-base font-bold text-white">10 Pre-Configured Test Scenarios</h3>
              </div>
              <button 
                onClick={() => setActiveTab('studio')}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEST_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleRunScenario(sc)}
                  className="p-3.5 rounded-xl border border-white/10 bg-slate-950/60 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-400">{sc.id}</span>
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${sc.badgeColor}20`, color: sc.badgeColor }}
                      >
                        {sc.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{sc.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{sc.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">{sc.utterances.length} conversation turns</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      Run Test <Play size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Prompt View Modal */}
      {activeTab === 'prompt' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Production System Prompt Specification</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copySystemPrompt}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPrompt ? "Copied" : "Copy Prompt"}
                </button>
                <button 
                  onClick={() => setActiveTab('studio')}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/80 whitespace-pre-wrap leading-relaxed">
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
6. Immediate Disqualification OR Final Senior Loan Expert Handoff.

# 3. 7-ITEM ELIGIBILITY CHECKLIST & BUSINESS RULES
1. Property Type: Residential, Commercial, Industrial eligible. Agricultural = Disqualify.
2. Ownership: Sole and Joint eligible.
3. Original Documents: Original papers mandatory. Photocopies = Disqualify.
4. Loan Amount: <= 75 Lakhs. If > 75L, offer 75L cap before disqualification.
5. Occupation & Income Mode: Bank payout required. Cash income = Disqualify.
6. Market Value: Capture customer estimate without cutoff.
7. Tenure: 3 to 15 years. <3 or >15 = Disqualify.

# 4. SPECIAL LOGIC SWITCHES
- Existing Loan / EMI Reduction: Transfer to specialist and end call.
- Busy Customer: Capture callback time and end call.
- Handoff Gate: Hand off only after all 7 items pass.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
