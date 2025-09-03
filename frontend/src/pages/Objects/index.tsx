import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./Objects.module.css";
import FiltersBar, { type Filters } from "./Filters";

type Preset = "duty" | "my" | "drafts";

/** категории верхнего блока */
type Category = "" | "sale" | "rent" | "newbuild" | "land";

type Property = {
  id: number | string;
  title: string;
  address?: string;
  price?: number;
  cover_url?: string | null;
  author?: string;
};

type ListResponse = {
  results: Property[];
  next?: string | null;
};

const TITLE: Record<Preset, string> = {
  duty: "Дежурка",
  my: "Мои проекты",
  drafts: "Без рекламы",
};

function mergeById(prev: Property[], next: Property[]) {
  const seen = new Set(prev.map((i) => String(i.id)));
  const merged = [...prev];
  for (const it of next) {
    const id = String(it.id);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(it);
    }
  }
  return merged;
}

export default function ObjectsPage() {
  const { preset: raw } = useParams();
  const nav = useNavigate();
  const { search } = useLocation();

  // нормализуем preset
  const preset: Preset = useMemo(() => {
    return raw === "my" || raw === "drafts" ? raw : "duty";
  }, [raw]);

  // выбранная категория из query (?cat=...)
  const initialCat: Category = useMemo(() => {
    const sp = new URLSearchParams(search);
    const c = sp.get("cat") as Category | null;
    return c ?? "";
  }, [search]);

  const [cat, setCat] = useState<Category>(initialCat);

  // состояние ленты
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // фильтры из панели
  const [filters, setFilters] = useState<Filters | null>(null);

  // при смене режима/фильтров/категории — сброс ленты и загрузка с 1 страницы
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [preset, filters, cat]);

  // загрузка данных
  useEffect(() => {
    void loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, page, filters, cat]);

  async function loadPage(p: number) {
    if (!hasMore || loading) return;
    try {
      setLoading(true);
      setError(null);

      const base = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
      const qs = new URLSearchParams({ page: String(p) });

      // фиксируем статус публикации по пресету
      if (preset === "duty") qs.set("published", "1");
      if (preset === "my") qs.set("mine", "1");
      if (preset === "drafts") qs.set("published", "0");

      // категория из верхнего блока
      if (cat === "sale" || cat === "rent") qs.set("deal_type", cat);
      if (cat === "newbuild") qs.set("category", "newbuild");
      if (cat === "land") qs.set("category", "land");

      // прочие фильтры
      if (filters) {
        if (filters.q) qs.set("q", filters.q);
        if (filters.mine && preset !== "my") qs.set("mine", "1");
        if (!(preset === "duty" || preset === "drafts")) {
          if (filters.published) qs.set("published", filters.published);
        }
        if (filters.price_min) qs.set("price_min", filters.price_min);
        if (filters.price_max) qs.set("price_max", filters.price_max);
        if (filters.rooms) qs.set("rooms", filters.rooms);
      }

      const res = await fetch(`${base}/properties/?${qs.toString()}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access") || ""}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Ошибка загрузки");
      }

      const data: ListResponse = await res.json();
      setItems((prev) => mergeById(prev, data.results || []));
      setHasMore(Boolean(data.next));
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const onAddObject = () => nav("/properties/new");

  // клик по «Купить/Аренда/Новостройки/Участки»
  function selectCat(next: Category) {
    setCat(next);
    const sp = new URLSearchParams(window.location.search);
    if (next) sp.set("cat", next);
    else sp.delete("cat");
    nav({ search: `?${sp.toString()}` }, { replace: true });
  }

  return (
    <div className={styles.container}>
      {/* Заголовок + действия */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{TITLE[preset]}</h1>
        <div className={styles.headerActions}>
          {preset !== "drafts" && (
            <button className={styles.primary} onClick={onAddObject}>
              Добавить объект
            </button>
          )}
        </div>
      </div>

      {/* Карточка: поиск + категории (кликабельные) */}
      <div className={styles.catalogCard}>
        <div className={styles.search}>
          <span className={styles.searchIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input className={styles.searchInput} placeholder="Например, купить дом" />
        </div>

        <ul className={styles.cats}>
          <li
            className={`${styles.catRow} ${cat === "sale" ? styles.catRowActive : ""}`}
            onClick={() => selectCat("sale")}
          >
            <span className={styles.catLeft}>
              <span className={styles.catIcon}>🏠</span>
              <span className={styles.catLink}>Купить</span>
            </span>
            <span className={styles.catCount}>1213+</span>
          </li>

          <li
            className={`${styles.catRow} ${cat === "rent" ? styles.catRowActive : ""}`}
            onClick={() => selectCat("rent")}
          >
            <span className={styles.catLeft}>
              <span className={styles.catIcon}>🔑</span>
              <span className={styles.catLink}>Аренда</span>
            </span>
            <span className={styles.catCount}>1213+</span>
          </li>

          <li
            className={`${styles.catRow} ${cat === "newbuild" ? styles.catRowActive : ""}`}
            onClick={() => selectCat("newbuild")}
          >
            <span className={styles.catLeft}>
              <span className={styles.catIcon}>🏗️</span>
              <span className={styles.catLink}>Новостройки</span>
            </span>
            <span className={styles.catCount}>1213+</span>
          </li>

          <li
            className={`${styles.catRow} ${cat === "land" ? styles.catRowActive : ""}`}
            onClick={() => selectCat("land")}
          >
            <span className={styles.catLeft}>
              <span className={styles.catIcon}>🏞️</span>
              <span className={styles.catLink}>Участки</span>
            </span>
            <span className={styles.catCount}>1213+</span>
          </li>
        </ul>
      </div>

      {/* Шапка «Наши объявления / город» */}
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle2}>Наши объявления</h3>
        <a className={styles.sectionCity} href="#">Бишкек</a>
      </div>

      {/* Панель фильтров (оставляем как есть) */}
      <FiltersBar preset={preset} onApply={setFilters} />

      {/* Пусто/ошибка */}
      {items.length === 0 && !loading && !error && (
        <div className={styles.empty}>Пока ничего нет</div>
      )}
      {error && <div className={styles.error}>{error}</div>}

      {/* Сетка карточек */}
      <div className={styles.grid}>
        {items.map((it) => (
          <article key={it.id} className={styles.card}>
            <div className={styles.thumb}>
              {it.cover_url ? <img src={it.cover_url} alt="" /> : <div className={styles.thumbStub} />}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{it.title || "Объект"}</div>
              <div className={styles.cardMeta}>
                {it.address && <span>{it.address}</span>}
                {it.price != null && <span>{Intl.NumberFormat("ru-RU").format(it.price)} ₽</span>}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Пагинация */}
      <div className={styles.pager}>
        <button
          className={hasMore && !loading ? styles.secondary : styles.disabled}
          disabled={!hasMore || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          {loading ? (
            <span className={styles.btnContent}>
              <span className={styles.spinner} aria-hidden />
              Загружаем…
            </span>
          ) : hasMore ? (
            "Показать ещё"
          ) : (
            "Больше нет"
          )}
        </button>
      </div>
    </div>
  );
}
