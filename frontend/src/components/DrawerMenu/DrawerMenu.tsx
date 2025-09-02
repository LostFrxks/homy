import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import styles from "./DrawerMenu.module.css";

const MENU = [
  { to: "/objects/duty",    label: "Дежурка",              emoji: "🏠" },
  { to: "/objects/my",      label: "Мои проекты",          emoji: "🗂️" },
  { to: "/objects/drafts",  label: "Без рекламы",          emoji: "📰" },

  { to: "/showings",        label: "Показы",               emoji: "📅" }, // <-- тут правка

  { to: "/sales",           label: "Продажи",              emoji: "💼" },
  { to: "/profile",         label: "Профиль",              emoji: "👤" },
  { to: "/favorites",       label: "Избранное",            emoji: "❤️" },
  { to: "/saved-searches",  label: "Сохранённые поиски",   emoji: "🔎" },
  { to: "/support",         label: "Поддержка",            emoji: "🛟" },
];


type Props = { open: boolean; onClose: () => void };

export default function DrawerMenu({ open, onClose }: Props) {
  // Esc + блокируем скролл body пока меню открыто
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      {/* затемнение */}
      <div
        className={`${styles.backdrop} ${open ? styles.show : ""}`}
        onClick={onClose}
      />
      {/* выдвижка */}
      <aside className={`${styles.drawer} ${open ? styles.open : ""}`} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <button className={styles.close} onClick={onClose} aria-label="Закрыть">✕</button>
          <div className={styles.title}>Риелтор</div>
        </div>

        <nav className={styles.menu}>
          {MENU.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? `${styles.item} ${styles.active}` : styles.item
              }
            >
              <span className={styles.emoji}>{i.emoji}</span>
              <span>{i.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.support}>
          <div className={styles.supportTitle}>Служба поддержки</div>
          <div className={styles.supportPhone}>+0 000 000000</div>
        </div>
      </aside>
    </>
  );
}
