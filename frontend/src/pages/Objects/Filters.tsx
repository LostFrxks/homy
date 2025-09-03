import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./Objects.module.css";

export type Filters = {
  q: string;
  mine: boolean;
  published: "1" | "0" | ""; // "" = любой
  price_min: string;
  price_max: string;
  rooms: string; // "1","2","3","4+",""
};

type Props = {
  preset: "duty" | "my" | "drafts";
  onApply: (f: Filters) => void;
};

export default function FiltersBar({ preset, onApply }: Props) {
  const [sp, setSp] = useSearchParams();

  const initial: Filters = useMemo(
    () => ({
      q: sp.get("q") || "",
      mine: sp.get("mine") === "1" || preset === "my",
      published:
        preset === "duty"
          ? "1"
          : preset === "drafts"
          ? "0"
          : (sp.get("published") === "1" || sp.get("published") === "0"
              ? (sp.get("published") as "1" | "0")
              : ""),
      price_min: sp.get("price_min") || "",
      price_max: sp.get("price_max") || "",
      rooms: sp.get("rooms") || "",
    }),
    [sp, preset]
  );

  const [f, setF] = useState<Filters>(initial);

  // при смене пресета — подтягиваем дефолты
  useEffect(() => {
    setF(initial);
  }, [initial]);

  const canToggleMine = preset !== "my";
  const canChangePublished = preset !== "duty" && preset !== "drafts";

  function apply() {
    const next = new URLSearchParams();
    if (f.q) next.set("q", f.q);
    if (canToggleMine && f.mine) next.set("mine", "1");
    if (canChangePublished && f.published) next.set("published", f.published);
    if (f.price_min) next.set("price_min", f.price_min);
    if (f.price_max) next.set("price_max", f.price_max);
    if (f.rooms) next.set("rooms", f.rooms);

    setSp(next, { replace: true });
    onApply({
      ...f,
      mine: canToggleMine ? f.mine : preset === "my",
      published: canChangePublished
        ? f.published
        : preset === "duty"
        ? "1"
        : preset === "drafts"
        ? "0"
        : "",
    });
  }

  function clearAll() {
    setF({
      q: "",
      mine: preset === "my",
      published: preset === "duty" ? "1" : preset === "drafts" ? "0" : "",
      price_min: "",
      price_max: "",
      rooms: "",
    });
    setSp(new URLSearchParams(), { replace: true });
    onApply({
      q: "",
      mine: preset === "my",
      published: preset === "duty" ? "1" : preset === "drafts" ? "0" : "",
      price_min: "",
      price_max: "",
      rooms: "",
    });
  }

  return (
    <div className={styles.filters}>
      <input
        className={styles.input}
        placeholder="Поиск по названию/адресу"
        value={f.q}
        onChange={(e) => setF((x) => ({ ...x, q: e.target.value }))}
      />

      <select
        className={styles.select}
        value={f.rooms}
        onChange={(e) => setF((x) => ({ ...x, rooms: e.target.value }))}
      >
        <option value="">Комнаты</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4+">4+</option>
      </select>

      <input
        className={styles.input}
        inputMode="numeric"
        placeholder="Цена от"
        value={f.price_min}
        onChange={(e) =>
          setF((x) => ({ ...x, price_min: e.target.value.replace(/\D/g, "") }))
        }
      />
      <input
        className={styles.input}
        inputMode="numeric"
        placeholder="Цена до"
        value={f.price_max}
        onChange={(e) =>
          setF((x) => ({ ...x, price_max: e.target.value.replace(/\D/g, "") }))
        }
      />

      <label
        className={styles.checkboxRow}
        title={canToggleMine ? "" : "В этом режиме всегда только мои"}
      >
        <input
          type="checkbox"
          checked={f.mine}
          disabled={!canToggleMine}
          onChange={(e) => setF((x) => ({ ...x, mine: e.target.checked }))}
        />
        <span>Только мои</span>
      </label>

      {canChangePublished && (
        <select
          className={styles.select}
          value={f.published}
          onChange={(e) =>
            setF((x) => ({
              ...x,
              published: e.target.value as "1" | "0" | "",
            }))
          }
        >
          <option value="">Любой статус</option>
          <option value="1">Опубликовано</option>
          <option value="0">Черновики</option>
        </select>
      )}

      <button className={styles.primary} onClick={apply}>
        Применить
      </button>
      <button className={styles.secondary} onClick={clearAll}>
        Сбросить
      </button>
    </div>
  );
}
