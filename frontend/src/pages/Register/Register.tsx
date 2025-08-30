import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

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
    const text = await res.text();
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

    // успех регистрации → сразу логинимся
    const loginRes = await fetch(`${base}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
      }),
    });

    if (!loginRes.ok) {
      setErrors({ general: "Аккаунт создан, но вход не выполнен. Попробуйте войти вручную." });
      return;
    }

    const tokens = await loginRes.json();
    localStorage.setItem("access", tokens.access);
    localStorage.setItem("refresh", tokens.refresh);

    nav("/dashboard", { replace: true });

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
    <div className={styles.container}>
    <div className={styles.card}>
      <h2 className={`${styles.title} ${styles.title_login}`}>
        Создать аккаунт
      </h2>
      <p className={styles.subtitle}>
        Зарегистрируйтесь как риелтор, чтобы публиковать объекты
      </p>

      {errors.general && (
        <div role="alert" className={styles.alert}>
          {errors.general}
        </div>
      )}

      <form onSubmit={onSubmit} className={styles.form}>
        {/* Имя / компания */}
        <div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Например, Иван Петров"
            required
            className={errors.name ? styles.inputError : styles.input}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "error-name" : undefined}
          />
          {errors.name && (
            <div id="error-name" className={styles.errorText}>
              {errors.name}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="you@example.com"
            required
            className={errors.email ? styles.inputError : styles.input}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "error-email" : undefined}
          />
          {errors.email && (
            <div id="error-email" className={styles.errorText}>
              {errors.email}
            </div>
          )}
        </div>

        {/* Пароль + глаз */}
        <div>
          <div className={styles.passwordWrap}>
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              className={`${errors.password ? styles.inputError : styles.input} ${styles.hasToggle}`}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "error-password" : "hint-password"
              }
              placeholder="Пароль"
            />

            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className={styles.toggle}
              aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showPwd}
            >
              {showPwd ? (
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94" />
                  <path d="M1 1l22 22" />
                  <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                </svg>
              )}
            </button>
          </div>

          {/* Индикатор силы пароля */}
          <div className={styles.strengthWrap}>
            <div className={styles.strengthTrack}>
              <div
                className={styles.strengthFill}
                style={{ width: strengthWidth, background: strengthBg }}
              />
            </div>
            <div id="hint-password" className={styles.hint}>
              Надёжность: {strengthLabel}
            </div>

            <ul className={styles.checklist}>
              <li
                className={
                  form.password.length >= 6 ? styles.good : styles.bad
                }
              >
                Длина не менее 6 символов
              </li>
              <li
                className={
                  !isNumericOnly(form.password) ? styles.good : styles.bad
                }
              >
                Не только цифры
              </li>
              {errors.passwordCommon && (
                <li className={styles.bad}>
                  Слишком распространённый пароль — выберите другой
                </li>
              )}
            </ul>
          </div>

          {errors.password && (
            <div id="error-password" className={styles.errorText}>
              {errors.password}
            </div>
          )}
        </div>

        {/* Согласие */}
        <label className={styles.checkboxRow} htmlFor="agree">
          <input
            id="agree"
            type="checkbox"
            checked={form.agree}
            onChange={(e) => setField("agree", e.target.checked)}
          />
          <span className={styles.acceptance}>Соглашаюсь с условиями сервиса</span>
        </label>
        {errors.agree && (
          <div id="error-agree" className={styles.errorText}>
            {errors.agree}
          </div>
        )}
        
        {/* Кнопка */}
        <button
          type="submit"
          disabled={loading}
          className={loading ? styles.buttonDisabled : styles.button}
          aria-busy={loading}
        >
          {loading ? "Создаю…" : "Зарегистрироваться"}
        </button>

        <div className={styles.centerRow}>
          Уже есть аккаунт?{" "}
          <Link to="/login" className={styles.link}>
            Войти
          </Link>
        </div>
      </form>
    </div>
  </div>
  );
}
