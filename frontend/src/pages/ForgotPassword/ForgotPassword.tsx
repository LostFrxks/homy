// src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { requestPasswordCode } from "@/lib/api";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Ошибка";
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [sent, setSent] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!email.trim()) {
      setErr("Укажите email");
      return;
    }
    try {
      setLoading(true);
      await requestPasswordCode(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setErr(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>Восстановление пароля</h2>
      {sent ? (
        <div style={{ background: "#ecfeff", padding: 12, borderRadius: 8 }}>
          Если такой аккаунт существует, мы отправили код на <b>{email}</b>.
          Проверьте почту и введите код на следующем шаге.
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {err && <div style={{ color: "#b91c1c" }}>{err}</div>}
          <input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
          <button disabled={loading}>{loading ? "Отправляем…" : "Отправить код"}</button>
        </form>
      )}
    </div>
  );
}
