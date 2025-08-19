import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export default function Protected({ children }: { children: ReactNode }) {
  const has = !!localStorage.getItem("access");
  return has ? <>{children}</> : <Navigate to="/login" replace />;
}
