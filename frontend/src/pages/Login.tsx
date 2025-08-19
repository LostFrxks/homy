import { useState } from "react";
import { login } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
        const data = await login(email, password);
        localStorage.setItem("access", data.access);

        window.location.href = "/";
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
      </form>
      <p>{message}</p>
    </div>
  );
}
