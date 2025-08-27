import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "@/lib/api";

type FieldErrors = { identity?: string; password?: string; general?: string };

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/";

  const [identity, setIdentity] = useState(""); // логин или email — оба валидны
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const canSubmit = useMemo(
    () => identity.trim().length > 0 && password.length > 0 && !loading,
    [identity, password, loading]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!identity.trim() || !password) {
      setErrors({
        identity: !identity.trim() ? "Введите логин или email" : undefined,
        password: !password ? "Введите пароль" : undefined,
      });
      return;
    }

    try {
      setLoading(true);
      const data = await login(identity.trim(), password);
      localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      nav(from, { replace: true });
    } catch {
      setErrors({ general: "Неверные учётные данные или сервер недоступен" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6", // светло-серый фон как на макете
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          padding: 28,
        }}
      >
        <h2 style={{ margin: "0 0 18px 0", fontSize: 22, fontWeight: 600 }}>
          Вход в аккаунт
        </h2>

        {errors.general && (
          <div
            role="alert"
            style={{
              background: "#fde8e8",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: 10,
              marginBottom: 14,
            }}
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Логин / email */}
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Ваш логин</label>
            <input
              type="text"
              placeholder="Логин или email"
              value={identity}
              onChange={(e) => {
                setIdentity(e.target.value);
                if (errors.identity) setErrors((x) => ({ ...x, identity: undefined }));
              }}
              aria-invalid={!!errors.identity}
              aria-describedby={errors.identity ? "err-identity" : undefined}
              style={{
                width: "100%",
                height: 40,
                borderRadius: 6,
                border: `1px solid ${errors.identity ? "#fca5a5" : "#d1d5db"}`,
                padding: "0 12px",
                outline: "none",
              }}
            />
            {errors.identity && (
              <div id="err-identity" style={{ color: "#b91c1c", fontSize: 13, marginTop: 6 }}>
                {errors.identity}
              </div>
            )}
          </div>

          {/* Пароль */}
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Пароль</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Пароль"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
                }}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "err-password" : undefined}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 6,
                  border: `1px solid ${errors.password ? "#fca5a5" : "#d1d5db"}`,
                  padding: "0 12px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                style={{
                  minWidth: 90,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                }}
              >
                {showPwd ? "Скрыть" : "Показать"}
              </button>
            </div>
            {errors.password && (
              <div id="err-password" style={{ color: "#b91c1c", fontSize: 13, marginTop: 6 }}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Кнопка Войти */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              height: 46,
              borderRadius: 6,
              border: "none",
              background: canSubmit ? "#2563eb" : "#cfcfcf", // серый как на макете при disabled
              color: "#fff",
              fontSize: 16,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            aria-busy={loading}
          >
            {loading ? "Входим…" : "Войти"}
          </button>

          {/* Ссылки */}
          <div style={{ marginTop: 12, fontSize: 14, textAlign: "center" }}>
            <Link to="/forgot-password" style={{ color: "blue", textDecoration: "underline" }}>
              Забыли пароль?
            </Link>
          </div>

          <div style={{ textAlign: "center", fontSize: 14 }}>
            Нет аккаунта?{" "}
            <Link to="/register" style={{ color: "blue", textDecoration: "underline" }}>
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
