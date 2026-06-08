"use client";

import { SAAS_NAME } from "@/lib/branding";
import { useEffect, useState } from "react";

type Phase =
  | "idle"
  | "typing-assistant-1"
  | "message-1"
  | "typing-user"
  | "message-user"
  | "typing-assistant-2"
  | "message-2"
  | "hold";

const WELCOME =
  "Bonjour ! Je suis l'assistant de votre entreprise. Quelle formation vous intéresse ?";
const USER_MSG = "Cordiste IRATA au Togo, prochaine session ?";
const REPLY_INTRO = "Voici les sessions à venir :";

const TIMING = {
  idle: 400,
  typingAssistant: 1400,
  typingUser: 900,
  message1Char: 28,
  messageUserChar: 35,
  message2Delay: 600,
  hold: 3500,
};

function useTypewriter(text: string, active: boolean, msPerChar: number) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, active, msPerChar]);

  return displayed;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2.5 w-fit">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
    </div>
  );
}

function Bubble({
  children,
  variant,
  visible,
}: {
  children: React.ReactNode;
  variant: "assistant" | "user";
  visible: boolean;
}) {
  return (
    <div
      className={`transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${variant === "user" ? "ml-8 flex justify-end" : ""}`}
    >
      <div
        className={`max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
          variant === "assistant"
            ? "bg-slate-100 text-slate-700"
            : "bg-brand-50 text-slate-800 ring-1 ring-brand-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ChatPreviewDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const steps: { phase: Phase; delay: number }[] = [
      { phase: "idle", delay: TIMING.idle },
      { phase: "typing-assistant-1", delay: TIMING.typingAssistant },
      { phase: "message-1", delay: WELCOME.length * TIMING.message1Char + 400 },
      { phase: "typing-user", delay: TIMING.typingUser },
      { phase: "message-user", delay: USER_MSG.length * TIMING.messageUserChar + 300 },
      { phase: "typing-assistant-2", delay: TIMING.typingAssistant },
      { phase: "message-2", delay: TIMING.message2Delay },
      { phase: "hold", delay: TIMING.hold },
    ];

    let stepIndex = 0;
    let timeoutId: number;

    function runStep() {
      const step = steps[stepIndex];
      setPhase(step.phase);
      timeoutId = window.setTimeout(() => {
        stepIndex += 1;
        if (stepIndex >= steps.length) {
          setCycle((c) => c + 1);
          stepIndex = 0;
        }
        runStep();
      }, step.delay);
    }

    runStep();
    return () => window.clearTimeout(timeoutId);
  }, [cycle]);

  const welcomeTyping = useTypewriter(WELCOME, phase === "message-1", TIMING.message1Char);
  const userTyping = useTypewriter(USER_MSG, phase === "message-user", TIMING.messageUserChar);

  const showWelcome =
    phase === "message-1" ||
    phase === "typing-user" ||
    phase === "message-user" ||
    phase === "typing-assistant-2" ||
    phase === "message-2" ||
    phase === "hold";

  const showUser =
    phase === "message-user" ||
    phase === "typing-assistant-2" ||
    phase === "message-2" ||
    phase === "hold";

  const welcomeText = phase === "message-1" ? welcomeTyping : showWelcome ? WELCOME : "";
  const userText = phase === "message-user" ? userTyping : showUser ? USER_MSG : "";

  const showReply = phase === "message-2" || phase === "hold";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
          IA
        </div>
        <div>
          <p className="text-xs font-semibold">Assistant {SAAS_NAME}</p>
          <p className="flex items-center gap-1 text-[10px] text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            En ligne
          </p>
        </div>
      </div>

      <div className="mt-2 min-h-[168px] space-y-1.5">
        {phase === "typing-assistant-1" && <TypingIndicator />}

        {showWelcome && (
          <Bubble variant="assistant" visible={showWelcome}>
            {welcomeText}
            {phase === "message-1" && welcomeText.length < WELCOME.length && (
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-500 align-middle" />
            )}
          </Bubble>
        )}

        {phase === "typing-user" && (
          <div className="ml-8 flex justify-end">
            <TypingIndicator />
          </div>
        )}

        {showUser && (
          <Bubble variant="user" visible={showUser}>
            {userText}
            {phase === "message-user" && userText.length < USER_MSG.length && (
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-600 align-middle" />
            )}
          </Bubble>
        )}

        {phase === "typing-assistant-2" && <TypingIndicator />}

        {showReply && (
          <Bubble variant="assistant" visible={showReply}>
            {REPLY_INTRO}
            <span
              className={`mt-2 inline-block rounded bg-brand-600 px-2.5 py-1 text-[10px] font-medium text-white transition-all duration-500 ${
                showReply ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              Mars 2026 — Inscription
            </span>
          </Bubble>
        )}
      </div>

      <p className="mt-2 text-center text-[10px] text-slate-400">
        Démo en direct — comme sur votre site
      </p>
    </div>
  );
}
