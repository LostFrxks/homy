import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import styles from "./DrawerMenu.module.css";

const MENU = [
  { to: "/objects/duty",    label: "Дежурка",              },
  { to: "/objects/my",      label: "Мои проекты",          },
  { to: "/objects/drafts",  label: "Без рекламы",          },

  { to: "/showings",        label: "Показы",               }, // <-- тут правка

  { to: "/sales",           label: "Продажи",              },
  { to: "/profile",         label: "Профиль",              },
  { to: "/favorites",       label: "Избранное",            },
  { to: "/saved-searches",  label: "Сохранённые поиски",   },
  { to: "/support",         label: "Поддержка",            },
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
        <nav className={styles.menu}>
          <button className={styles.close} onClick={onClose} aria-label="Закрыть">✕</button>

          <div className={styles.title}>Риелтор</div>

          {MENU.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? `${styles.item} ${styles.active}` : styles.item
              }
            >
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
