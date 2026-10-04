import { useEffect, useRef, useState } from "react";
import { Bot, Eraser, Send, X } from "lucide-react";
import { api } from "../api.js";
import EmidsMark from "./EmidsMark.jsx";

const QUICK_PROMPTS = ["My tasks", "Meetings today", "Briefings", "My tickets"];

function renderRich(text) {
  // supports **bold** segments from the bot engine
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? (
      <strong key={i} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function ChatWidget({ open, setOpen, pendingPrompt, onPromptDone }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      api
        .chatHistory()
        .then((r) => {
          if (r.messages.length) setMessages(r.messages);
          else
            setMessages([
              {
                role: "bot",
                content:
                  "Hi! I am the **emids Assistant**. Ask me about your tasks, meetings, briefings, tickets or company news — I read your portal data live.",
              },
            ]);
        })
        .catch(() =>
          setMessages([{ role: "bot", content: "Chat is unavailable right now." }])
        );
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open && pendingPrompt && !typing) {
      onPromptDone?.();
      send(pendingPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingPrompt]);

  async function send(text) {
    const message = (text ?? draft).trim();
    if (!message || typing) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setTyping(true);
    try {
      const res = await api.chat(message);
      setMessages((m) => [...m, { role: "bot", content: res.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", content: "Sorry — I hit an error. Try again?" }]);
    } finally {
      setTyping(false);
    }
  }

  async function clearChat() {
    setMessages([{ role: "bot", content: "Chat cleared. Ask me anything new!" }]);
    try {
      await api.clearChat();
    } catch {}
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40"
          onMouseDown={() => setOpen(false)}
        />
      ) : null}

      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? "Close assistant" : "Open emids Assistant"}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full emids-gradient shadow-chat flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          open ? "rotate-0" : "animate-float-in"
        }`}
      >
        {open ? (
          <X size={22} className="text-emids-ink" strokeWidth={2.4} />
        ) : (
          <>
            <EmidsMark className="w-8 h-8 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 ring-[3px] ring-white animate-pulse" />
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed right-24 bottom-6 z-50 w-[380px] max-w-[calc(100vw-120px)] h-[560px] max-h-[calc(100vh-140px)] transition-all duration-300 origin-bottom-right
          ${open ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-6 scale-95 pointer-events-none"}`}
      >
        <div className="w-full h-full bg-emids-paper border border-emids-line rounded-[28px] shadow-chat flex flex-col overflow-hidden">
          <header className="hero-surface px-5 py-4 flex items-center gap-3 shrink-0">
            <span className="w-10 h-10 rounded-2xl emids-gradient flex items-center justify-center shrink-0">
              <EmidsMark className="w-6 h-6 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white leading-tight">emids Assistant</p>
              <p className="text-[11px] text-emids-tealsky flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online · reads your portal data
              </p>
            </div>
            <button
              onClick={clearChat}
              title="Clear chat"
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Eraser size={16} />
            </button>
            <button
              onClick={() => setOpen(false)}
              title="Close"
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X size={17} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto thin-scroll px-4 py-4 space-y-3 bg-emids-mist/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex animate-pop ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "bot" ? (
                  <span className="w-7 h-7 rounded-xl emids-gradient flex items-center justify-center shrink-0 mt-1 mr-2">
                    <Bot size={14} className="text-white" />
                  </span>
                ) : null}
                <div
                  className={`max-w-[80%] whitespace-pre-line text-[13.5px] leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                    m.role === "user"
                      ? "emids-gradient-red text-white rounded-br-md"
                      : "bg-white border border-emids-line text-emids-navy rounded-bl-md"
                  }`}
                >
                  {renderRich(m.content)}
                </div>
              </div>
            ))}

            {typing ? (
              <div className="flex justify-start animate-pop">
                <span className="w-7 h-7 rounded-xl emids-gradient flex items-center justify-center shrink-0 mt-1 mr-2">
                  <Bot size={14} className="text-white" />
                </span>
                <div className="bg-white border border-emids-line rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-emids-tealdeep animate-blink"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="px-4 pb-3 pt-2 bg-white border-t border-emids-line">
            <div className="flex gap-2 mb-2.5 overflow-x-auto thin-scroll pb-0.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="shrink-0 text-[12px] font-semibold text-emids-tealdeep bg-emids-tealsoft hover:bg-emids-tealsky/50 rounded-full px-3.5 py-1.5 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about tasks, meetings, tickets…"
                className="flex-1 bg-emids-mist border border-emids-line focus:border-emids-teal rounded-2xl px-4 py-3 text-[13.5px] outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!draft.trim() || typing}
                title="Send"
                className="w-11 h-11 rounded-2xl emids-gradient-red text-white flex items-center justify-center shadow-card disabled:opacity-40 hover:brightness-110 transition-all active:scale-95"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
