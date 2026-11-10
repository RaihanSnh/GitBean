"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [username, setUsername] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, email, password, username }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Authentication failed.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/"); router.refresh();
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Authentication failed."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><Link href="/" className="auth-back">← GitBean</Link><div className="auth-eyebrow">YOUR BREWING WORKSPACE</div><h1>{mode === "login" ? "Welcome back." : "Join the community."}</h1><p>{mode === "login" ? "Sign in to fork recipes and curate your collection." : "Create an account to save your dial-ins and share branches."}</p><form onSubmit={submit}>{mode === "register" && <label>Brewer username<input required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_.-]+" value={username} onChange={e => setUsername(e.target.value)} placeholder="your.handle" /></label>}<label>Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength={10} maxLength={200} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 10 characters" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form><div className="auth-switch">{mode === "login" ? "New to GitBean?" : "Already have an account?"}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create account" : "Sign in"}</button></div></div></main>;
}
