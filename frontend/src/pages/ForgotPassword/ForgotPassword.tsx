import React, { useMemo, useState } from "react";
import { requestPasswordCode } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import styles from "./ForgotPassword.module.css";

type FieldErrors = { email?: string; general?: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try { return JSON.stringify(err); } catch { return "Ошибка"; }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();

  const canSubmit = useMemo(
    () => email.trim().length > 0 && !loading,
    [email, loading]
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "Укажите email" });
      return;
    }

    try {
      setLoading(true);
      await requestPasswordCode(email.trim());
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      setErrors({ general: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={`${styles.title} ${styles.title_login}`}>Восстановление пароля</h2>
        <p className={styles.subtitle}>Укажите свою почту — мы отправим код подтверждения</p>

        {errors.general && (
          <div role="alert" className={styles.alert}>
            {errors.general}
          </div>
        )}

        <form onSubmit={submit} className={styles.form}>
          <div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
              className={errors.email ? styles.inputError : styles.input}
            />
            {errors.email && (
              <div id="err-email" className={styles.errorText}>
                {errors.email}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={canSubmit ? styles.button : styles.buttonDisabled}
            aria-busy={loading}
          >
            {loading ? (
              <span className={styles.buttonContent}>
                <span className={styles.spinner} aria-hidden />
                Отправляем…
              </span>
            ) : (
              "Отправить код"
            )}
          </button>

          <div className={styles.centerRow}>
            <Link to="/login" className={styles.link}>
              Вернуться ко входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
