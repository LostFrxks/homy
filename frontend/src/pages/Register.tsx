// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // простая валидация
    if (!form.name.trim()) return setError("Укажите имя/название");
    if (!form.email.trim()) return setError("Укажите email");
    if (!form.password.trim()) return setError("Введите пароль");
    if (!form.agree) return setError("Нужно согласиться с условиями");

    try {
      setLoading(true);

      // ⬇️ тут позже будет реальный вызов бэка:
      // const res = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/+$/,"")}/auth/register`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      // });
      // if (!res.ok) throw new Error(await res.text() || "Ошибка регистрации");
      // alert("Регистрация прошла! Проверьте почту для подтверждения.");
      // nav("/login");

      alert("Регистрация на бэке ещё не включена. Форма готова — подключим, когда появится эндпоинт.");
    } catch (e: any) {
      setError(e?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f7fb",
      padding: 16
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)"
      }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Создать аккаунт</h2>
        <p style={{ marginTop: 0, color: "#555" }}>Зарегистрируйтесь как риелтор, чтобы публиковать объекты</p>

        {error && (
          <div style={{ background: "#fde8e8", color: "#b91c1c", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label>Имя / компания</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Например, Иван Петров"
              required
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              required
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Пароль</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{ padding: "6px 10px" }}>
                {showPwd ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm(f => ({ ...f, agree: e.target.checked }))}
            />
            <span>Соглашаюсь с условиями сервиса</span>
          </label>

          <button type="submit" disabled={loading} style={{
            padding: "10px 16px",
            background: "blue",
            color: "white",
            borderRadius: 8,
            border: "none"
          }}>
            {loading ? "Создаю…" : "Зарегистрироваться"}
          </button>

          <div style={{ textAlign: "center", fontSize: 14 }}>
            Уже есть аккаунт?{" "}
            <Link to="/login" style={{ color: "blue", textDecoration: "underline" }}>
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}