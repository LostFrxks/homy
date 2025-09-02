import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./Showings.module.css";
import { createShowing, searchProperties } from "@/lib/api";

type Range = "today" | "upcoming" | "all";

type Showing = {
  id: number | string;
  datetime: string;        // ISO
  property_id?: number | string;
  property_title?: string;
  address?: string;
  client_name?: string;
  client_phone?: string;
  status?: "planned" | "done" | "canceled";
};

type ListResponse = {
  results: Showing[];
  next?: string | null;
};

const RANGE_LABEL: Record<Range, string> = {
  today: "Сегодня",
  upcoming: "Ближайшие",
  all: "Все",
};

export default function ShowingsPage() {
  const [range, setRange] = useState<Range>("today");
  const [items, setItems] = useState<Showing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // модалка создания
  const [openCreate, setOpenCreate] = useState(false);

  // сброс при смене вкладки
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [range]);

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, page]);

  const refreshNow = useCallback(async () => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    await load(1, /*force*/ true);
  }, []);

  async function load(p: number, force = false) {
    if (!force && (loading || !hasMore)) return;
    try {
      setLoading(true);
      setError(null);

      const base = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
      const qs = new URLSearchParams({ page: String(p), range });
      const res = await fetch(`${base}/showings/?${qs.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access") || ""}`,
        },
        credentials: "include",
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

  const title = useMemo(() => RANGE_LABEL[range], [range]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Показы — {title}</h1>

        <div className={styles.headerActions}>
          <button className={styles.primary} onClick={() => setOpenCreate(true)}>
            Назначить показ
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {(["today","upcoming","all"] as Range[]).map((r) => (
          <button
            key={r}
            className={r === range ? styles.tabActive : styles.tab}
            onClick={() => setRange(r)}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {items.length === 0 && !loading && !error && (
        <div className={styles.empty}>Пока ничего нет</div>
      )}

      <ul className={styles.list}>
        {items.map((it) => (
          <li key={String(it.id)} className={styles.item}>
            <div className={styles.when}>
              {new Date(it.datetime).toLocaleString("ru-RU", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </div>
            <div className={styles.info}>
              <div className={styles.titleLine}>
                <span className={styles.obj}>{it.property_title || "Объект"}</span>
                {it.status && <span className={styles.badge}>{statusLabel(it.status)}</span>}
              </div>
              {it.address && <div className={styles.meta}>{it.address}</div>}
              {(it.client_name || it.client_phone) && (
                <div className={styles.meta}>
                  {it.client_name}{it.client_phone ? ` · ${it.client_phone}` : ""}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

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
          ) : hasMore ? "Показать ещё" : "Больше нет"}
        </button>
      </div>

      {openCreate && (
        <CreateShowingModal
          onClose={() => setOpenCreate(false)}
          onCreated={async () => {
            setOpenCreate(false);
            await refreshNow();
          }}
        />
      )}
    </div>
  );
}

function mergeById<T extends { id: string | number }>(prev: T[], next: T[]) {
  const seen = new Set(prev.map((i) => String(i.id)));
  const out = [...prev];
  for (const n of next) {
    const id = String(n.id);
    if (!seen.has(id)) { seen.add(id); out.push(n); }
  }
  return out;
}
function statusLabel(s?: Showing["status"]) {
  if (s === "done") return "прошёл";
  if (s === "canceled") return "отменён";
  return "запланирован";
}

/* ------------------- МОДАЛКА СОЗДАНИЯ ПОКАЗА ------------------- */

type CreateProps = {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

function CreateShowingModal({ onClose, onCreated }: CreateProps) {
  const [propertyQuery, setPropertyQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: number | string; title: string; address?: string }>>([]);
  const [propId, setPropId] = useState<number | string | null>(null);
  const [propTitle, setPropTitle] = useState<string>("");

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // закрытие по ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // подсказки по объектам
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = propertyQuery.trim();
      if (!q) { setSuggestions([]); return; }
      try {
        const items = await searchProperties(q);
        if (!cancelled) setSuggestions(items.slice(0, 8));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyQuery]);

  function pickProperty(it: { id: number | string; title: string; address?: string }) {
    setPropId(it.id);
    setPropTitle(it.title);
    setPropertyQuery(`${it.title}${it.address ? `, ${it.address}` : ""}`);
    setSuggestions([]);
  }

  const canSubmit =
    !!propId &&
    !!date &&
    !!time &&
    !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!canSubmit) return;

    try {
      setLoading(true);
      // комбинируем локальные date+time в ISO
      const local = new Date(`${date}T${time}`);
      const iso = local.toISOString();

      await createShowing({
        property_id: propId,
        datetime: iso,
        client_name: clientName || undefined,
        client_phone: clientPhone || undefined,
        note: note || undefined,
      });

      await onCreated();
    } catch (e: any) {
      setErr(e?.message || "Не удалось создать показ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.modalBackdrop} onClick={onClose} />

      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-showing-title">
        <div className={styles.modalHeader}>
          <h2 id="create-showing-title" className={styles.modalTitle}>Назначить показ</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <form onSubmit={submit} className={styles.modalBody}>
          {/* Объект: поиск с подсказками */}
          <label className={styles.fieldLabel}>Объект</label>
          <div className={styles.field}>
            <input
              className={styles.input}
              placeholder="Название или адрес"
              value={propertyQuery}
              onChange={(e) => {
                setPropertyQuery(e.target.value);
                setPropId(null);
                setPropTitle("");
              }}
            />
            {!!suggestions.length && (
              <div className={styles.suggestBox}>
                {suggestions.map((s) => (
                  <button key={String(s.id)} type="button" className={styles.suggestItem} onClick={() => pickProperty(s)}>
                    <div className={styles.suggestTitle}>{s.title}</div>
                    {s.address && <div className={styles.suggestMeta}>{s.address}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Дата/время */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Дата</label>
              <input type="date" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Время</label>
              <input type="time" className={styles.input} value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Клиент (необязательно) */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Клиент</label>
              <input className={styles.input} placeholder="Имя клиента" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Телефон</label>
              <input className={styles.input} inputMode="tel" placeholder="+7 999 000-00-00" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
            </div>
          </div>

          {/* Комментарий */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Комментарий</label>
            <textarea className={styles.textarea} rows={3} placeholder="Заметки, детали..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {err && <div className={styles.error} style={{ marginTop: 6 }}>{err}</div>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondary} onClick={onClose}>Отмена</button>
            <button type="submit" className={canSubmit ? styles.primary : styles.disabled} disabled={!canSubmit}>
              {loading ? (
                <span className={styles.btnContent}>
                  <span className={styles.spinner} aria-hidden />
                  Сохраняем…
                </span>
              ) : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
