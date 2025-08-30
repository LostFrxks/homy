// src/pages/ResetPassword.tsx
import React, { useState } from "react";
import { confirmPasswordCode } from "@/lib/api"; // или твоя функция для подтверждения

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Ошибка";
  }
}

export default function ResetPassword() {
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [ok, setOk] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!email.trim()) return setErr("Укажите email");
    if (!code.trim()) return setErr("Введите код из письма");
    try {
      setLoading(true);
      await confirmPasswordCode(email.trim(), code.trim());
      setOk(true);
    } catch (err: unknown) {
      setErr(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>Подтверждение кода</h2>
      {ok ? (
        <div style={{ background: "#ecfdf5", padding: 12, borderRadius: 8 }}>
          Пароль изменён. Теперь войдите с новым паролем.
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
          <input
            placeholder="Код из письма"
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
          />
          <button disabled={loading}>{loading ? "Подтверждаем…" : "Подтвердить"}</button>
        </form>
      )}
    </div>
  );
}
