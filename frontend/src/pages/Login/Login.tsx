import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import styles from "./Login.module.css";

type FieldErrors = { identity?: string; password?: string; general?: string };

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/showings";

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
      setErrors({ general: "Неверные учётные данные" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={`${styles.title} ${styles.title_login}`}>Вход в аккаунт</h2>

        {errors.general && (
          <div role="alert" className={styles.alert}>
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmit} className={styles.form}>
          {/* Логин / email */}
          <div>
            <input
              type="text"
              placeholder="Ваш логин"
              value={identity}
              onChange={(e) => {
                setIdentity(e.target.value);
                if (errors.identity) setErrors((x) => ({ ...x, identity: undefined }));
              }}
              aria-invalid={!!errors.identity}
              aria-describedby={errors.identity ? "err-identity" : undefined}
              className={errors.identity ? styles.inputError : styles.input}
            />
            {errors.identity && (
              <div id="err-identity" className={styles.errorText}>
                {errors.identity}
              </div>
            )}
          </div>

          {/* Пароль */}
          <div>
            <div className={styles.passwordWrap}>
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
                className={`${errors.password ? styles.inputError : styles.input} ${styles.hasToggle}`}
              />

              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className={styles.toggle}
                aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPwd}
              >
                {/* иконка-глаз */}
                {showPwd ? (
                  /* открытый глаз */
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  /* закрытый глаз (перечёркнутый) */
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94" />
                    <path d="M1 1l22 22" />
                    <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                  </svg>
                )}
              </button>
            </div>

            {errors.password && (
              <div id="err-password" className={styles.errorText}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Кнопка Войти */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={canSubmit ? styles.button : styles.buttonDisabled}
            aria-busy={loading}
          >
            {loading ? (
              <span className={styles.buttonContent}>
                <span className={styles.spinner} aria-hidden />
                Входим…
              </span>
            ) : (
              "Войти"
            )}
          </button>

          {/* Ссылки */}
          <div className={styles.centerRow}>
            <Link to="/forgot-password" className={styles.link}>
              Забыли пароль?
            </Link>
          </div>

          <div className={styles.centerRow}>
            <Link to="/register" className={styles.link}>
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}