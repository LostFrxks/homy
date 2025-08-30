// src/pages/ForgotPassword.tsx
import { useState } from "react";
import { requestPasswordCode } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.trim()) return setErr("Укажите email");
    try {
      setLoading(true);
      await requestPasswordCode(email.trim());
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || "Ошибка");
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
            onChange={(e) => setEmail(e.target.value)}
          />
          <button disabled={loading}>{loading ? "Отправляем…" : "Отправить код"}</button>
        </form>
      )}
    </div>
  );
}