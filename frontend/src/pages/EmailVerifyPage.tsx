import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyRegisterCode, resendRegisterCode } from "@/lib/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try { return JSON.stringify(err); } catch { return "Unknown error"; }
}

export default function EmailVerifyPage() {
  const q = useQuery();
  const navigate = useNavigate();
  const emailParam = q.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(email ? `Мы отправили код на ${email}` : null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const digitsOnly = (s: string) => s.replace(/\D/g, "");

  const handleChange = (idx: number, v: string) => {
    setError(null);
    const d = digitsOnly(v);
    setCode((prev) => {
      const next = [...prev];
      if (d.length <= 1) {
        next[idx] = d;
        if (d && idx < 5) inputsRef.current[idx + 1]?.focus();
      } else {
        for (let i = 0; i < d.length && idx + i < 6; i++) next[idx + i] = d[i];
        const last = Math.min(idx + d.length, 5);
        inputsRef.current[last]?.focus();
      }
      return next;
    });
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      setCode((prev) => {
        const next = [...prev];
        next[idx - 1] = "";
        return next;
      });
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = digitsOnly(e.clipboardData.getData("text"));
    if (!text) return;
    setCode((prev) => {
      const next = [...prev];
      for (let i = 0; i < text.length && idx + i < 6; i++) next[idx + i] = text[i];
      const last = Math.min(idx + text.length - 1, 5);
      inputsRef.current[last]?.focus();
      return next;
    });
  };

  const allDigits = code.join("");
  const canSubmit = !!email && allDigits.length === 6 && !submitting;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const data = await verifyRegisterCode({ email, code: allDigits });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setError(null);
    try {
      await resendRegisterCode(email);
      setInfo(`Код отправлен повторно на ${email}`);
      setCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-6 bg-white dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold mb-2">Подтверждение почты</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Введите 6-значный код, отправленный на вашу почту.
        </p>

        {!emailParam && (
          <div className="mb-4">
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        )}

        <form onSubmit={submit}>
          <div className="flex items-center justify-between gap-2 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                // ВАЖНО: callback-ref ничего не возвращает (void)
                ref={(el: HTMLInputElement | null) => { inputsRef.current[i] = el; }}
                className="w-12 h-12 text-center text-xl rounded-xl border outline-none focus:ring"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={code[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(i, e)}
              />
            ))}
          </div>

          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          {info && <div className="text-sm text-emerald-600 mb-2">{info}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl py-2.5 font-medium bg-black text-white disabled:opacity-40"
          >
            {submitting ? "Проверяем..." : "Подтвердить"}
          </button>
        </form>

        <div className="mt-4 text-sm flex items-center justify-between">
          <button
            type="button"
            onClick={resend}
            disabled={!email || cooldown > 0}
            className="underline disabled:no-underline disabled:opacity-50"
          >
            Отправить код снова
          </button>
          <span className="text-neutral-600 dark:text-neutral-400">
            {cooldown > 0 ? `Повторно через ${cooldown}s` : "Можно отправить снова"}
          </span>
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          Указали не тот email?{" "}
          <button className="underline" onClick={() => navigate(-1)}>
            Вернуться
          </button>
        </div>
      </div>
    </div>
  );
}
