import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Scale,
  Users,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Cpu,
  CheckCircle2,
  ChevronRight,
  Layers,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { getActiveKernel } from '../kernel/kernelModule';

interface LandingPageViewProps {
  // Every entry point on this page opens the identity/persona modal — there
  // is no direct, unauthenticated path into any role. (Note: the modal's
  // current demo persona-switcher is not production authentication — see
  // the FAQ entry on this page for an honest account of what that means.)
  onOpenAuthModal: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onOpenAuthModal }) => {
  const kernel = getActiveKernel();

  // Pulled live from the real kernel JSON — not hardcoded preview copy that
  // can drift from what Compass Master actually shows. Featuring the four
  // constitutional sections plus one strong operational example.
  const featuredIds = ['II', 'III', 'XIV', 'XV', 'XXVII'];
  const previewSections = useMemo(
    () => kernel.principles.filter((p) => featuredIds.includes(p.id)),
    [kernel]
  );
  const [selectedPreviewSection, setSelectedPreviewSection] = useState<string>(
    previewSections[0]?.id || 'II'
  );
  const activeSection = previewSections.find((s) => s.id === selectedPreviewSection) || previewSections[0];

  const constitutionalCount = kernel.principles.filter((p) => p.constitutional).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Strategic Announcement Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Kernel v{kernel.version}
          </span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="text-slate-300">Higher Education Strategic Intelligence & Governance Operating System</span>
          <span className="hidden md:inline text-slate-700">•</span>
          <span className="hidden md:inline text-indigo-300 font-medium">
            {kernel.principles.length} Sections · {constitutionalCount} Constitutional
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuthModal}
            className="text-slate-300 hover:text-white font-medium hover:underline text-[11px] flex items-center gap-1"
          >
            <Lock className="w-3 h-3 text-indigo-400" /> Preview a Role (Demo)
          </button>
          <button
            onClick={onOpenAuthModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-0.5 rounded text-[11px] transition shadow"
          >
            Enter Platform &rarr;
          </button>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-600/30 font-serif">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-serif">Proteus</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  Strategic Compass
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Higher Education AI Governance & Scenario Intelligence</p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#why-proteus" className="hover:text-indigo-400 transition">The Governance Dilemma</a>
            <a href="#three-pillars" className="hover:text-indigo-400 transition">Three Pillars</a>
            <a href="#compass-framework" className="hover:text-indigo-400 transition">The Kernel</a>
            <a href="#personas" className="hover:text-indigo-400 transition">Stakeholder Personas</a>
            <a href="#faq" className="hover:text-indigo-400 transition">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAuthModal}
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Identity</span>
            </button>
            <button
              onClick={onOpenAuthModal}
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/25 transition flex items-center gap-1.5"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shared Governance for Generative AI in Higher Education</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white font-serif tracking-tight leading-[1.15]">
              Where Institutional Momentum Meets Academic Judgment.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              University leaders and faculty are caught between the pressure to adopt AI and the need to protect academic integrity, student rights, and accreditation. <strong className="text-white font-semibold">Proteus</strong> is a governance workspace that gives Provosts, Faculty Senates, and Trustees a shared, evidence-grounded framework to reason through that tension together.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={onOpenAuthModal}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center gap-2 group"
              >
                <span>Enter the Executive Hub</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAuthModal}
                className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 font-semibold text-sm rounded-xl transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Preview as a Stakeholder (Demo)</span>
              </button>

              <a
                href="#compass-framework"
                className="px-4 py-3.5 text-slate-400 hover:text-white font-medium text-sm transition flex items-center gap-1"
              >
                <span>Browse the Kernel</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Key Governance Mechanisms — each line below is a real, enforced rule, not a feature promise */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Scale className="w-3.5 h-3.5" /> Dual Sign-Off
                </div>
                <div className="text-lg font-bold text-white font-serif">Two-Body Approval</div>
                <p className="text-[11px] text-slate-400 mt-1">Decisions touching grading or enrollment can't be marked implemented until both Faculty Senate and Provost sign-off are approved.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Human Floor
                </div>
                <div className="text-lg font-bold text-white font-serif">Human-in-the-Loop</div>
                <p className="text-[11px] text-slate-400 mt-1">No decision reaches "implemented" without an explicit human disposition and a stated recommended action.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5" /> Overlay Packs
                </div>
                <div className="text-lg font-bold text-white font-serif">Institutional Context</div>
                <p className="text-[11px] text-slate-400 mt-1">One shared kernel, layered with each institution's own accreditor and jurisdiction details.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Red-Flag Library
                </div>
                <div className="text-lg font-bold text-white font-serif">Documented Failures</div>
                <p className="text-[11px] text-slate-400 mt-1">Real, sourced cases of AI-in-higher-ed failures to check a proposal against before launch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Governance Dilemma Section */}
      <section id="why-proteus" className="py-20 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
              The Strategic Challenge
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              Why Higher Ed AI Policies Fail in Practice
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Most universities attempt to govern artificial intelligence with static policy PDFs or ad-hoc department memos. Both approaches tend to collapse under real-world pressure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Failure Path */}
            <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-rose-600/10 text-rose-400 px-3 py-1 rounded-bl-xl text-xs font-bold">
                A Common Pattern
              </div>
              <h3 className="text-xl font-bold text-rose-300 font-serif flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Fragmented Shadow AI & Committee Paralysis
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                  <span><strong>Uncoordinated shadow adoption:</strong> students and faculty often use unauthorized generative tools without any institutional visibility into data handling, long before leadership notices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                  <span><strong>Detector controversies:</strong> commercial plagiarism/AI detectors have a documented history of false positives, disproportionately affecting ESL and neurodivergent students.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                  <span><strong>Unilateral vendor commitments:</strong> procurement signs multi-year AI contracts before Faculty Senate has reviewed the pedagogical or copyright implications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                  <span><strong>Reactive bans that don't hold:</strong> blanket bans tend to push usage underground, widening equity gaps rather than closing them.</span>
                </li>
              </ul>
            </div>

            {/* The Proteus Approach */}
            <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600/10 text-emerald-400 px-3 py-1 rounded-bl-xl text-xs font-bold">
                The Proteus Approach
              </div>
              <h3 className="text-xl font-bold text-emerald-300 font-serif flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                A Structured, Evidence-Grounded Compass
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Evidence Ledger:</strong> every claim requires a working source link before it can be saved. Nothing enters the record unsourced.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dual sign-off gate:</strong> decisions touching grading or enrollment require both Faculty Senate and Provost approval before implementation is possible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Overlay packs:</strong> one shared kernel, adapted per institution with its own accreditor, jurisdiction, and data-protection context.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Grassroots input:</strong> pulse surveys and anonymous shadow-AI reports surface real usage patterns leadership might not otherwise see.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Three Pillars Section */}
      <section id="three-pillars" className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
              Architectural Foundations
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              The Three Core Pillars of Proteus
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Built to respect the traditions of shared governance while keeping pace with how quickly AI capabilities change.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-serif">Pillar I: A 30-Section Governing Framework</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  A structured framework spanning academic integrity, procurement, privacy, and the whole institutional ecosystem. Four sections — human agency, common good, democratic governance, and privacy — are marked as the constitutional core the rest operate within.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800 mt-6 text-xs text-indigo-400 font-semibold flex items-center gap-1">
                <span>Hardcoded Human-in-the-Loop Floor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-serif">Pillar II: Dual Sign-Off on High-Stakes Decisions</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Top-down mandates spark faculty pushback; bottom-up paralysis halts progress entirely. For any decision touching grading or enrollment, Proteus requires both Faculty Senate and Provost sign-off before it can move to "implemented" — neither side can act alone.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800 mt-6 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span>Either Side Can Hold the Gate</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-serif">Pillar III: Evidence & Documented Red Flags</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Every evidence claim needs a source link to be saved. A built-in Red-Flag Library of real, sourced AI-in-higher-ed failures lets you self-check a proposal for matching warning signs before launch.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800 mt-6 text-xs text-amber-400 font-semibold flex items-center gap-1">
                <span>No Evidence Without a Source</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Kernel Explorer — real data, pulled live from the kernel JSON */}
      <section id="compass-framework" className="py-20 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
              The Governing Framework
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              Explore the Kernel
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              The Compass Master covers every dimension of institutional life — from classroom pedagogy to cloud procurement. The sections below are pulled directly from the live kernel, not a separate preview.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Section Selector */}
            <div className="lg:col-span-4 space-y-2">
              {previewSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedPreviewSection(sec.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedPreviewSection === sec.id
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-indigo-400 font-bold">Section {sec.id}</span>
                    {sec.constitutional && (
                      <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[10px]">Constitutional</span>
                    )}
                  </div>
                  <div className="font-semibold text-sm font-serif line-clamp-1">{sec.title}</div>
                </button>
              ))}

              <div className="pt-2">
                <button
                  onClick={onOpenAuthModal}
                  className="w-full text-center py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition flex items-center justify-center gap-1.5"
                >
                  <span>Open the Full 30-Section Compass Master</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Section Active Detail Display */}
            {activeSection && (
              <div className="lg:col-span-8 bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Section {activeSection.id}</span>
                    <h3 className="text-2xl font-bold text-white font-serif mt-1">{activeSection.title}</h3>
                  </div>
                  {activeSection.constitutional && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                      Constitutional Core
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Summary</h4>
                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                      {activeSection.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Key Directives
                    </h4>
                    <ul className="space-y-1.5">
                      {activeSection.keyDirectives.slice(0, 4).map((d, i) => (
                        <li key={i} className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Live kernel content, v{kernel.version} — not a separate marketing summary</span>
                  <button
                    onClick={onOpenAuthModal}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    Enter Workspace &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stakeholder Personas Section */}
      <section id="personas" className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
              Role-Based Views
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              Built for Every Seat at the Table
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Proteus adapts what it shows based on role. Preview any of the three demo personas below to see the platform from their seat — this opens the same identity selector as "Select Identity" above.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Persona 1: Provost */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-lg">
                    EV
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-serif text-lg">Dr. Evelyn Vance</h3>
                    <p className="text-xs text-emerald-400 font-semibold">Provost & Executive Vice Chancellor</p>
                    <span className="text-[10px] uppercase font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                      High-Level Administration
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Oversees institutional strategy and issues the administrative half of the dual sign-off. Can view campus-wide decisions, evidence, and predictions.
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="text-slate-300 font-medium">Can:</div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Record administrative sign-off
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configure overlay pack & accreditors
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
                    <Lock className="w-3.5 h-3.5" /> Still needs Faculty Senate concurrence to implement
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={onOpenAuthModal}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Preview as Provost</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Persona 2: Faculty Senate Chair */}
            <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-lg">
                    MT
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-serif text-lg">Prof. Marcus Thorne</h3>
                    <p className="text-xs text-indigo-400 font-semibold">Faculty Senate Chair</p>
                    <span className="text-[10px] uppercase font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded">
                      Academic Governance & Faculty
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Represents academic governance and issues the academic half of the dual sign-off. Reviews evidence staged for the ledger.
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="text-slate-300 font-medium">Can:</div>
                  <div className="flex items-center gap-1.5 text-indigo-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Record academic sign-off
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve or reject staged evidence claims
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
                    <Lock className="w-3.5 h-3.5" /> Cannot set administrative sign-off
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={onOpenAuthModal}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Preview as Senate Chair</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Persona 3: Student Body President */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-base shadow-lg">
                    ML
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-serif text-lg">Maya Lin</h3>
                    <p className="text-xs text-amber-400 font-semibold">Student Body President</p>
                    <span className="text-[10px] uppercase font-bold bg-amber-950/80 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                      Student Representative
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Sees a scoped, student-relevant view: submits pulse surveys and reports shadow AI tools she encounters in courses.
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="text-slate-300 font-medium">Can:</div>
                  <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Submit pulse survey responses
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Report shadow AI use she's seen in courses
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
                    <Lock className="w-3.5 h-3.5" /> Cannot set sign-offs or change decision status
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={onOpenAuthModal}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Preview as Student President</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              Questions We Expect
            </h2>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-base font-serif flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                How does Proteus differ from a standard campus Acceptable Use Policy (AUP)?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                An AUP is a static document that's rarely read until an infraction occurs. Proteus is an interactive governance workspace: decisions carry structured evidence, require explicit human sign-off before implementation, and are checked against a library of documented failure patterns — rather than sitting on a shelf.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-base font-serif flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                What if our institution has unique state regulations or a religious charter?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Proteus uses an overlay-pack model. The core 30-section kernel stays the same for every institution; <em>Overlay Packs</em> attach each institution's own accreditors, jurisdiction, and data-protection regime on top of it without changing the underlying framework.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-base font-serif flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Can a Provost or Board unilaterally bypass the Faculty Senate?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Not for decisions touching grading or enrollment: the platform blocks the status change to "implemented" until both the academic and administrative sign-offs are recorded as approved. Either side not approving holds the decision.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-base font-serif flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Is Proteus production-ready, and how does sign-in actually work today?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Proteus is in active development. Today, "Select Identity" lets you preview the platform through one of three demo personas, or enter a custom name/role — this is meant to demonstrate the role-based views, not to serve as secured production sign-in. Institutional single sign-on and verified identity are on the roadmap; until that lands, treat any decision made in a demo session as a rehearsal, not a real institutional record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="py-16 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-900/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                See How Proteus Would Handle Your Next AI Decision
              </h2>
              <p className="text-sm text-slate-300">
                Preview the workspace as a Provost, Faculty Senate Chair, or student representative.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenAuthModal}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <span>Launch Proteus Compass OS</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAuthModal}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Select Identity</span>
              </button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs font-serif">P</div>
              <span className="font-semibold text-slate-400">Proteus Strategic Compass</span>
              <span>• Higher Education AI Governance Operating System</span>
            </div>

            <div className="flex items-center gap-4">
              <span>Kernel v{kernel.version}</span>
              <span>•</span>
              <span>Development Preview</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
