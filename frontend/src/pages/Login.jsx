import { useState } from "react";
import { api } from "../api.js";
import EmidsMark from "../components/EmidsMark.jsx";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.login(username.trim().toLowerCase(), password);
      onLogin(res.employee);
    } catch (err) {
      setError(err.message || "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 hero-surface">
      <div className="w-full max-w-sm animate-float-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl emids-gradient shadow-pop flex items-center justify-center mb-5">
            <EmidsMark className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            emids <span className="text-emids-tealsky">Portal</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">Sign in to your workspace</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white/5 border border-white/10 rounded-3xl p-7 backdrop-blur-xl shadow-chat"
        >
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-emids-tealsky mb-2">
            Username
          </label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ayan or ayan.khan@emids.com"
            className="w-full bg-emids-ink/40 border border-white/10 focus:border-emids-teal rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none mb-4 transition-colors"
          />
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-emids-tealsky mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-emids-ink/40 border border-white/10 focus:border-emids-teal rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none mb-2 transition-colors"
          />

          {error ? (
            <p className="text-emids-red text-sm font-medium mt-3 animate-pop">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-5 emids-gradient-red hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-pop transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-[12px] text-white/40 leading-relaxed">
              Demo accounts <span className="text-white/70 font-medium">syedayan</span> ·{" "}
              <span className="text-white/70 font-medium">saramalik</span> — password{" "}
              <span className="text-emids-tealsky font-medium">emids123</span>
            </p>
          </div>
        </form>
      </div>

      <p className="mt-8 text-[11px] text-white/25 tracking-wide uppercase">
        emids · Health Technology Platform
      </p>
    </div>
  );
}
