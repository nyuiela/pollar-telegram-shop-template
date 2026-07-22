"use client";

import { useEffect, useState } from "react";
import { usePollar } from "@pollar/react";
import type { AuthState } from "@pollar/core";
import { useTelegram } from "@/components/telegram-provider";

type PollarLoginProps = {
  title?: string;
  subtitle?: string;
};

/**
 * Pollar login for Telegram Mini Apps.
 * Custom flow (email OTP baseline + Google/GitHub) is primary.
 * Secondary: Pollar native login widget via `openLoginModal()` ("Open Widget").
 */
export function PollarLogin({
  title = "Sign in with Pollar",
  subtitle = "Email OTP is the reliable path inside Telegram. Google/GitHub may open an external browser.",
}: PollarLoginProps) {
  const { login, getClient, isAuthenticated, openLoginModal } = usePollar();
  const telegram = useTelegram();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [auth, setAuth] = useState<AuthState>(() => getClient().getAuthState());
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return getClient().onAuthStateChange(setAuth);
  }, [getClient]);

  if (isAuthenticated) return null;

  const step = auth.step;
  const busy =
    step === "creating_session" ||
    step === "sending_email" ||
    step === "verifying_email_code" ||
    step === "authenticating" ||
    step === "opening_oauth";

  const needsCode =
    step === "entering_code" ||
    step === "verifying_email_code" ||
    (step === "error" && Boolean(auth.email));

  function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setLocalError("Enter a valid email");
      return;
    }
    login({ provider: "email", email: trimmed });
  }

  function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      setLocalError("Enter the code from your email");
      return;
    }
    getClient().verifyEmailCode(trimmed);
  }

  function onOAuth(provider: "google" | "github") {
    setLocalError(null);
    login({ provider });
  }

  function onOpenWidget() {
    setLocalError(null);
    openLoginModal();
  }

  function onReset() {
    setLocalError(null);
    setCode("");
    getClient().cancelLogin();
  }

  return (
    <section className="rounded-2xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shop-accent)]">
          Pollar
        </p>
        <button
          type="button"
          onClick={onOpenWidget}
          disabled={busy}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[var(--shop-accent)] underline-offset-2 transition hover:underline disabled:opacity-60"
        >
          Open Widget
        </button>
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--shop-fg)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--shop-muted)]">
        {subtitle}
      </p>

      {!needsCode ? (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onOAuth("google")}
              className="rounded-xl border border-[var(--shop-border)] bg-[var(--shop-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--shop-fg)] transition enabled:active:scale-[0.99] disabled:opacity-60"
            >
              Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onOAuth("github")}
              className="rounded-xl border border-[var(--shop-border)] bg-[var(--shop-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--shop-fg)] transition enabled:active:scale-[0.99] disabled:opacity-60"
            >
              GitHub
            </button>
          </div>

          {telegram.inTelegram ? (
            <p className="text-[11px] leading-relaxed text-[var(--shop-muted)]">
              Google/GitHub open in your system browser. After you finish,
              switch back to this Telegram screen — the Mini App keeps waiting
              and will sign you in. Prefer email OTP if that feels flaky.
            </p>
          ) : null}

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--shop-muted)]">
            <span className="h-px flex-1 bg-[var(--shop-border)]" />
            or email
            <span className="h-px flex-1 bg-[var(--shop-border)]" />
          </div>

          <form onSubmit={onSendCode} className="space-y-3">
            <label className="block text-xs font-medium text-[var(--shop-muted)]">
              Email
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-[var(--shop-border)] bg-[var(--shop-bg)] px-3 py-2.5 text-sm text-[var(--shop-fg)] outline-none ring-[var(--shop-accent)] placeholder:text-[var(--shop-muted)] focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[var(--shop-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--shop-accent-fg)] transition enabled:active:scale-[0.99] disabled:opacity-60"
            >
              {busy && step !== "opening_oauth"
                ? "Sending code…"
                : "Send login code"}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={onVerifyCode} className="mt-5 space-y-3">
          <p className="text-sm text-[var(--shop-muted)]">
            Code sent to{" "}
            <span className="font-medium text-[var(--shop-fg)]">
              {"email" in auth ? auth.email : email}
            </span>
          </p>
          <label className="block text-xs font-medium text-[var(--shop-muted)]">
            One-time code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
              placeholder="123456"
              className="mt-1.5 w-full rounded-xl border border-[var(--shop-border)] bg-[var(--shop-bg)] px-3 py-2.5 text-sm tracking-widest text-[var(--shop-fg)] outline-none ring-[var(--shop-accent)] placeholder:text-[var(--shop-muted)] focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[var(--shop-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--shop-accent-fg)] transition enabled:active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-xl px-4 py-2 text-sm text-[var(--shop-muted)] underline-offset-2 hover:underline"
          >
            Use a different method
          </button>
        </form>
      )}

      {step === "opening_oauth" ? (
        <p className="mt-3 text-sm text-[var(--shop-muted)]">
          {telegram.inTelegram
            ? "Finish Google/GitHub in the browser that just opened, then come back to Telegram — this screen will update when login completes."
            : "Finish in the popup window. It should close when you return; this page stays put and signs you in."}
        </p>
      ) : null}

      {(localError || auth.step === "error") && (
        <div
          className="mt-3 space-y-1 overflow-hidden text-sm text-[var(--shop-danger)]"
          role="alert"
        >
          <p className="break-words">
            {localError ?? (auth.step === "error" ? auth.message : null)}
          </p>
          {auth.step === "error" && auth.errorCode ? (
            <p className="break-words font-mono text-xs opacity-90">
              {auth.errorCode}
              {auth.errorCode === "SESSION_CREATE_FAILED"
                ? " — check your pub_testnet_ key and that this origin is allowlisted in the Pollar dashboard."
                : null}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** @deprecated Use PollarLogin — kept for existing imports. */
export const EmailLogin = PollarLogin;
