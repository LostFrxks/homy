import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Objects.module.css";
import FiltersBar, { type Filters } from "./Filters";

type Preset = "duty" | "my" | "drafts";

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

  // нормализуем preset
  const preset: Preset = useMemo(() => {
    return raw === "my" || raw === "drafts" ? raw : "duty";
  }, [raw]);

  // состояние ленты
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // фильтры из панели
  const [filters, setFilters] = useState<Filters | null>(null);

  // при смене режима/фильтров — сброс ленты и загрузка с 1 страницы
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [preset, filters]);

  // подгружаем данные при смене preset/page/filters
  useEffect(() => {
    void loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, page, filters]);

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

      // применяем фильтры
      if (filters) {
        if (filters.q) qs.set("q", filters.q);
        if (filters.mine && preset !== "my") qs.set("mine", "1");
        // если пресет уже зафиксировал published — не переопределяем
        if (!((preset === "duty" || preset === "drafts") && filters.published)) {
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

      {/* Панель фильтров */}
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
              {it.cover_url ? (
                <img src={it.cover_url} alt="" />
              ) : (
                <div className={styles.thumbStub} />
              )}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{it.title || "Объект"}</div>
              <div className={styles.cardMeta}>
                {it.address && <span>{it.address}</span>}
                {it.price != null && (
                  <span>{Intl.NumberFormat("ru-RU").format(it.price)} ₽</span>
                )}
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
