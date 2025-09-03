import { useMemo, useState } from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

const CITIES = ["Бишкек"] as const;
const DISTRICTS = ["Октябрьский", "Первомайский", "Свердловский", "Ленинский"] as const;

const MICRO_BY_DISTRICT: Record<(typeof DISTRICTS)[number], string[]> = {
  Октябрьский: ["Солнечный", "12 мкр", "11 мкр", "Асанбай"],
  Первомайский: ["6 мкр", "7 мкр", "5 мкр", "4 мкр"],
  Свердловский: ["3 мкр", "8 мкр", "9 мкр", "10 мкр"],
  Ленинский: ["Улан", "Улан-2", "Кок-Жар", "Юг-2", "Восток-5", "Учкун"],
};

type Props = {
  value: ListingDraft;
  onChange: (next: Partial<ListingDraft>) => void;
};

type PickOpen = null | "city" | "district" | "micro";

export default function StepAddress({ value, onChange }: Props) {
  const [open, setOpen] = useState<PickOpen>(null);

  // доступные микрорайоны зависят от выбранного района
  const microOptions = useMemo(() => {
    if (!value.district || !(value.district in MICRO_BY_DISTRICT)) return [];
    return MICRO_BY_DISTRICT[value.district as keyof typeof MICRO_BY_DISTRICT];
  }, [value.district]);

  // при смене района — сбрасываем микрорайон, если он не входит в доступные
  function pickDistrict(d: string) {
    const next: Partial<ListingDraft> = { district: d };
    if (!MICRO_BY_DISTRICT[d as keyof typeof MICRO_BY_DISTRICT]?.includes(value.microdistrict || "")) {
      next.microdistrict = "";
    }
    onChange(next);
    setOpen(null);
  }

  // Город один — можно проставить сразу
  function pickCity(c: string) {
    onChange({ city: c });
    setOpen(null);
  }

  function pickMicro(m: string) {
    onChange({ microdistrict: m });
    setOpen(null);
  }

  return (
    <div className={s.addrWrap}>
      {/* Блок со строками выбора */}
      <div className={s.addrList}>
        {/* Город */}
        <div className={s.addrItem}>
          <div className={s.addrLabel}>Город</div>
          <button
            type="button"
            className={s.pickLink}
            onClick={() => setOpen(open === "city" ? null : "city")}
          >
            {value.city || "выбрать город"} <span className={s.chev}>›</span>
          </button>

          {open === "city" && (
            <div className={s.menu} role="menu">
              {CITIES.map((c) => (
                <button key={c} type="button" className={s.menuItem} onClick={() => pickCity(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Район */}
        <div className={s.addrItem}>
          <div className={s.addrLabel}>Район</div>
          <button
            type="button"
            className={s.pickLink}
            onClick={() => setOpen(open === "district" ? null : "district")}
          >
            {value.district || "выбрать район"} <span className={s.chev}>›</span>
          </button>

          {open === "district" && (
            <div className={s.menu} role="menu">
              {DISTRICTS.map((d) => (
                <button key={d} type="button" className={s.menuItem} onClick={() => pickDistrict(d)}>
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Микрорайон */}
        <div className={s.addrItem}>
          <div className={s.addrLabel}>Микрорайон</div>
          <button
            type="button"
            className={s.pickLink}
            onClick={() => microOptions.length && setOpen(open === "micro" ? null : "micro")}
            disabled={!value.district}
          >
            {value.microdistrict || (value.district ? "выбрать мкрн." : "сначала выберите район")}{" "}
            <span className={s.chev}>›</span>
          </button>

          {open === "micro" && (
            <div className={s.menu} role="menu">
              {microOptions.map((m) => (
                <button key={m} type="button" className={s.menuItem} onClick={() => pickMicro(m)}>
                  {m}
                </button>
              ))}
              {!microOptions.length && (
                <div className={s.menuEmpty}>Нет вариантов — выберите район</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Поля улицы/дома и чекбокс — как в макете ниже списка */}
      <div className={s.formRow}>
        <label className={s.label}>Улица</label>
        <input
          className={s.input}
          placeholder="Например, Айни"
          value={value.street || ""}
          onChange={(e) => onChange({ street: e.target.value })}
        />
      </div>

      <div className={s.twoCols}>
        <div className={s.formRow}>
          <label className={s.label}>Дом</label>
          <input
            className={s.input}
            placeholder="№"
            value={value.house || ""}
            onChange={(e) => onChange({ house: e.target.value })}
          />
        </div>
      </div>

      <label className={s.checkboxRow} style={{ marginTop: 8 }}>
        <input
          type="checkbox"
          checked={Boolean(value.hideHouse)}
          onChange={(e) => onChange({ hideHouse: e.target.checked })}
        />
        <span>Скрыть номер дома</span>
      </label>
    </div>
  );
}
