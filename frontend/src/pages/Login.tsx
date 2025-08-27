import { useState } from "react";
import { login } from "../lib/api";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const nav = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || "/"; // если нет "from", уйдём на "/"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
        const data = await login(email, password);
        localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);

        nav(from, { replace: true });
    } catch (err) {
        setMessage("Ошибка входа ❌");
    }
    }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <h2>Логин</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br/><br/>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br /><br />
        <button type="submit">Войти</button>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          Нет аккаунта?{" "}
          <Link to="/register" style={{ color: "blue", textDecoration: "underline" }}>
            Зарегистрироваться
          </Link>
        </div>
      </form>
      <p>{message}</p>
    </div>
  );
}
