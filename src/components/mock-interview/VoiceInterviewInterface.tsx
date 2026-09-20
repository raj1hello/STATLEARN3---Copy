"use client";

import React, { useState, useEffect, useRef } from "react";
import { MockInterviewQuestion } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useElevenLabsSpeech } from "@/lib/tts/speech";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { ReadAloudControls } from "@/components/accessibility/ReadAloudControls";
import { useA11y } from "@/components/accessibility/A11yProvider";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Clock,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  CornerDownLeft,
} from "lucide-react";

interface VoiceInterviewProps {
  interviewId: string;
  targetRole: string;
  difficulty: string;
  maxQuestions: number;
  currentQuestion: MockInterviewQuestion;
  questions: MockInterviewQuestion[];
  onSubmitAnswer: (answerText: string, questionIndex: number) => Promise<boolean>;
  onFinishInterview: () => Promise<void>;
  submitting: boolean;
}

export const VoiceInterviewInterface: React.FC<VoiceInterviewProps> = ({
  interviewId,
  targetRole,
  difficulty,
  maxQuestions,
  currentQuestion,
  questions,
  onSubmitAnswer,
  onFinishInterview,
  submitting,
}) => {
  const [transcript, setTranscript] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Guards against re-narrating the same feedback/question when props re-render.
  const lastSpokenRef = useRef<{ questionId: string; answeredId: string | null }>({
    questionId: "",
    answeredId: null,
  });

  // Shared ElevenLabs speech (natural voice, with Web Speech fallback).
  const {
    speak: speakQuestion,
    stop: stopSpeaking,
    isActive: isAiSpeaking,
  } = useElevenLabsSpeech();

  // Global a11y setting: read AI responses aloud (auto-narration).
  const { settings: { narrationEnabled } } = useA11y();

  // Reusable Web Speech Recognition (Speech-to-Text) hook for voice input.
  const {
    isRecording,
    transcript: sttTranscript,
    error: micError,
    stop: stopRecording,
    toggle: toggleRecording,
    reset: resetTranscript,
  } = useSpeechToText({ continuous: true, interimResults: true, lang: "en-US" });

  // Merge live speech-to-text results into the editable answer textarea.
  useEffect(() => {
    if (isRecording && sttTranscript && sttTranscript !== transcript) {
      setTranscript(sttTranscript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sttTranscript, isRecording]);

  // Live stopwatch timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-read the current question — and narrate Claude's feedback on the last
  // answered question — as a single natural stream when voice reading is on
  // (the interview's Auto-read toggle OR the global a11y auto-narration).
  useEffect(() => {
    const shouldRead = autoSpeak || narrationEnabled;
    const lastAnswered = [...questions].reverse().find((q) => q.userAnswer);
    const answeredId = lastAnswered ? lastAnswered.id : null;
    const lastFeedback = lastAnswered?.evaluation
      ? lastAnswered.evaluation.feedback
      : null;
    const newFeedback = !!lastFeedback && answeredId !== lastSpokenRef.current.answeredId;
    const newQuestion = currentQuestion.id !== lastSpokenRef.current.questionId;

    if (!currentQuestion?.question || (!newFeedback && !newQuestion)) return;

    lastSpokenRef.current = { questionId: currentQuestion.id, answeredId };
    if (!shouldRead) return;

    const feedbackText = lastFeedback ? `Feedback: ${lastFeedback}. ` : "";
    speakQuestion(
      `${feedbackText}Question ${currentQuestion.questionNumber}: ${currentQuestion.question}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, questions, autoSpeak, narrationEnabled]);

  // Stop any narration when the interview view unmounts.
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendAnswer = async () => {
    if (!transcript.trim() || submitting) return;
    stopRecording();
    stopSpeaking();

    const success = await onSubmitAnswer(
      transcript.trim(),
      currentQuestion.questionNumber - 1
    );

    if (success) {
      resetTranscript();
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = questions.filter((q) => q.userAnswer).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      {/* ============================================================ */}
      {/* LEFT / MAIN INTERACTIVE AREA (8 Cols)                       */}
      {/* ============================================================ */}
      <div className="lg:col-span-8 space-y-6">
        {/* Main AI Interviewer Stage */}
        <Card className="p-8 border-purple-200 dark:border-purple-900/60 bg-gradient-to-b from-white dark:from-[#161828] to-purple-50/20 dark:to-purple-950/20 relative overflow-hidden shadow-card">
          {/* Top Bar inside Stage */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300 ${
                    isAiSpeaking
                      ? "bg-purple-600 ring-4 ring-purple-400/40 animate-pulse scale-105"
                      : "bg-purple-700 dark:bg-purple-600"
                  }`}
                >
                  <Bot className="w-6 h-6" />
                </div>
                {isAiSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Claude AI Interviewer
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                    {isAiSpeaking ? "Speaking Question..." : "Listening to Candidate"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Adaptive Technical & Behavioral Evaluation
                </p>
              </div>
            </div>

            {/* Audio Voice Control Buttons — replay / pause / resume / stop + speed */}
            <ReadAloudControls text={currentQuestion.question} />
          </div>

          {/* Current Question Display */}
          <div className="py-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                Question {currentQuestion.questionNumber} of {maxQuestions}
              </span>
              <Badge variant="purple" size="sm" className="capitalize">
                {currentQuestion.category || "Technical"}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              &quot;{currentQuestion.question}&quot;
            </h2>
          </div>

          {/* Voice Wave Animation when Recording */}
          {isRecording && (
            <div className="py-2 flex items-center justify-center gap-1.5 animate-fadeIn">
              <span className="w-1.5 h-6 bg-purple-600 rounded-full animate-pulse"></span>
              <span className="w-1.5 h-10 bg-purple-500 rounded-full animate-pulse delay-75"></span>
              <span className="w-1.5 h-8 bg-purple-600 rounded-full animate-pulse delay-150"></span>
              <span className="w-1.5 h-12 bg-purple-700 rounded-full animate-pulse delay-100"></span>
              <span className="w-1.5 h-7 bg-purple-500 rounded-full animate-pulse delay-200"></span>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 ml-2">
                Listening to your voice... Speak clearly into your mic.
              </span>
            </div>
          )}

          {/* Microphone Permission / Browser Notice */}
          {micError && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{micError}</span>
            </div>
          )}

          {/* Live Transcript / Candidate Response Editor Area */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Your Spoken Transcript / Answer</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Click the microphone to speak, or type your answer here..."
              disabled={submitting}
              className="w-full bg-slate-50 dark:bg-[#121422] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 leading-relaxed resize-none transition-all"
            />
          </div>

          {/* Bottom Action Controls */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            {/* Big Mic Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={submitting}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 animate-pulse ring-4 ring-red-400/40"
                    : "bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 text-white shadow-purple-700/25"
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Speaking</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                {isRecording ? "Click when finished speaking" : "Speak or edit response"}
              </span>
            </div>

            {/* Submit Answer Button */}
            <Button
              onClick={handleSendAnswer}
              disabled={!transcript.trim() || submitting}
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold px-6 py-3 flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {submitting ? (
                <span aria-live="polite">Claude is evaluating...</span>
              ) : (
                <>
                  <span>Submit Answer & Continue</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Previous Q&A Accordion History */}
        {questions.length > 1 && (
          <Card className="p-6 border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Interview Q&A Transcript History</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                aria-expanded={showHistory}
                aria-controls="interview-history-transcript"
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {showHistory ? "Hide Transcript" : `View ${answeredCount} Answered`}
              </button>
            </div>

            {showHistory && (
              <div id="interview-history-transcript" className="space-y-4 pt-2 animate-fadeIn divide-y divide-slate-100 dark:divide-slate-800">
                {questions
                  .filter((q) => q.userAnswer)
                  .map((q, idx) => (
                    <div key={idx} className="pt-3 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-purple-700 dark:text-purple-400 shrink-0">
                          Q{idx + 1}:
                        </span>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{q.question}</p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-[#181a29] rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-400 block mb-1">Your Answer:</span>
                        <p>{q.userAnswer}</p>
                      </div>

                      {q.evaluation && (
                        <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-300">
                          <span className="font-bold block mb-0.5">Claude Feedback:</span>
                          <p>{q.evaluation.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ============================================================ */}
      {/* RIGHT PANEL (4 Cols) - Progress, Timer, Metrics, Controls    */}
      {/* ============================================================ */}
      <div className="lg:col-span-4 space-y-6">
        {/* Session Info Tile */}
        <Card className="p-6 border-slate-200 dark:border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Role</p>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                {targetRole}
              </h4>
            </div>
            <Badge variant="purple" size="sm" className="capitalize">
              {difficulty}
            </Badge>
          </div>

          {/* Live Timer */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181a29] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Interview Duration</span>
            </div>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
              <span className="sr-only">Interview elapsed time: </span>
              {formatTimer(timerSeconds)}
            </span>
          </div>

          {/* Progress Indicator */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-400">Interview Progress</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                {currentQuestion.questionNumber} / {maxQuestions} Questions
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion.questionNumber - 1) / maxQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Audio Controls */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Auto-read questions</span>
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-1 rounded-xl font-semibold border transition-colors cursor-pointer ${
                autoSpeak
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                  : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {autoSpeak ? "Voice On" : "Voice Off"}
            </button>
          </div>

          {/* End Interview Early Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Conclude interview now and generate final report?")) {
                  onFinishInterview();
                }
              }}
              className="w-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl py-2.5 cursor-pointer"
            >
              Finish Interview & View Report
            </Button>
          </div>
        </Card>

        {/* Tips Tile */}
        <Card className="p-5 border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10 text-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interview Best Practices</span>
          </div>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-1.5">
              <span>•</span>
              <span>Structure answers clearly (Context, Action, Result).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span>•</span>
              <span>Cite quantitative trade-offs and statistical theorems where applicable.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span>•</span>
              <span>Speak clearly into your microphone or edit transcription before submitting.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
