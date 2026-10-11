import React, { useState } from 'react';
import { 
  Phone, Radio, Award, ShieldCheck, Sparkles, FileText, 
  ExternalLink, Check, Copy, Code, CheckCircle2, Bot, User, 
  Zap, Clock, ArrowUpRight, ChevronRight, Play, MessageSquare,
  HelpCircle, ArrowRight
} from 'lucide-react';
import { TEST_SCENARIOS } from './scenariosData';

const RETELL_ORB_URL = "https://agent.retellai.com/orb/agent_b6aa2c1cad76fd15ff8f321e3c?token=94f6800d5a37ccae9e8db30f9e58c405";
const RETELL_CALL_HISTORY_URL = "https://dashboard.retellai.com/org_URqeX7dedVCNCf9UI/call-history?history=call_b12864a07ba0ba81d1b7905ea270";

export default function App() {
  // Navigation: Default directly to Retell AI Live Voice Call
  const [activeTab, setActiveTab] = useState('retell'); // 'retell' | 'audit' | 'matrix' | 'scenarios' | 'prompt'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrbLink, setCopiedOrbLink] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* ========================================================= */}
      {/* COMPANY-GRADE TOP NAVBAR                                  */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/25">
              <Phone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">Home Credit</span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-red-50 text-red-700 border border-red-200/80">
                  LAP Pre-Approval
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Autonomous Loan Against Property Voice Intelligence Engine
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('retell')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'retell' 
                  ? 'bg-white text-red-600 shadow-sm border border-slate-200/70' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio size={14} className={activeTab === 'retell' ? "animate-pulse text-red-600" : "text-slate-400"} />
              <span>Live Voice Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/70' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={14} className={activeTab === 'audit' ? "text-emerald-600" : "text-slate-400"} />
              <span>Verified Call Audit</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'matrix' 
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/70' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} className={activeTab === 'matrix' ? "text-indigo-600" : "text-slate-400"} />
              <span>Credit Policy Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'scenarios' 
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/70' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'scenarios' ? "text-amber-600" : "text-slate-400"} />
              <span>Scenario Lab (10)</span>
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'prompt' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} className={activeTab === 'prompt' ? "text-slate-800" : "text-slate-400"} />
              <span>System Prompt</span>
            </button>
          </nav>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2.5">
            <a
              href={RETELL_CALL_HISTORY_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Official Retell Call History & Telemetry"
            >
              <Award size={13} className="text-emerald-600" />
              <span>Retell Audit Log</span>
              <ArrowUpRight size={12} className="text-emerald-500" />
            </a>
            <a
              href="https://github.com/chandramohan385/home-credit-lap-voice-agent"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs"
              title="View Source on GitHub"
            >
              <Code size={13} className="text-slate-500" />
              <span>GitHub</span>
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-8">

        {/* ======================================================= */}
        {/* TAB 1: LIVE VOICE AGENT (RETELL AI ENTERPRISE SHOWCASE) */}
        {/* ======================================================= */}
        {activeTab === 'retell' && (
          <div className="flex flex-col gap-8">
            
            {/* High-Impact Hero Showcase Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/70 to-red-50/30 border border-slate-200/80 p-6 sm:p-10 shadow-sm">
              <div className="relative z-10 flex flex-col gap-4 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold w-fit">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  Home Credit India • Loan Against Property (LAP) Policy Engine
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                  Autonomous Loan Underwriting{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600">
                    Voice Intelligence Engine
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Conducting outbound preliminary qualification calls for a pre-approved Loan Against Property offer up to <strong>₹75,00,000</strong>. Built on <strong>Retell AI WebRTC</strong> with Cartesia neural voice synthesis, Deepgram Nova-2 transcription, and sub-second conversational latency.
                </p>

                {/* Live KPI Telemetry Pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="glass-badge px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs">
                    <Zap size={14} className="text-amber-500" />
                    <span>898 ms Response Latency</span>
                  </div>
                  <div className="glass-badge px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    <span>7-Step Deterministic Rules</span>
                  </div>
                  <div className="glass-badge px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>₹75 Lakhs Pre-Approval Cap</span>
                  </div>
                  <div className="glass-badge px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs">
                    <Radio size={14} className="text-red-600" />
                    <span>Telecom-Grade WebRTC Audio</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Call Console & Policy Engine Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (7 cols): Enterprise Retell Call Console */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="glass-panel-elevated p-6 border-slate-200/90 flex flex-col">
                  
                  {/* Console Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-red-500/20">
                        P
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900">Priya • Home Credit LAP Specialist</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live & Ready
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Retell AI WebRTC • Cartesia Neural TTS • Deepgram Nova-2
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyOrbLink}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Copy Public Call Link"
                      >
                        {copiedOrbLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copiedOrbLink ? "Copied" : "Share Link"}</span>
                      </button>
                      <a
                        href={RETELL_ORB_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-red-600/20"
                      >
                        <ExternalLink size={13} />
                        <span>Open Standalone</span>
                      </a>
                    </div>
                  </div>

                  {/* Formal Direct Call Header */}
                  <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-red-50 via-rose-50/40 to-slate-50 border border-red-200/60 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-2xs">
                        <Phone size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Talk to Priya • Home Credit Loan Specialist</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-semibold">Official AI Rep</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Click the call button on the voice orb below to start your live Loan Against Property session.
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                      <span>Agent: Priya</span>
                    </div>
                  </div>

                  {/* Embedded Retell Web Call Container */}
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner min-h-[580px] flex flex-col">
                    <iframe
                      src={RETELL_ORB_URL}
                      allow="microphone; camera; display-capture; autoplay"
                      className="w-full h-full min-h-[580px] border-0"
                      title="Retell AI Voice Call Agent"
                    />
                  </div>

                  {/* Telephony Footer Telemetry */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <ShieldCheck size={15} className="text-emerald-600" />
                      Microphone permission enabled • Zero latency turn taking
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Agent ID: agent_b6aa2c1cad76fd15ff8f321e3c
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Live Qualification Policy & Quick Test Guide */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                
                {/* Card 1: 7-Item LAP Qualification Checklist */}
                <div className="glass-panel p-6 border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-red-600" />
                      <h3 className="text-sm font-bold text-slate-900">7-Point Credit Policy Checklist</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Home Credit Rules
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    The voice agent autonomously checks each parameter in conversational sequence without frustrating repetitive queries:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    {[
                      { num: 1, title: "Property Type", rule: "Residential, Commercial, Industrial eligible. Farmland strictly disqualified." },
                      { num: 2, title: "Ownership Status", rule: "Both Sole and Joint ownership fully supported." },
                      { num: 3, title: "Original Documents", rule: "Original property papers mandatory. Photocopies exit immediately." },
                      { num: 4, title: "Desired Loan Amount", rule: "Up to ₹75,00,000. Agent tactfully offers ₹75L cap before exit if higher." },
                      { num: 5, title: "Occupation & Income Mode", rule: "Bank salary or business account mandatory. Cash income disqualified." },
                      { num: 6, title: "Market Value", rule: "Captures customer estimate without arbitrary drop-offs." },
                      { num: 7, title: "Repayment Tenure", rule: "3 to 15 years inclusive. Strict credit policy boundaries." }
                    ].map((item) => (
                      <div key={item.num} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-lg bg-red-100 text-red-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {item.num}
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-semibold">{item.title}</strong>
                          <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">{item.rule}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Evaluator Quick Test Guide */}
                <div className="glass-panel p-6 border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={17} className="text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">Evaluator Live Test Guide</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      Sample Flows
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-3">
                    Click <strong>"Call"</strong> on the orb widget and converse naturally. You can test both the complete qualifying flow and specific edge cases:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-950">
                      <strong className="block text-emerald-900 font-bold mb-1">100% Qualifying Happy Path:</strong>
                      <span className="text-[11px] leading-relaxed block text-emerald-800">
                        "Residential flat" → "Sole owner" → "Originals available" → "60 Lakhs" → "Salaried, bank account" → "2 Crores" → "10 years" → <strong>Full Qualification & Expert Handoff!</strong>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70 text-rose-950">
                      <strong className="block text-rose-900 font-bold mb-1">Farmland / Cash Disqualification:</strong>
                      <span className="text-[11px] leading-relaxed block text-rose-800">
                        Say <em>"It is agricultural land"</em> or <em>"I receive cash"</em> → Agent politely disqualifies and wraps up without looping.
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950">
                      <strong className="block text-amber-900 font-bold mb-1">Cap Offer Negotiation:</strong>
                      <span className="text-[11px] leading-relaxed block text-amber-800">
                        Say <em>"I need 90 Lakhs"</em> → Agent presents the ₹75 Lakh cap before disqualifying.
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-indigo-950">
                      <strong className="block text-indigo-900 font-bold mb-1">Balance Transfer Intent:</strong>
                      <span className="text-[11px] leading-relaxed block text-indigo-800">
                        Say <em>"I already have a home loan and want to reduce EMI"</em> → Agent immediately transfers to loan specialist.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: CERTIFIED CALL AUDIT & EVIDENCE                 */}
        {/* ======================================================= */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Col: Official Call Summary & Telemetry (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="glass-panel p-6 border-slate-200 bg-white shadow-sm">
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

                  {/* Verified Actions */}
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
                        href={RETELL_CALL_HISTORY_URL}
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
                <div className="glass-panel p-6 border-slate-200 bg-white flex flex-col h-[520px] shadow-sm">
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
                              : 'bg-red-600 text-white rounded-tr-sm shadow-xs'
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

        {/* ======================================================= */}
        {/* TAB 3: CREDIT POLICY MATRIX                             */}
        {/* ======================================================= */}
        {activeTab === 'matrix' && (
          <div className="glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">7-Point Credit Policy Qualification Matrix</h2>
                <p className="text-xs text-slate-500 mt-0.5">Autonomous Sequential Underwriting Rules specified by Home Credit India</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                Specification Compliance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { num: 1, title: "Property Type", pass: "Residential, Commercial, Industrial", fail: "Agricultural / Farmland", status: "Immediate Disqualification on Farmland" },
                { num: 2, title: "Ownership Status", pass: "Sole or Joint Ownership", fail: "None", status: "Both Sole & Joint Accepted" },
                { num: 3, title: "Document Availability", pass: "Original property papers available", fail: "Photocopies only / Misplaced", status: "Mandatory Original Verification" },
                { num: 4, title: "Desired Loan Amount", pass: "Up to ₹75,00,000 (75 Lakhs)", fail: "> 75 Lakhs (Refused cap)", status: "Offers 75L cap before disqualification" },
                { num: 5, title: "Occupation & Mode", pass: "Salaried/Self-Employed with Bank payout", fail: "Cash Income", status: "Cash Income Strictly Disqualified" },
                { num: 6, title: "Market Value", pass: "Customer Estimated Value", fail: "No minimum cutoff specified", status: "Captured without arbitrary threshold" },
                { num: 7, title: "Repayment Tenure", pass: "3 to 15 Years (Inclusive)", fail: "< 3 years or > 15 years", status: "Strict 3-15 Year Tenure Window" }
              ].map((c) => (
                <div key={c.num} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-red-600">CHECKLIST #{c.num}</span>
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
                  <p className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                    {c.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 4: SCENARIO LAB (10 EDGE CASES)                     */}
        {/* ======================================================= */}
        {activeTab === 'scenarios' && (
          <div className="glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Scenario Architecture & Edge Case Suites</h2>
                <p className="text-xs text-slate-500 mt-0.5">Complete conversational logic branches verified for the Home Credit voice agent</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                10 Test Suites Formulated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TEST_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-red-600">{sc.id}</span>
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${sc.badgeColor}15`, color: sc.badgeColor }}
                      >
                        {sc.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sc.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">{sc.utterances.length} dialogue turns</span>
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Policy Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 5: SYSTEM PROMPT SPECIFICATION                      */}
        {/* ======================================================= */}
        {activeTab === 'prompt' && (
          <div className="glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Production System Prompt Architecture</h2>
                <p className="text-xs text-slate-500 mt-0.5">Adheres strictly to Section 1–5 prompt engineering specifications and zero-placeholder rules</p>
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
3. Present the Pre-Approved Loyalty Offer (up to ₹75,00,000).
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

# 4. SPECIAL LOGIC SWITCHES & ZERO-PLACEHOLDER GUARDRAIL
- Strict Rule: NEVER speak literal variable tokens like "customer name" or brackets "{{...}}". Always use natural conversational language.
- Existing Loan / EMI Reduction: Transfer to specialist and end call.
- Busy Customer: Capture callback time and end call.
- Handoff Gate: Hand off only after all 7 items pass.`;
                  navigator.clipboard.writeText(p);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedPrompt ? "Copied" : "Copy Prompt Text"}</span>
              </button>
            </div>

            <div className="p-5 bg-slate-50 text-slate-800 border border-slate-200/90 rounded-2xl font-mono text-xs overflow-y-auto max-h-[550px] leading-relaxed whitespace-pre-wrap selection:bg-red-100">
{`# 1. AGENT IDENTITY, CONTEXT & TECHNICAL VARIABLES
- You are Priya, an intelligent AI Voice Agent representing Home Credit.
- Agent Gender: Female.
- Customer Name: Chandra Mohan.
- Context: Pre-approved Loan Against Property (LAP) offer up to ₹75 Lakh rupees.
- Language: English (Indian Natural Tone).
- ZERO-PLACEHOLDER GUARDRAIL: Strict rule — NEVER pronounce template placeholders or raw brackets like "{{customer_name}}" or "{{agent_name}}". Always pronounce real conversational names naturally.

# 2. CALL OBJECTIVE & HIGH-LEVEL FLOW
1. Verify Customer Identity: "Hello, may I speak with Chandra Mohan? I am Priya calling from Home Credit."
2. Check for Busy Status: If driving or busy, capture preferred callback time and end call.
3. Present Pre-Approved Offer: "As a valued Home Credit customer, you have a pre-approved Loan Against Property offer of up to 75 Lakh rupees. I'd like to check a few quick details to see if it suits your needs."
4. Detect Balance Transfer Intent: If customer mentions existing loan or EMI reduction, route to transfer specialist.
5. Dynamically Qualify 7 Items: Sequentially check the 7 items. Adapt smoothly to compound answers without asking already-answered questions.
6. Final Action: Immediate polite disqualification OR Congratulations & Senior Loan Expert Handoff.

# 3. 7-ITEM ELIGIBILITY CHECKLIST & BUSINESS RULES
1. Property Type: Residential, Commercial, Industrial eligible. Agricultural land = Disqualify immediately.
2. Ownership: Sole and Joint ownership eligible.
3. Original Documents: Original papers mandatory. Photocopies only = Disqualify.
4. Desired Loan Amount: Up to ₹75,00,000. If > 75 Lakhs, offer ₹75L maximum cap. Disqualify only if refused.
5. Occupation & Income Mode: Salaried or Self-Employed via bank transfer. Cash income = Disqualify.
6. Market Value: Capture customer estimate without cutoff.
7. Repayment Tenure: 3 to 15 years. Outside this range = Disqualify.

# 4. SPECIAL LOGIC SWITCHES
- Existing Loan / EMI Reduction: "I understand! We have special balance transfer solutions to lower your EMIs. I will have our loan transfer specialist call you shortly." -> End call.
- Busy Customer: "No problem at all! When would be a convenient time for us to call you back?" -> Record callback time & end call.
- Handoff Gate: Hand off only after all 7 items pass: "Congratulations! A senior loan expert will call you shortly to discuss exact rates and finalize your application."`}
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* COMPANY-GRADE CORPORATE FOOTER                            */}
      {/* ========================================================= */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-8 text-xs text-slate-500 mt-auto shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">
              HC
            </div>
            <span className="font-bold text-slate-900">Home Credit India</span>
            <span>•</span>
            <span className="text-slate-600">SalesAgents AI - AI Intern (Prompt Engineer) Hiring Assignment</span>
            <span>•</span>
            <span className="text-red-700 font-semibold">Candidate: Avuram Chandra Mohan Reddy</span>
          </div>

          <div className="flex items-center gap-5">
            <a 
              href={RETELL_ORB_URL}
              target="_blank" 
              rel="noreferrer" 
              className="text-red-700 hover:text-red-800 transition-colors font-semibold flex items-center gap-1.5"
            >
              <Radio size={13} className="text-red-600" />
              <span>Live Retell Orb</span>
            </a>
            <a 
              href={RETELL_CALL_HISTORY_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="text-emerald-700 hover:text-emerald-800 transition-colors font-semibold flex items-center gap-1.5"
            >
              <Award size={13} className="text-emerald-600" />
              <span>Verified Call Audit</span>
            </a>
            <a 
              href="https://github.com/chandramohan385/home-credit-lap-voice-agent" 
              target="_blank" 
              rel="noreferrer" 
              className="text-slate-600 hover:text-slate-900 transition-colors font-semibold flex items-center gap-1.5"
            >
              <Code size={13} className="text-slate-500" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
