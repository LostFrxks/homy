import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import styles from "./Login.module.css";

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
            <div className={styles.row}>
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
                className={errors.password ? styles.inputErrorFlex : styles.inputFlex}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className={styles.showBtn}
              >
                {showPwd ? "Скрыть" : "Показать"}
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
            {loading ? "Входим…" : "Войти"}
          </button>

          {/* Ссылки */}
          <div className={styles.centerRow}>
            <Link to="/forgot-password" className={styles.link}>
              Забыли пароль?
            </Link>
          </div>

          <div className={styles.centerRow}>
            Нет аккаунта?{" "}
            <Link to="/register" className={styles.link}>
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}