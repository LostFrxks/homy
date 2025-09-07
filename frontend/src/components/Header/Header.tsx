import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import DrawerMenu from "../DrawerMenu/DrawerMenu";
import styles from "./Header.module.css";

export default function Header() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    nav("/login", { replace: true });
  }

  return (
    <header className={styles.header}>
      {/* бургер */}
      <button
        className={styles.burger}
        aria-label="Открыть меню"
        onClick={() => setOpen(true)}
      >
        <div className={styles.burgerLines} />
          <span /><span /><span />
      </button>

      {/* логотип */}
      <button className={styles.logo} onClick={() => nav("/showings")}>
        Homy
      </button>

      {/* actions справа */}
      <nav className={styles.right}>
        <NavLink to="/favorites" className={styles.iconBtn} aria-label="Избранное">
          <img src="/heart.png" alt="Избранное" className={styles.iconImg} />
        </NavLink>

        <NavLink to="/profile" className={styles.avatar} aria-label="Профиль" />

        <button className={styles.logout} onClick={logout}>
          Выйти
        </button>
      </nav>

      {/* выдвижное меню */}
      <DrawerMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
