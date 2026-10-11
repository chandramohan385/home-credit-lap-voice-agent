import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Play, RotateCcw, Download, 
  FileText, CheckCircle2, XCircle, AlertCircle, Sparkles, 
  Settings, Bot, User, Volume2, ArrowRight, ShieldCheck, 
  ExternalLink, Globe, RefreshCw, Radio, Layers, Check, Copy, Code,
  Sliders, MessageSquare, Clock, Zap, Award, PlayCircle, PauseCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_STATE, CHECKLIST_ITEMS, processTurn, getEarliestMissingItem } from './stateEngine';
import { TEST_SCENARIOS } from './scenariosData';
import WaveformVisualizer from './WaveformVisualizer';
import { playRingingSound, playConnectedChime, playHangupTone } from './audioEffects';

const RETELL_ORB_URL = "https://agent.retellai.com/orb/agent_b6aa2c1cad76fd15ff8f321e3c?token=94f6800d5a37ccae9e8db30f9e58c405";
const RETELL_CALL_HISTORY_URL = "https://dashboard.retellai.com/org_URqeX7dedVCNCf9UI/call-history?history=call_b12864a07ba0ba81d1b7905ea270";

export default function App() {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'studio' | 'matrix' | 'scenarios' | 'prompt'
  const [studioMode, setStudioMode] = useState('retell'); // 'retell' | 'simulator'

  // Agent Configuration
  const [config, setConfig] = useState({
    company_name: "Home Credit",
    customer_name: "Chandra Mohan",
    agent_name: "Priya",
    agent_gender: "Female",
    language_to_speak: "English",
    useNeuralTTS: true
  });

  // Call & State Management
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [state, setState] = useState(INITIAL_STATE);
  const [transcript, setTranscript] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrbLink, setCopiedOrbLink] = useState(false);

  // Verified Call Audio Playback State
  const [isPlayingVerifiedAudio, setIsPlayingVerifiedAudio] = useState(false);
  const verifiedAudioRef = useRef(null);

  const transcriptEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const speechBufferRef = useRef("");
  const currentAudioRef = useRef(null);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimTranscript]);

  useEffect(() => {
    let timer;
    if (callActive) {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  // Natural Human Voice Speech Synthesis
  const speakText = async (text) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    if (config.useNeuralTTS) {
      const voice = config.language_to_speak === "Hindi" ? "hi-IN-SwaraNeural" : "en-IN-NeerjaNeural";
      const ttsUrl = `http://127.0.0.1:8000/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;

      try {
        const audio = new Audio(ttsUrl);
        currentAudioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          speakBrowserFemaleVoice(text);
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn("Backend Neural TTS fallback to browser female voice:", err);
      }
    }

    speakBrowserFemaleVoice(text);
  };

  const speakBrowserFemaleVoice = (text) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const femaleVoice = voices.find(v => 
      (v.lang.includes('IN') && (v.name.includes('Heera') || v.name.includes('Neerja') || v.name.includes('Swara') || v.name.toLowerCase().includes('female'))) ||
      v.name.includes('Zira') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') ||
      v.name.toLowerCase().includes('female')
    ) || voices.find(v => !v.name.includes('David') && !v.name.includes('George') && !v.name.includes('Mark'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    utterance.lang = config.language_to_speak === "Hindi" ? "hi-IN" : "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = config.agent_gender === "Female" ? 1.2 : 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Microphone) with Silence Debounce
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = config.language_to_speak === "Hindi" ? "hi-IN" : "en-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        if (callActive && !isSpeakingRef.current) {
          try { recognition.start(); } catch (e) {}
        } else {
          setIsListening(false);
        }
      };

      recognition.onresult = (event) => {
        if (isSpeakingRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentWords = (final || interim).trim();
        if (currentWords) {
          setInterimTranscript(currentWords);
          speechBufferRef.current = currentWords;

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          silenceTimerRef.current = setTimeout(() => {
            if (speechBufferRef.current.trim()) {
              const fullSentence = speechBufferRef.current.trim();
              speechBufferRef.current = "";
              setInterimTranscript("");
              handleCustomerUtterance(fullSentence);
            }
          }, 1600);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [config.language_to_speak, callActive]);

  // Start Call
  const handleStartCall = () => {
    playRingingSound();
    setCallActive(true);
    setState(INITIAL_STATE);
    setInterimTranscript("");
    speechBufferRef.current = "";

    setTimeout(() => {
      playConnectedChime();
      const cust = config.customer_name && !config.customer_name.includes('{') ? config.customer_name : "Chandra Mohan";
      const agent = config.agent_name && !config.agent_name.includes('{') ? config.agent_name : "Priya";
      const comp = config.company_name && !config.company_name.includes('{') ? config.company_name : "Home Credit";

      const opening = config.language_to_speak === "Hindi"
        ? `Namaste! Main ${comp} se ${agent} bol rahi hoon. Kya meri baat ${cust} ji se ho rahi hai?`
        : `Hello! This is ${agent} calling from ${comp}. Am I speaking with ${cust}?`;

      const initialMsg = {
        speaker: "Agent",
        text: opening,
        timestamp: new Date().toLocaleTimeString()
      };
      setTranscript([initialMsg]);
      speakText(opening);

      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {}
      }, 3500);
    }, 1200);
  };

  // End Call
  const handleEndCall = () => {
    playHangupTone();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setInterimTranscript("");
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (!callActive) {
      handleStartCall();
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  // Process Utterance
  const handleCustomerUtterance = (text) => {
    if (!text.trim()) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setInterimTranscript("");
    speechBufferRef.current = "";

    const userMsg = {
      speaker: "Customer",
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setTranscript(prev => [...prev, userMsg]);
    setInputText("");

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
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
      }

      if (result.is_ended) {
        setTimeout(() => handleEndCall(), 2500);
      }
    }, 400);
  };

  // Run Automated Test Scenario
  const handleRunScenario = async (scenario) => {
    handleEndCall();
    setActiveScenarioId(scenario.id);
    setActiveTab('studio');
    setStudioMode('simulator');
    setCallActive(true);
    setState(INITIAL_STATE);

    playRingingSound();

    await new Promise(r => setTimeout(r, 1200));
    playConnectedChime();

    const cust = config.customer_name && !config.customer_name.includes('{') ? config.customer_name : "Chandra Mohan";
    const agent = config.agent_name && !config.agent_name.includes('{') ? config.agent_name : "Priya";
    const comp = config.company_name && !config.company_name.includes('{') ? config.company_name : "Home Credit";

    const opening = config.language_to_speak === "Hindi"
      ? `Namaste! Main ${comp} se ${agent} bol rahi hoon. Kya meri baat ${cust} ji se ho rahi hai?`
      : `Hello! This is ${agent} calling from ${comp}. Am I speaking with ${cust}?`;

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
      await new Promise(r => setTimeout(r, 2600));

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
        setTimeout(() => handleEndCall(), 2000);
        break;
      }
    }
  };

  // Download Transcript JSON
  const downloadTranscriptJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      candidate: "Avuram Chandra Mohan Reddy",
      github: "https://github.com/chandramohan385/home-credit-lap-voice-agent",
      retell_web_call_orb: RETELL_ORB_URL,
      retell_call_id: "call_b12864a07ba0ba81d1b7905ea270",
      retell_public_history_url: RETELL_CALL_HISTORY_URL,
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

  const copyRetellLink = () => {
    navigator.clipboard.writeText(RETELL_CALL_HISTORY_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyOrbLink = () => {
    navigator.clipboard.writeText(RETELL_ORB_URL);
    setCopiedOrbLink(true);
    setTimeout(() => setCopiedOrbLink(false), 2000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner & Submission Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-100">SalesAgents AI - AI Intern (Prompt Engineer) Hiring Assignment</span>
            <span className="text-slate-400">• Candidate:</span>
            <span className="font-medium text-sky-400">Avuram Chandra Mohan Reddy</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <a 
              href="https://github.com/chandramohan385/home-credit-lap-voice-agent" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Code size={14} className="text-sky-400" />
              <span>github.com/chandramohan385/home-credit-lap-voice-agent</span>
            </a>
            <button
              onClick={copyOrbLink}
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 cursor-pointer font-medium"
            >
              <Phone size={13} />
              <span>{copiedOrbLink ? "Orb Link Copied!" : "Retell Web Call Orb"}</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={copyRetellLink}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium"
            >
              <Award size={14} />
              <span>{copiedLink ? "History Copied!" : "Retell Verified (898ms)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-md shadow-red-500/20 text-white">
              <Phone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Home Credit Voice Agent</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                  LAP Pre-Approval
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Conversational Loan Underwriting Engine (up to ₹75 Lakhs)</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'evidence' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={14} className="text-emerald-600" /> Verified Retell Call
            </button>
            <button
              onClick={() => {
                setActiveTab('studio');
                setStudioMode('retell');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'studio' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio size={14} className="text-blue-600" /> Live Voice Studio
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} className="text-indigo-600" /> 7-Slot Underwriter
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scenarios' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className="text-amber-600" /> Scenario Lab (10)
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'prompt' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} className="text-slate-700" /> System Prompt
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('studio');
                setStudioMode('retell');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Radio size={14} className="animate-pulse text-sky-200" />
              <span>Talk to Agent (Retell AI)</span>
            </button>
            <a
              href={RETELL_CALL_HISTORY_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center gap-1.5"
            >
              <ExternalLink size={14} /> Retell Log
            </a>
            <button
              onClick={downloadTranscriptJson}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download size={14} /> Export Logs
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">

        {/* TAB 1: VERIFIED RETELL CALL EVIDENCE (Default Highlight View) */}
        {activeTab === 'evidence' && (
          <div className="flex flex-col gap-6">
            {/* Live Call Invitation Banner */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Radio size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Experience this Voice Agent Live Right Now</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      898ms Latency
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Speak directly to Priya using Retell AI's WebRTC audio engine with sub-second turnaround and human natural tone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setActiveTab('studio');
                    setStudioMode('retell');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Phone size={14} />
                  <span>Launch Live Retell Call</span>
                </button>
                <a
                  href={RETELL_ORB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Open Fullscreen</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Col: Official Call Summary & Telemetry (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="light-panel p-6 border-slate-200 bg-white">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                        <Award size={22} />
                      </div>
                      <div>
                      <h2 className="text-base font-bold text-slate-900">Official Retell AI Call Evidence</h2>
                      <p className="text-xs text-slate-500">Live Telephony Voice Call with Candidate (Chandra Mohan)</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    VERIFIED & QUALIFIED
                  </span>
                </div>

                {/* Retell Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" /> Latency
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">898 ms</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Sub-second Speed</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Clock size={12} className="text-blue-500" /> Duration
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">1m 57s</span>
                    <span className="text-[10px] text-slate-500">Full 7-Step Check</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Bot size={12} className="text-indigo-500" /> LLM Tokens
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">2,743</span>
                    <span className="text-[10px] text-slate-500">Cost: $0.284</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <User size={12} className="text-rose-500" /> Sentiment
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-1 block text-emerald-600">Positive</span>
                    <span className="text-[10px] text-slate-500">Agent Hand-off</span>
                  </div>
                </div>

                {/* AI Executive Summary Card */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 my-2">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Bot size={14} className="text-blue-600" /> Retell AI Underwriting Analysis & Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-950 leading-relaxed font-normal">
                    "Chandra Mohan expressed interest in a loan against residential property and provided qualification details: sole ownership, original documents, salaried bank-transfer income, approximately ₹2 crore property value, ₹60 lakh loan requirement, and 10-year tenure. The agent confirmed preliminary eligibility and said a senior loan expert would call shortly to discuss rates and finalize the application."
                  </p>
                </div>

                {/* Verified Audio Player & Link Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Call ID:</span>
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-700 border border-slate-200">
                      call_b12864a07ba0ba81d1b7905ea270
                    </code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyRetellLink}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? "Link Copied!" : "Copy Retell Call Link"}</span>
                    </button>
                    <a
                      href="https://dashboard.retellai.com/org_URqeX7dedVCNCf9UI/call-history?history=call_b12864a07ba0ba81d1b7905ea270"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ExternalLink size={14} />
                      <span>Open Retell Log</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Verified Speech Transcript (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="light-panel p-6 border-slate-200 bg-white flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Verified Call Transcript (100% Pass)</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">1m 57s</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs sm:text-sm">
                  {[
                    { speaker: "Agent", time: "0:00", text: "Hello, may I speak with Chandra Mohan? I am Priya calling from Home Credit." },
                    { speaker: "Customer", time: "0:09", text: "Yes." },
                    { speaker: "Agent", time: "0:11", text: "As a valued Home Credit customer, you have a pre-approved Loan Against Property offer of up to 75 Lakh rupees. I'd like to check a few quick details to see if it suits your needs. Could you tell me if your property is residential, commercial, or industrial?" },
                    { speaker: "Customer", time: "0:25", text: "It is a residential flat." },
                    { speaker: "Agent", time: "0:28", text: "Are you the sole owner of the property, or is it jointly owned?" },
                    { speaker: "Customer", time: "0:33", text: "Sole owner." },
                    { speaker: "Agent", time: "0:35", text: "Do you have the original property documents available for verification?" },
                    { speaker: "Customer", time: "0:40", text: "Yes, original documents are available at home." },
                    { speaker: "Agent", time: "0:44", text: "How much loan amount are you looking to borrow?" },
                    { speaker: "Customer", time: "0:48", text: "Around 60 Lakhs." },
                    { speaker: "Agent", time: "0:51", text: "Are you salaried or self-employed, and do you receive your income through bank transfer or in cash?" },
                    { speaker: "Customer", time: "0:58", text: "Salaried, and received in bank account." },
                    { speaker: "Agent", time: "1:02", text: "What is the approximate current market value of your property?" },
                    { speaker: "Customer", time: "1:07", text: "Around 2 Crore." },
                    { speaker: "Agent", time: "1:11", text: "Over how many years would you prefer to repay the loan?" },
                    { speaker: "Customer", time: "1:15", text: "10 years." },
                    { speaker: "Agent", time: "1:18", text: "Congratulations, Chandra Mohan! Based on the details provided, you meet all preliminary criteria for our Loan Against Property offer. A senior loan expert will call you shortly to discuss exact rates and finalize your application. Thank you for banking with Home Credit, and have a wonderful day!" }
                  ].map((msg, i) => {
                    const isAgent = msg.speaker === "Agent";
                    return (
                      <div key={i} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 mb-1">
                          <span>{isAgent ? "Priya (Home Credit)" : "Chandra Mohan"}</span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                          isAgent 
                            ? 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200/60' 
                            : 'bg-blue-600 text-white rounded-tr-sm shadow-xs'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* TAB 2: LIVE VOICE STUDIO */}
        {activeTab === 'studio' && (
          <div className="flex flex-col gap-6">
            {/* Studio Header & Engine Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Live Voice Agent Studio</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Dual Engine Architecture
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Experience telecom-grade live voice synthesis or run deterministic state-machine test scenarios.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setStudioMode('retell')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    studioMode === 'retell'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Radio size={14} className={studioMode === 'retell' ? 'animate-pulse' : ''} />
                  <span>Retell AI Web Call (Live WebRTC)</span>
                </button>
                <button
                  onClick={() => setStudioMode('simulator')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    studioMode === 'simulator'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers size={14} />
                  <span>Local Rule Sandbox</span>
                </button>
              </div>
            </div>

            {studioMode === 'retell' ? (
              /* RETELL LIVE WEBRTC CALL VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Embedded Retell Web Call Container (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="light-panel p-5 bg-white border-slate-200 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/20">
                          P
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">Priya • Home Credit LAP Qualifier</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              898ms Latency
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Retell AI WebRTC • Cartesia / ElevenLabs Voice • Deepgram Nova-2</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyOrbLink}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Copy Public Call Link"
                        >
                          {copiedOrbLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          <span>{copiedOrbLink ? "Link Copied!" : "Share Link"}</span>
                        </button>
                        <a
                          href={RETELL_ORB_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <ExternalLink size={13} />
                          <span>Open Standalone</span>
                        </a>
                      </div>
                    </div>

                    {/* Embedded Retell Orb */}
                    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner min-h-[580px] flex flex-col">
                      <iframe
                        src={RETELL_ORB_URL}
                        allow="microphone; camera; display-capture; autoplay"
                        className="w-full h-full min-h-[580px] border-0"
                        title="Retell AI Voice Call Agent"
                      />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        Microphone permission enabled • Sub-second conversational responses
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Agent ID: agent_b6aa2c1cad76fd15ff8f321e3c
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: How to Test & Checklist Reference (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Test Instructions Card */}
                  <div className="light-panel p-5 bg-white border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-900">Live Voice Call Guide</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Evaluator Quick Sheet
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      Click <strong>"Call"</strong> on the orb widget, speak through your microphone, and converse naturally. Priya will verify your identity and guide you through the 7 eligibility checklist questions.
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                        Qualifying Answers (100% Pass Flow):
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">1. Property:</span>
                          <span className="text-emerald-700 font-semibold">"Residential flat"</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">2. Ownership:</span>
                          <span className="text-emerald-700 font-semibold">"Sole owner"</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">3. Documents:</span>
                          <span className="text-emerald-700 font-semibold">"Originals available"</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">4. Loan Amount:</span>
                          <span className="text-emerald-700 font-semibold">"60 Lakhs"</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">5. Income Mode:</span>
                          <span className="text-emerald-700 font-semibold">"Salaried, bank account"</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">6. Market Value:</span>
                          <span className="text-emerald-700 font-semibold">"2 Crores"</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">7. Tenure:</span>
                          <span className="text-emerald-700 font-semibold">"10 years"</span>
                        </div>
                      </div>
                    </div>

                    {/* Edge Cases to Test */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 mb-2">
                        Edge Cases You Can Test on Call:
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-950">
                          <strong>Farmland / Cash Disqualification:</strong> Say <em>"It is agricultural farmland"</em> or <em>"I receive cash"</em> → Priya disqualifies politely without generic loop.
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-950">
                          <strong>Cap Offer:</strong> Say <em>"I need 90 Lakhs"</em> → Priya offers the ₹75 Lakh cap before disqualification.
                        </div>
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200/70 text-indigo-950">
                          <strong>Balance Transfer Intent:</strong> Say <em>"I already have a home loan and want to reduce EMI"</em> → Priya triggers specialist transfer flow.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Card */}
                  <div className="light-panel p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award size={14} /> Production Telemetry Specs
                      </span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-400/30">
                        Retell Benchmarks
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Response Latency</span>
                        <span className="text-sm font-bold text-emerald-400">898 ms</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Voice Engine</span>
                        <span className="text-sm font-bold text-white">Cartesia Neural</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Speech VAD</span>
                        <span className="text-sm font-bold text-white">Deepgram Nova-2</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Underwriting Pass</span>
                        <span className="text-sm font-bold text-emerald-400">100% (7/7 Slots)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* LOCAL SIMULATOR & SANDBOX */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Phone Console (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="light-panel p-5 bg-white border-slate-200 flex flex-col shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/20">
                      P
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{config.agent_name} (Voice Agent)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          Neural Audio
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{config.company_name}</span>
                        <span>•</span>
                        <span>To: {config.customer_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      state.handoff_ready ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      state.disqualified ? 'bg-red-50 text-red-700 border border-red-200' :
                      state.transfer_required ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      callActive ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${callActive ? 'bg-current animate-pulse' : 'bg-slate-400'}`}></span>
                      {state.handoff_ready ? "QUALIFIED" :
                       state.disqualified ? "DISQUALIFIED" :
                       state.transfer_required ? "TRANSFER SPECIALIST" :
                       callActive ? "CALL ACTIVE" : "STANDBY"}
                    </span>
                    {callActive && (
                      <span className="text-xs font-mono text-slate-500">
                        {formatTime(callDuration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Animated Waveform */}
                <div className="my-2 bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center min-h-[64px]">
                  <WaveformVisualizer 
                    isActive={callActive} 
                    isSpeaking={isSpeaking} 
                    isListening={isListening} 
                  />
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                    {isSpeaking && <span className="text-blue-600 font-semibold">Priya Speaking...</span>}
                    {isListening && !interimTranscript && <span className="text-emerald-600">Listening to Customer...</span>}
                    {interimTranscript && <span className="text-blue-700">Detecting sentence: "{interimTranscript}..."</span>}
                    {!isSpeaking && !isListening && callActive && <span>Connected • Speak into mic or type below</span>}
                    {!callActive && <span>Agent Idle • Click Start Call to Begin</span>}
                  </div>
                </div>

                {/* Transcript Scroll Area */}
                <div className="h-64 overflow-y-auto pr-1 flex flex-col gap-3 my-2 scroll-smooth">
                  {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2 py-8">
                      <Phone size={28} className="text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">Click Start Call to speak or run a test scenario</p>
                    </div>
                  ) : (
                    <>
                      {transcript.map((msg, idx) => {
                        const isAgent = msg.speaker === "Agent";
                        return (
                          <div key={idx} className={`flex flex-col max-w-[85%] ${isAgent ? 'self-start' : 'self-end'}`}>
                            <div className="text-[10px] font-medium text-slate-400 mb-0.5">
                              {isAgent ? "Priya (Home Credit)" : config.customer_name} • {msg.timestamp}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                              isAgent 
                                ? 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200/70' 
                                : 'bg-blue-600 text-white rounded-tr-sm shadow-xs'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      {interimTranscript && (
                        <div className="flex flex-col max-w-[85%] self-end opacity-85">
                          <div className="text-[10px] font-semibold text-blue-600 mb-0.5">Speaking...</div>
                          <div className="p-3 rounded-2xl text-xs sm:text-sm bg-blue-50 text-blue-900 border border-blue-200 italic">
                            "{interimTranscript}"
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={transcriptEndRef} />
                </div>

                {/* Call Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    {!callActive ? (
                      <button
                        onClick={handleStartCall}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Phone size={16} /> Start Voice Call
                      </button>
                    ) : (
                      <button
                        onClick={handleEndCall}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <PhoneOff size={16} /> End Call
                      </button>
                    )}

                    <button
                      onClick={toggleListening}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isListening 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title={isListening ? "Listening... click to pause" : "Click to speak"}
                    >
                      {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>

                    {interimTranscript && (
                      <button
                        onClick={() => handleCustomerUtterance(interimTranscript)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        <span>Done Speaking</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleEndCall();
                        setState(INITIAL_STATE);
                        setTranscript([]);
                        setInterimTranscript("");
                      }}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                      title="Reset Conversation"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      disabled={!callActive}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomerUtterance(inputText)}
                      placeholder={callActive ? "Type response or speak naturally into mic..." : "Start call to speak or type..."}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleCustomerUtterance(inputText)}
                      disabled={!callActive || !inputText.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <span>Send</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Slot Tracker & Quick Scenarios (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="light-panel p-5 bg-white border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">7-Slot Underwriter Progress</h2>
                  </div>
                  <span className="text-[11px] text-slate-500">Live Memory State</span>
                </div>

                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map((item) => {
                    let status = "pending";
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
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          status === "passed" ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' :
                          status === "failed" ? 'bg-red-50/60 border-red-200 text-red-900' :
                          isCurrentQuestion ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs' :
                          'bg-slate-50 border-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-900">
                              {item.id}. {item.label}
                            </span>
                            {isCurrentQuestion && (
                              <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{displayVal}</p>
                        </div>

                        <div>
                          {status === "passed" && <CheckCircle2 size={16} className="text-emerald-600" />}
                          {status === "failed" && <XCircle size={16} className="text-red-600" />}
                          {status === "pending" && <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          {status === "active" && <RefreshCw size={14} className="text-blue-600 animate-spin" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
            )}
          </div>
        )}

        {/* TAB 3: 7-SLOT UNDERWRITER COMPLETE MATRIX */}
        {activeTab === 'matrix' && (
          <div className="light-panel p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">7-Point Qualification Checklist & Business Rules</h2>
                <p className="text-xs text-slate-500">Autonomous Sequential Underwriting Rules specified by Home Credit</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Specification Compliance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { num: 1, title: "Property Type", pass: "Residential, Commercial, Industrial", fail: "Agricultural / Farmland", status: "Immediate Disqualification on Farmland" },
                { num: 2, title: "Ownership Status", pass: "Sole or Joint Ownership", fail: "None", status: "Both Sole & Joint Accepted" },
                { num: 3, title: "Document Availability", pass: "Original property papers available", fail: "Photocopies only / Misplaced", status: "Mandatory Original Verification" },
                { num: 4, title: "Desired Loan Amount", pass: "Up to ₹75,00,000 (75 Lakhs)", fail: "> 75 Lakhs (Refused cap)", status: "Offers 75L cap before disqualification" },
                { num: 5, title: "Occupation & Mode", pass: "Salaried/Self-Employed with Bank payout", fail: "Cash Income", status: "Cash Income Strictly Disqualified" },
                { num: 6, title: "Market Value", pass: "Customer Estimated Value", fail: "No minimum cutoff specified", status: "Captured without arbitrary threshold" },
                { num: 7, title: "Repayment Tenure", pass: "3 to 15 Years (Inclusive)", fail: "< 3 years or > 15 years", status: "Strict 3-15 Year Tenure Window" }
              ].map((c) => (
                <div key={c.num} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600">CHECKLIST #{c.num}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Rule
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">{c.title}</h3>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      <div><strong className="text-emerald-700">Eligible:</strong> {c.pass}</div>
                      <div><strong className="text-rose-700">Disqualify:</strong> {c.fail}</div>
                    </div>
                  </div>
                  <p className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                    {c.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SCENARIOS LAB */}
        {activeTab === 'scenarios' && (
          <div className="light-panel p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Automated Edge-Case Scenario Lab</h2>
                <p className="text-xs text-slate-500">Run complete automated test calls to verify every logic branch</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                10 Test Suites Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEST_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleRunScenario(sc)}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-600">{sc.id}</span>
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${sc.badgeColor}15`, color: sc.badgeColor }}
                      >
                        {sc.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{sc.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">{sc.utterances.length} turns</span>
                    <span className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                      Simulate Test <Play size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM PROMPT SPECIFICATION */}
        {activeTab === 'prompt' && (
          <div className="light-panel p-6 bg-white border-slate-200 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Production System Prompt Specification</h2>
                <p className="text-xs text-slate-500">Adheres to Section 4 & 5 variables and prompt engineering rules</p>
              </div>
              <button
                onClick={() => {
                  const p = `# 1. AGENT IDENTITY, CONTEXT & TECHNICAL VARIABLES
- You are Priya, an intelligent AI Voice Agent representing Home Credit.
- Agent Gender: Female.
- Customer Name: {{customer_name}}.
- Language: English.

# 2. CALL OBJECTIVE & HIGH-LEVEL FLOW
1. Verify Customer Identity.
2. Check for Busy Status & Capture Callback.
3. Present the Pre-Approved Loyalty Offer (up to ₹75 Lakhs).
4. Detect Existing Loan / EMI Reduction Transfer Intent.
5. Dynamically Qualify the 7 Eligibility Checklist Items.
6. Immediate Disqualification OR Final Senior Loan Expert Handoff.`;
                  navigator.clipboard.writeText(p);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedPrompt ? "Copied" : "Copy Prompt Text"}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-y-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
{`# 1. AGENT IDENTITY, CONTEXT & TECHNICAL VARIABLES
- You are {{agent_name}}, an intelligent AI Voice Agent representing {{company_name}}.
- Agent Gender: {{agent_gender}} (Strict requirement: maintain this gender identity consistently).
- Customer Name: {{customer_name}}.
- Current Context: Today is {{current_day}}, {{current_date}}, time is {{current_time}}.
- Language: Conduct the entire call strictly in {{language_to_speak}}.
- Dynamic Inputs: {{customer_utterance}}, {{conversation_history}}, {{additional_context_from_rag}}.

# 2. CALL OBJECTIVE & HIGH-LEVEL FLOW
1. Verify Customer Identity.
2. Check for Busy Status & Capture Callback.
3. Present the Pre-Approved Loyalty Offer.
4. Detect Existing Loan / Balance Transfer / EMI Reduction Intent.
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
        )}

      </main>
    </div>
  );
}
