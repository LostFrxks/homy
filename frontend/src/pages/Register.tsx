import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  agree?: string;
  general?: string;
  // спец-метка, если бэк вернул "too common"
  passwordCommon?: boolean;
};

function isNumericOnly(s: string) {
  return !!s && /^\d+$/.test(s);
}

function strength(password: string) {
  // очень простой скорер для UX
  let score = 0;
  if (password.length >= 6) score++;
  if (!isNumericOnly(password)) score++;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agree: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPwd, setShowPwd] = useState(false);

  const pwdStrength = useMemo(() => strength(form.password), [form.password]);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    // очищаем ошибку у поля при изменении
    setErrors((e) => ({ ...e, [key]: undefined, general: undefined }));
  }

  // парсим ответы DRF и красиво маппим
  async function parseServerError(res: Response): Promise<FieldErrors> {
    let text = await res.text();
    try {
      const data = JSON.parse(text);
      const fe: FieldErrors = {};
      // типичные ключи от DRF: username/email/password/non_field_errors/detail
      if (data.username) fe.email = String(data.username[0] || data.username); // username=email у нас
      if (data.email) fe.email = String(data.email[0] || data.email);
      if (data.password) {
        const list: string[] = Array.isArray(data.password) ? data.password : [String(data.password)];
        fe.password = list.join(" ");
        // отметка о common password, чтобы подсветить чек-лист
        fe.passwordCommon = list.some((m) => /too common/i.test(m));
      }
      if (data.non_field_errors) fe.general = String(data.non_field_errors[0] || data.non_field_errors);
      if (data.detail) fe.general = String(data.detail);
      // если ничего не распознали — положим сырой текст в general
      if (!fe.email && !fe.password && !fe.general && text) fe.general = text;
      return fe;
    } catch {
      return { general: text || "Ошибка регистрации" };
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) nextErrors.name = "Укажите имя/название";
    if (!form.email.trim()) nextErrors.email = "Укажите email";
    if (!form.password) nextErrors.password = "Введите пароль";
    else if (form.password.length < 6) nextErrors.password = "Пароль должен быть не короче 6 символов";
    else if (isNumericOnly(form.password)) nextErrors.password = "Пароль не должен состоять только из цифр";
    if (!form.agree) nextErrors.agree = "Нужно согласиться с условиями";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({}); // очистим старые

      const base = import.meta.env.VITE_API_URL.replace(/\/+$/, ""); // .../api/v1
      const res = await fetch(`${base}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.email.trim(),      // служебный логин
          email: form.email.trim(),
          password: form.password,
          // "name" (красивое отображение) пока не отправляем — решим позже
        }),
      });

      if (!res.ok) {
        const fe = await parseServerError(res);
        setErrors(fe);
        return;
      }

      // успех
      nav("/login", { replace: true });
    } catch {
      setErrors({ general: "Сеть недоступна или сервер не отвечает" });
    } finally {
      setLoading(false);
    }
  }

  // цвета/ширина «прогресса» для индикатора
  const strengthLabel = ["Очень слабый", "Слабый", "Средний", "Хороший", "Сильный"][pwdStrength] || "Очень слабый";
  const strengthWidth = `${(pwdStrength / 4) * 100}%`;
  const strengthBg = ["#fee2e2", "#fecaca", "#fde68a", "#bbf7d0", "#86efac"][pwdStrength] || "#fee2e2";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 8 }}>Создать аккаунт</h2>
        <p style={{ marginTop: 0, color: "#555" }}>
          Зарегистрируйтесь как риелтор, чтобы публиковать объекты
        </p>

        {errors.general && (
          <div
            role="alert"
            style={{
              background: "#fde8e8",
              color: "#b91c1c",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
              border: "1px solid #fecaca",
            }}
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label>Имя / компания</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Например, Иван Петров"
              required
              style={{ width: "100%" }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "error-name" : undefined}
            />
            {errors.name && (
              <div id="error-name" style={{ color: "#b91c1c", fontSize: 13, marginTop: 4 }}>
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label>Email (будет логином)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: "100%" }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "error-email" : undefined}
            />
            {errors.email && (
              <div id="error-email" style={{ color: "#b91c1c", fontSize: 13, marginTop: 4 }}>
                {errors.email}
              </div>
            )}
          </div>

          <div>
            <label>Пароль</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                required
                style={{ flex: 1 }}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "error-password" : "hint-password"
                }
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                style={{ padding: "6px 10px" }}
              >
                {showPwd ? "Скрыть" : "Показать"}
              </button>
            </div>

            {/* Индикатор силы пароля */}
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 999 }}>
                <div
                  style={{
                    height: 6,
                    width: strengthWidth,
                    background: strengthBg,
                    borderRadius: 999,
                    transition: "width .2s ease",
                  }}
                />
              </div>
              <div id="hint-password" style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                Надёжность: {strengthLabel}
              </div>

              {/* Чек-лист ограничений */}
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#374151" }}>
                <li style={{ color: form.password.length >= 6 ? "#16a34a" : "#b91c1c" }}>
                  Длина не менее 6 символов
                </li>
                <li style={{ color: !isNumericOnly(form.password) ? "#16a34a" : "#b91c1c" }}>
                  Не только цифры
                </li>
                {/* Если сервер вернул "too common", подсветим */}
                {errors.passwordCommon && (
                  <li style={{ color: "#b91c1c" }}>
                    Слишком распространённый пароль — выберите другой
                  </li>
                )}
              </ul>
            </div>

            {errors.password && (
              <div id="error-password" style={{ color: "#b91c1c", fontSize: 13, marginTop: 6 }}>
                {errors.password}
              </div>
            )}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setField("agree", e.target.checked)}
              aria-invalid={!!errors.agree}
              aria-describedby={errors.agree ? "error-agree" : undefined}
            />
            <span>Соглашаюсь с условиями сервиса</span>
          </label>
          {errors.agree && (
            <div id="error-agree" style={{ color: "#b91c1c", fontSize: 13, marginTop: -8 }}>
              {errors.agree}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 16px",
              background: loading ? "#93c5fd" : "blue",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            aria-busy={loading}
          >
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
