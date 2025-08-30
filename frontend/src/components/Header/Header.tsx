import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem("access");
    nav("/login");
  }

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderBottom: "1px solid #eee", marginBottom: 16
    }}>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>🏠 Главная</Link>
        <Link to="/properties" style={{ textDecoration: "none" }}>📋 Объекты</Link>
      </nav>

      <button onClick={logout} style={{ padding: "6px 10px" }}>
        Выйти
      </button>
    </header>
  );
}
