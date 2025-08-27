import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Добро пожаловать 👋</h2>
      <p>Это защищённая страница (Dashboard).</p>

      <div style={{ marginTop: 20 }}>
        <Link
          to="/properties"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "blue",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Перейти к объектам
        </Link>
      </div>
    </div>
  );
}
