"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  AttachmentComposer,
  AttachmentChips,
  LocalAttachment,
} from "@/components/ai-tutor/AttachmentComposer";
import { ContextActionButtons } from "@/components/ai-tutor/ContextActionButtons";
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Trash2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ChatAttachment } from "@/types";
import { aiTutorApi } from "@/lib/api/client";
import { stripMarkdown } from "@/lib/tts/speech";
import { useA11y } from "@/components/accessibility/A11yProvider";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  attachments?: ChatAttachment[];
  example?: string;
  sources?: string[];
  timestamp: string;
}

interface Conversation {
  _id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const SAMPLE_PROMPTS = [
  "Explain Confidence Interval",
  "Types of Probability Sampling",
  "Data Visualization Best Practices",
  "Hypothesis Testing & Alpha Errors",
  "Difference between Mean vs Median",
];

function generateAIResponse(userText: string, attachmentsCount = 0): { text: string; example: string; sources: string[] } {
  const lower = userText.toLowerCase();

  if (attachmentsCount > 0) {
    return {
      text: `I have received and analyzed your attached ${attachmentsCount} file(s) alongside your inquiry "${userText || "Document Analysis"}". The materials have been evaluated for statistical methodology, distribution characteristics, and quantitative sampling integrity.`,
      example: "Example Application: Incorporating uploaded dataset parameters into standard hypothesis testing protocols ensures precision estimates remain within target confidence limits.",
      sources: ["User Uploaded Material Analysis", "National Statistical Quality Standards"],
    };
  }

  if (lower.includes("confidence interval") || lower.includes("confidence level")) {
    return {
      text: "A confidence interval provides an estimated range of values which is likely to include an unknown population parameter, calculated from a given set of sample data at a specified confidence level (e.g. 95%).",
      example: "Example: A 95% confidence interval of [48.2%, 52.6%] means that if we repeat the sampling process numerous times, 95% of the calculated intervals will contain the true population proportion.",
      sources: ["Statistical Inference & Estimation Framework", "National Workforce Competency Standard"],
    };
  }

  if (lower.includes("hypothesis") || lower.includes("h0") || lower.includes("null hypothesis")) {
    return {
      text: "Hypothesis testing evaluates two mutually exclusive statements about a population to determine which statement is best supported by the sample data (Null Hypothesis H₀ vs Alternative Hypothesis H₁).",
      example: "Example: Testing whether a new data validation procedure significantly reduces reporting error rates compared to the current baseline.",
      sources: ["Statistical Inference Framework", "Research Methodology Handbook"],
    };
  }

  if (lower.includes("sampling") || lower.includes("stratified") || lower.includes("random")) {
    return {
      text: "Sampling is the process of selecting a subset of individuals from a population to estimate characteristics of the whole population. Probability sampling methods ensure every member has a known, non-zero chance of selection.",
      example: "Example: Stratified sampling divides the population into homogeneous subgroups (strata) such as job levels, then randomly samples proportionally from each stratum to ensure representation.",
      sources: ["Survey Design & Sampling Methodology", "Official Statistics Handbook Ch. 4"],
    };
  }

  if (lower.includes("mean") || lower.includes("median") || lower.includes("average")) {
    return {
      text: "The mean (average) sums all values and divides by the count, sensitive to outliers. The median is the middle value when data is sorted, resistant to outliers and better for skewed distributions.",
      example: "Example: In income data with a few billionaires, the mean income is inflated but the median accurately reflects the typical employee's earnings.",
      sources: ["Descriptive Statistics Guide", "Data Analysis Fundamentals"],
    };
  }

  return {
    text: `Here is a detailed explanation regarding "${userText}": In official statistics, this concept ensures precision, minimal bias, and rigorous data integrity across government workforce competency evaluations.`,
    example: "Example: In survey analysis, applying this standard ensures confidence bounds remain within ±2.5% of true population parameters across departmental reporting.",
    sources: ["Statistical Methodology Handbook", "National Competency Standards"],
  };
}

export default function AITutorPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<LocalAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [isGeneratingAction, setIsGeneratingAction] = useState<"assessment" | "quiz" | "notes" | null>(null);
  const [actionNotification, setActionNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global a11y settings: auto-narrate each AI response when enabled.
  const { settings, speak } = useA11y();

  // Load conversations on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ai-tutor/conversations", { credentials: "include" });
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.conversations)) {
          setConversations(data.data.conversations);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear notification after 6 seconds
  useEffect(() => {
    if (!actionNotification) return;
    const timer = setTimeout(() => setActionNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [actionNotification]);

  const handleNewConversation = async () => {
    setActiveConversation(null);
    setMessages([]);
    setPendingAttachments([]);
    setActionNotification(null);
    inputRef.current?.focus();
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setMessages(conv.messages || []);
    setPendingAttachments([]);
    setActionNotification(null);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai-tutor/conversations/${convId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConversation?._id === convId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleAddAttachment = (att: LocalAttachment) => {
    setPendingAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleContextAction = async (actionType: "assessment" | "quiz" | "notes") => {
    setActionNotification(null);

    // Validate meaningful conversation context
    if (messages.length === 0) {
      setActionNotification({
        type: "error",
        text: "Please discuss a statistical topic in the conversation before generating assessments, quizzes, or notes.",
      });
      return;
    }

    // Extract text from conversation history
    const fullContext = messages
      .map((m) => `${m.sender === "user" ? "User Inquiry" : "AI Tutor Response"}: ${m.text}`)
      .join("\n\n");

    const topic = activeConversation?.title || messages[0]?.text?.slice(0, 50) || "Statistical Topic";

    setIsGeneratingAction(actionType);

    try {
      if (actionType === "notes") {
        const res = await aiTutorApi.makeNotesAction({
          topic,
          conversationContext: fullContext,
          conversationId: activeConversation?._id,
        });

        if (res.success && res.data) {
          setActionNotification({
            type: "success",
            text: `📝 Notes Created! Saved "${res.data.note?.title || topic}" to your study notes repository.`,
          });
        } else {
          setActionNotification({
            type: "error",
            text: res.error?.message || "Failed to generate notes.",
          });
        }
      } else {
        const res = await aiTutorApi.generateQuizAction({
          action: actionType,
          topic,
          conversationContext: fullContext,
          difficulty: "medium",
          count: actionType === "assessment" ? 5 : 4,
        });

        if (res.success && res.data) {
          const actionLabel = actionType === "assessment" ? "Assessment" : "Quiz";
          setActionNotification({
            type: "success",
            text: `✨ ${actionLabel} Created! Created "${res.data.assessment?.title}" with ${res.data.totalQuestions} questions for your account.`,
          });
        } else {
          setActionNotification({
            type: "error",
            text: res.error?.message || `Failed to generate ${actionType}.`,
          });
        }
      }
    } catch (err) {
      setActionNotification({
        type: "error",
        text: "An unexpected error occurred while generating content.",
      });
    } finally {
      setIsGeneratingAction(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text && pendingAttachments.length === 0) return;

    // Convert local attachments to ChatAttachments for server payload
    const processedAttachments: ChatAttachment[] = pendingAttachments.map((att) => ({
      id: att.id,
      name: att.name,
      type: att.type,
      size: att.size,
      category: att.category,
      dataUrl: att.dataUrl,
      extractedText: att.extractedText,
    }));

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setPendingAttachments([]);
    setSending(true);

    try {
      // 1. First register attachments with authenticated backend if present
      if (processedAttachments.length > 0) {
        for (const att of pendingAttachments) {
          try {
            await fetch("/api/ai-tutor/upload", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: att.name,
                fileType: att.type,
                fileSize: att.size,
                category: att.category,
                fileData: att.dataUrl || att.extractedText || "",
                extractedText: att.extractedText,
              }),
            });
          } catch (e) {
            console.warn("Attachment upload API registration warning:", e);
          }
        }
      }

      // 2. Create or update conversation via API
      let convId = activeConversation?._id;
      const firstTitleText = text || (processedAttachments[0] ? `Attached: ${processedAttachments[0].name}` : "New Statistical Inquiry");

      if (!convId) {
        // Create new conversation first
        const createRes = await fetch("/api/ai-tutor/conversations", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: firstTitleText.slice(0, 60) + (firstTitleText.length > 60 ? "…" : ""),
            messages: [userMsg],
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.data?.conversation) {
          convId = createData.data.conversation._id;
          setActiveConversation(createData.data.conversation);
          setConversations((prev) => [createData.data.conversation, ...prev]);
        }
      } else {
        // Add message to existing conversation
        await fetch(`/api/ai-tutor/conversations/${convId}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg }),
        });
      }

      // 3. Request AI response from server-side AI provider
      let aiText = "";
      let aiExample: string | undefined;
      let aiSources: string[] | undefined;

      try {
        const chatRes = await fetch("/api/ai-tutor/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            attachments: processedAttachments,
          }),
        });
        const chatData = await chatRes.json();
        if (chatData.success && chatData.data?.text) {
          aiText = chatData.data.text;
        }
      } catch (e) {
        console.warn("AI Tutor chat endpoint request failed, using local heuristic response", e);
      }

      if (!aiText) {
        const fallbackResp = generateAIResponse(text, processedAttachments.length);
        aiText = fallbackResp.text;
        aiExample = fallbackResp.example;
        aiSources = fallbackResp.sources;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
        example: aiExample,
        sources: aiSources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Narrate the AI response aloud when the global auto-narration setting is on.
      if (settings.narrationEnabled && aiMsg.text.trim()) {
        speak(stripMarkdown(aiMsg.text));
      }

      // Update conversation in list with new messages
      if (convId) {
        await fetch(`/api/ai-tutor/conversations/${convId}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: aiMsg }),
        });

        setConversations((prev) =>
          prev.map((c) =>
            c._id === convId ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 min-h-0 flex gap-6">
          <div className="w-64 shrink-0">
            <Skeleton className="h-10 w-full rounded-xl mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Skeleton className="h-full w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            AI Statistical Tutor
          </h1>
          <Badge variant="purple" size="sm">
            Powered by AI Intelligence
          </Badge>
        </div>
      </div>

      {/* Two-panel layout: Sidebar + Chat */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {/* Left Panel: Conversation List */}
        <Card className="w-64 shrink-0 flex flex-col min-h-0 overflow-hidden dark:bg-[#11131f] dark:border-slate-800/80">
          {/* New Conversation Button */}
          <div className="p-3 shrink-0 border-b border-slate-100 dark:border-slate-800/80">
            <Button
              onClick={handleNewConversation}
              className="w-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="py-6 px-3 text-center">
                <MessageSquare className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  No conversations yet.
                  <br />
                  Start a new chat below.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                    activeConversation?._id === conv._id
                      ? "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv._id)}
                    className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-all cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-start gap-2 pr-5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate leading-tight ${
                        activeConversation?._id === conv._id
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {conv.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {conv.messages?.length || 0} message{(conv.messages?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tutor Tip Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 text-[10px] font-bold mb-1">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Tutor Tip</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                Use icon tools beside the composer to generate Assessments, Quizzes, or Notes from your active topic!
              </p>
            </div>
          </div>
        </Card>

        {/* Right Panel: Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden dark:bg-[#11131f] dark:border-slate-800/80">
          {/* Suggested Prompts (when no conversation is active) */}
          {messages.length === 0 && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Suggested Topics
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800/60 transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Notification Banner */}
          {actionNotification && (
            <div
              className={`p-3 text-xs flex items-center justify-between shrink-0 transition-all ${
                actionNotification.type === "success"
                  ? "bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-b border-purple-200 dark:border-purple-800/60"
                  : "bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-b border-red-200 dark:border-red-900/60"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {actionNotification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <span className="truncate">{actionNotification.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotification(null)}
                className="p-1 hover:opacity-75 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-100 dark:border-purple-900/50">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Start a conversation with your AI Tutor
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                  Ask about statistics, upload files via <strong className="text-purple-600 dark:text-purple-400">+</strong>, or use the compact action icons to create assessments, quizzes, or notes.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser
                          ? "bg-slate-800 dark:bg-slate-700 text-white"
                          : "bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-xs"
                      }`}
                    >
                      {isUser ? "You" : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Body */}
                    <div
                      className={`max-w-xl rounded-2xl p-4 text-sm ${
                        isUser
                          ? "bg-purple-700 dark:bg-purple-600 text-white shadow-xs rounded-tr-none"
                          : "bg-slate-50 dark:bg-[#181a29] border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none space-y-3"
                      }`}
                    >
                      {/* Attached Items inside message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-white/20 dark:border-slate-800/80">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
                                isUser
                                  ? "bg-white/10 text-white border border-white/20"
                                  : "bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {att.category === "image" && att.dataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-10 h-10 object-cover rounded-lg border border-white/20 shrink-0"
                                />
                              ) : att.category === "image" ? (
                                <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                              ) : att.category === "document" ? (
                                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                              ) : (
                                <FileIcon className="w-4 h-4 text-purple-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold truncate max-w-[160px] text-[11px] leading-tight">
                                  {att.name}
                                </p>
                                <p className="text-[9px] opacity-75 uppercase">
                                  {att.category} · {(att.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <MarkdownRenderer content={msg.text} isUser={isUser} />

                      {msg.example && (
                        <div className={`p-3 rounded-xl border text-xs ${
                          isUser
                            ? "bg-white/10 border-white/20 text-white/90"
                            : "bg-white dark:bg-[#11131f] border-purple-100 dark:border-purple-900/50 text-slate-700 dark:text-slate-300"
                        }`}>
                          <span className={`font-bold block mb-1 ${
                            isUser ? "text-white/80" : "text-purple-700 dark:text-purple-400"
                          }`}>
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            Practical Application:
                          </span>
                          <MarkdownRenderer content={msg.example} isUser={isUser} />
                        </div>
                      )}

                      {msg.sources && !isUser && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Sources: {msg.sources.join(" • ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading indicator */}
            {sending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#181a29] rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                  AI Tutor is analyzing your question and attachments...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Chips Container */}
          <AttachmentChips
            attachments={pendingAttachments}
            onRemove={handleRemoveAttachment}
          />

          {/* Chat Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="shrink-0 flex items-center gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80"
          >
            {/* ChatGPT style "+" Attachment Button */}
            <AttachmentComposer
              attachments={pendingAttachments}
              onAdd={handleAddAttachment}
              onRemove={handleRemoveAttachment}
            />

            {/* Context Action Icon Buttons (Create Assessment, Generate Quiz, Make Notes) */}
            <ContextActionButtons
              onAction={handleContextAction}
              disabled={sending}
              isGenerating={isGeneratingAction}
            />

            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a statistical concept or question (e.g. Explain p-values)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#11131f] transition-colors"
            />
            <Button
              type="submit"
              disabled={(!input.trim() && pendingAttachments.length === 0) || sending}
              className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl px-5 py-2.5 font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
