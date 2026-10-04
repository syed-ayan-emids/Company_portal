import { useEffect, useState } from "react";
import { api } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    api
      .me()
      .then((r) => setUser(r.employee))
      .catch((e) => (e.unauthorized ? setUser(null) : setBootError(e.message)));
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emids-ink">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl emids-gradient animate-pulse" />
          <p className="text-white/60 text-sm">Loading portal…</p>
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emids-ink">
        <div className="text-center text-white/80">
          <p className="text-lg font-semibold">Portal API unreachable</p>
          <p className="text-sm text-white/50 mt-2">{bootError}</p>
          <p className="text-sm text-white/50 mt-4">Start the backend: uvicorn app.main:app --port 8010</p>
        </div>
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} setUser={setUser} />
  ) : (
    <Login onLogin={setUser} />
  );
}
