"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Award,
  SearchCheck,
  GitFork,
  BookOpen,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

function AutoLoginQueryWatcher({ onOpenLogin }: { onOpenLogin: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      onOpenLogin();
    }
  }, [searchParams, onOpenLogin]);

  return null;
}

export default function LandingPage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#faf8fd] flex flex-col font-sans text-slate-800">
      <Suspense fallback={null}>
        <AutoLoginQueryWatcher onOpenLogin={() => setLoginModalOpen(true)} />
      </Suspense>

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-wider">STATLEARN</span>
              <span className="block text-[10px] text-purple-700 font-bold uppercase tracking-widest -mt-1">
                Skill Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-purple-700 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-purple-700 transition-colors">How It Works</a>
            <a href="#organizations" className="hover:text-purple-700 transition-colors">For Organizations</a>
            <a href="#impact" className="hover:text-purple-700 transition-colors">Impact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold text-slate-700 hover:text-purple-700"
              onClick={() => setLoginModalOpen(true)}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-md shadow-purple-700/20"
              onClick={() => setSignUpModalOpen(true)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 text-xs font-semibold mb-8 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          AI-Powered Competency & Learning Intelligence Platform
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Assess. Learn. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Improve. Prove.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          STATLEARN is an AI-powered competency intelligence platform. We identify precise skill gaps, personalize structured learning, and measure real workforce improvement with verifiable evidence.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-purple-700 hover:bg-purple-800 text-white px-8 py-4 rounded-2xl shadow-lg shadow-purple-700/25 font-semibold text-base flex items-center gap-2"
            onClick={() => setSignUpModalOpen(true)}
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="border-slate-200 bg-white hover:bg-slate-50 px-8 py-4 rounded-2xl font-semibold text-base flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-700 fill-purple-700" />
              <span>Explore Features</span>
            </Button>
          </a>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>AI Competency Diagnostic</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Evidence-Based Gap Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>4-Week Structured Roadmaps</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Workspaces</span>
          </div>
        </div>

        {/* HERO DASHBOARD MOCKUP */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-3xl p-3 bg-gradient-to-b from-purple-200/50 to-purple-400/20 shadow-2xl border border-purple-200/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-100 text-left">
            {/* Mock Header */}
            <div className="h-12 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-400">statlearn.intelligence.portal</span>
              </div>
              <div className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full border border-purple-200">
                Product Preview
              </div>
            </div>

            {/* Dashboard Inner Preview */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Overall Competency</div>
                <div className="text-lg font-bold text-slate-800 mt-1">Track your competency</div>
                <div className="text-xs text-purple-700 font-medium mt-1">Continuous diagnostic scoring</div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-600 h-full w-[70%] rounded-full" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Top Skill Gap Identified</div>
                <div className="text-lg font-bold text-slate-800 mt-1">Identify skill gaps</div>
                <div className="text-xs text-amber-600 font-semibold mt-1">Targeted deficit detection</div>
                <div className="mt-2 text-xs text-slate-500">Isolates specific misconceptions and question patterns.</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Recommended Pathway</div>
                <div className="text-lg font-bold text-slate-800 mt-1">Personalized learning path</div>
                <div className="text-xs text-purple-700 font-semibold mt-1">Structured 4-Week Roadmap</div>
                <div className="mt-2 text-xs text-slate-500">Includes iGOT Karmayogi integrated exercises.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY STATLEARN / FEATURES SECTION */}
      <section id="features" className="py-20 bg-white border-y border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">WHY STATLEARN?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Smarter Learning. Measurable Impact.
            </h2>
            <p className="text-slate-600 mt-4 text-base">
              A complete end-to-end framework built for modern statistical institutions, continuous assessment, and evidence-backed capability building.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Competency Assessment</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Adaptive evaluations that analyze knowledge across multiple foundational and applied statistical competencies.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <SearchCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Evidence-Based Gap Analysis</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We do not just show scores; our AI explains why gaps exist, pointing to specific misconceptions and missed question patterns.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <GitFork className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Personalized Learning Paths</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Custom 4-week structured progression (Foundation, Weak Concepts, Applied Practice, Reassessment) tuned to each learner.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">iGOT Karmayogi Integration</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Seamless alignment with official national learning catalogs, auto-recommending targeted modules to bridge gaps.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI-Generated Quizzes</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Trainers upload PDF/text guides to automatically generate structured MCQs and scenario tests with human-in-the-loop review.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Measure & Prove Improvement</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Reassessment benchmarking tracks pre-training vs post-training gains, giving administrators verifiable capability metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKFORCE IMPACT STATS */}
      <section id="impact" className="py-16 bg-[#1a1344] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h3 className="text-lg font-semibold text-purple-300">
              Driving Real Competency Improvement
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-extrabold text-white">AI-Powered</div>
              <div className="text-xs text-purple-200/70 font-medium mt-1 uppercase tracking-wider">Competency Insights</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white">4-Week</div>
              <div className="text-xs text-purple-200/70 font-medium mt-1 uppercase tracking-wider">Structured Roadmaps</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white">Personalized</div>
              <div className="text-xs text-purple-200/70 font-medium mt-1 uppercase tracking-wider">Learning Paths</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white">Multi-Role</div>
              <div className="text-xs text-purple-200/70 font-medium mt-1 uppercase tracking-wider">Learner, Trainer, Admin</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">WORKFLOW</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">The STATLEARN Cycle</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { num: "01", title: "Assess", desc: "Take diagnostic assessments across target competencies" },
              { num: "02", title: "Identify Gaps", desc: "AI maps weak areas and extracts underlying misconceptions" },
              { num: "03", title: "Personalize", desc: "Generate a custom 4-week structured learning roadmap" },
              { num: "04", title: "Learn & Drill", desc: "Complete targeted readings, videos, and focused practice drills" },
              { num: "05", title: "Prove Growth", desc: "Reassess to benchmark and prove quantifiable score gains" },
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm mb-4">
                  {step.num}
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-2">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to elevate your statistical workforce?
          </h2>
          <p className="mt-4 text-purple-200 text-base max-w-xl mx-auto">
            Experience AI-driven competency tracking, automated gap analysis, and tailored learning paths today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-purple-900 hover:bg-purple-50 font-bold px-8 py-3.5 rounded-xl shadow-md"
              onClick={() => setLoginModalOpen(true)}
            >
              Launch Portal
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-wider">STATLEARN</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} STATLEARN Intelligence. All rights reserved.
          </p>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      >
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 items-center justify-center text-white shadow-lg shadow-purple-600/20 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign in to STATLEARN</h2>
          <p className="text-xs text-slate-500 mt-1">Access your learning intelligence dashboard</p>
        </div>
        <LoginForm
          onSuccess={() => setLoginModalOpen(false)}
          onSwitchToSignUp={() => {
            setLoginModalOpen(false);
            setSignUpModalOpen(true);
          }}
        />
      </Modal>

      {/* SIGN UP MODAL */}
      <Modal
        isOpen={signUpModalOpen}
        onClose={() => setSignUpModalOpen(false)}
      >
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 items-center justify-center text-white shadow-lg shadow-purple-600/20 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">Join STATLEARN and start your learning journey</p>
        </div>
        <SignUpForm
          onSuccess={() => setSignUpModalOpen(false)}
          onSwitchToLogin={() => {
            setSignUpModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </Modal>
    </div>
  );
}
