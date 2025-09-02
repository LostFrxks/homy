import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPasswordWithCode } from "@/lib/api";
import styles from "./ResetPassword.module.css";

type FieldErrors = {
  code?: string;
  password?: string;
  confirm?: string;
  general?: string;
  passwordCommon?: boolean;
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try { return JSON.stringify(err); } catch { return "Ошибка"; }
}

// utils как в Register
function isNumericOnly(s: string) {
  return !!s && /^\d+$/.test(s);
}
function strength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (!isNumericOnly(password)) score++;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function ResetPassword() {
  const q = useQuery();
  const navigate = useNavigate();

  const email = q.get("email") || "";

  // 6-значный код (как в EmailVerify)
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digitsOnly = (s: string) => s.replace(/\D/g, "");

  const handleChange = (idx: number, v: string) => {
    setErrors((e) => ({ ...e, code: undefined, general: undefined }));
    const d = digitsOnly(v);
    setCode((prev) => {
      const next = [...prev];
      if (d.length <= 1) {
        next[idx] = d;
        if (d && idx < 5) inputsRef.current[idx + 1]?.focus();
      } else {
        for (let i = 0; i < d.length && idx + i < 6; i++) next[idx + i] = d[i];
        const last = Math.min(idx + d.length, 5);
        inputsRef.current[last]?.focus();
      }
      return next;
    });
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      setCode((prev) => {
        const next = [...prev];
        next[idx - 1] = "";
        return next;
      });
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = digitsOnly(e.clipboardData.getData("text"));
    if (!text) return;
    setCode((prev) => {
      const next = [...prev];
      for (let i = 0; i < text.length && idx + i < 6; i++) next[idx + i] = text[i];
      const last = Math.min(idx + text.length - 1, 5);
      inputsRef.current[last]?.focus();
      return next;
    });
  };

  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  // пароль + подтверждение
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const pwdStrength = useMemo(() => strength(pwd), [pwd]);

  // состояния формы
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const allDigits = code.join("");
  const passwordsOk = pwd.length >= 6 && !isNumericOnly(pwd) && pwd === confirm;

  // кнопка и блокировка инпутов
  const isBusy = loading || ok;
  const canSubmit = useMemo(
    () => !!email && allDigits.length === 6 && passwordsOk && !isBusy,
    [email, allDigits.length, passwordsOk, isBusy]
  );

  // успех → сообщение 3с в кнопке + редирект на /login
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 3000);
    return () => clearTimeout(t);
  }, [ok, navigate]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (allDigits.length !== 6) next.code = "Введите 6-значный код";
    if (!pwd) next.password = "Введите новый пароль";
    else if (pwd.length < 6) next.password = "Пароль должен быть не короче 6 символов";
    else if (isNumericOnly(pwd)) next.password = "Пароль не должен состоять только из цифр";
    if (confirm !== pwd) next.confirm = "Пароли не совпадают";

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await resetPasswordWithCode(email, allDigits, pwd);
      setOk(true);
    } catch (err: unknown) {
      setErrors({ general: getErrorMessage(err) });
      // очистим код и поставим курсор в первую ячейку
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  const strengthLabel = ["Очень слабый", "Слабый", "Средний", "Хороший", "Сильный"][pwdStrength] || "Очень слабый";
  const strengthWidth = `${(pwdStrength / 4) * 100}%`;
  const strengthBg = ["#fee2e2", "#fecaca", "#fde68a", "#bbf7d0", "#86efac"][pwdStrength] || "#fee2e2";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={`${styles.title} ${styles.title_login}`}>Сброс пароля</h2>
        <p className={styles.subtitle}>Введите код из письма и задайте новый пароль</p>

        {errors.general && <div className={styles.alert}>{errors.general}</div>}

        <form onSubmit={submit} className={styles.form}>
          {/* Код (6 ячеек) */}
          <div>
            <div className={styles.codeGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  className={styles.codeInput}
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={code[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => handlePaste(i, e)}
                  disabled={isBusy}
                />
              ))}
            </div>
            {errors.code && <div className={styles.errorText}>{errors.code}</div>}
          </div>

          {/* Новый пароль + глаз */}
          <div>
            <div className={styles.passwordWrap}>
              <input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                  setErrors((x) => ({ ...x, password: undefined, passwordCommon: undefined, general: undefined }));
                }}
                className={`${errors.password ? styles.inputError : styles.input} ${styles.hasToggle ? styles.hasToggle : ""}`}
                placeholder="Новый пароль"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "err-password" : "hint-password"}
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className={styles.toggle}
                aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPwd}
                disabled={isBusy}
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

            {/* Индикатор силы пароля (как в Register) */}
            <div className={styles.strengthWrap}>
              <div className={styles.strengthTrack}>
                <div className={styles.strengthFill} style={{ width: strengthWidth, background: strengthBg }} />
              </div>
              <div id="hint-password" className={styles.hint}>Надёжность: {strengthLabel}</div>
              <ul className={styles.checklist}>
                <li className={pwd.length >= 6 ? styles.good : styles.bad}>Длина не менее 6 символов</li>
                <li className={!isNumericOnly(pwd) ? styles.good : styles.bad}>Не только цифры</li>
                {errors.passwordCommon && (
                  <li className={styles.bad}>Слишком распространённый пароль — выберите другой</li>
                )}
              </ul>
            </div>

            {errors.password && <div id="err-password" className={styles.errorText}>{errors.password}</div>}
          </div>

          {/* Подтверждение пароля */}
          <div>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors((x) => ({ ...x, confirm: undefined }));
              }}
              className={errors.confirm ? styles.inputError : styles.input}
              placeholder="Подтвердите пароль"
              aria-invalid={!!errors.confirm}
              disabled={isBusy}
            />
            {errors.confirm && <div className={styles.errorText}>{errors.confirm}</div>}
          </div>

          {/* Кнопка: idle / loading / success */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={canSubmit ? styles.button : styles.buttonDisabled}
            aria-busy={isBusy}
          >
            {loading ? (
              <span className={styles.buttonContent}>
                <span className={styles.spinner} aria-hidden />
                Сохраняем…
              </span>
            ) : ok ? (
              <span className={styles.buttonContent}>
                <span className={styles.spinner} aria-hidden />
                Пароль изменён — переходим ко входу…
              </span>
            ) : (
              "Сохранить новый пароль"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
