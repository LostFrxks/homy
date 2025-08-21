import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

function isJwtValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    const expSec = typeof payload?.exp === "number" ? payload.exp : 0;
    const nowSec = Math.floor(Date.now() / 1000);
    return expSec > nowSec; // токен не истёк
  } catch {
    return false; // битый токен
  }
}

export default function Protected({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const token = useMemo(() => localStorage.getItem("access"), []);

  useEffect(() => {
    // если токен битый/протух — сразу вычищаем
    if (!isJwtValid(token)) {
      localStorage.removeItem("access");
    }
    setChecked(true);
  }, [token]);

  if (!checked) return null; // короткая “задержка” на проверку

  const ok = isJwtValid(localStorage.getItem("access"));
  if (!ok) {
    // запомним куда шёл пользователь
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
