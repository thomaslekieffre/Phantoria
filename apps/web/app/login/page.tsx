"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseEnabled()) {
    return (
      <main className="login">
        <div className="login__panel">
          <h1>Supabase non configuré</h1>
          <p>Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`.</p>
          <Link href="/">Retour</Link>
        </div>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (mode === "signup" || !authUser) {
      window.location.href = "/gacha";
      return;
    }

    const { count } = await supabase
      .from("player_spirits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authUser.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_pulls_remaining")
      .eq("id", authUser.id)
      .maybeSingle();

    const needsGacha = (count ?? 0) === 0 || (profile?.welcome_pulls_remaining ?? 0) > 0;
    window.location.href = needsGacha ? "/gacha" : "/";
  }

  return (
    <main className="login">
      <div className="login__panel">
        <p className="login__eyebrow">Phantoria</p>
        <h1 className="login__title">{mode === "signin" ? "Connexion" : "Créer un compte"}</h1>

        <form className="login__form" onSubmit={submit}>
          <label className="login__field">
            <span>E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="login__field">
            <span>Mot de passe</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {message ? <p className="login__msg">{message}</p> : null}

          <button type="submit" className="login__submit" disabled={loading}>
            {loading ? "…" : mode === "signin" ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <button
          type="button"
          className="login__switch"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>

        <Link href="/" className="login__back">
          Retour au camp
        </Link>
      </div>
    </main>
  );
}
