import s from "../Wizard.module.css";

export type DealType = "sale" | "rent";
export type ObjectType =
  | "elite"        // Элитка
  | "secondary"    // Вторичная
  | "commercial"   // Коммерческая
  | "house_land"   // Дома и участки
  | "club_house"   // Клубные дома
  | "parking";     // Парковка

// Порядок строго по ТЗ
const TYPES: { value: ObjectType; label: string }[] = [
  { value: "elite",       label: "Элитка" },
  { value: "secondary",   label: "Вторичная" },
  { value: "commercial",  label: "Коммерческая" },
  { value: "house_land",  label: "Дома и участки" },
  { value: "club_house",  label: "Клубные дома" },
  { value: "parking",     label: "Парковка" },
];

type Props = {
  value: { deal: DealType | null; kind: ObjectType | null };
  onChange: (next: Partial<Props["value"]>) => void;
  onNext?: () => void; // опционально: перейти к следующему шагу после выбора
};

const DEALS = [
  { key: "sale" as const, label: "Продать" },
  { key: "rent" as const, label: "Аренда"  },
];

export default function StepSelectType({ value, onChange, onNext }: Props) {
  const selectDeal = (d: DealType) => {
    onChange({ deal: d });
  };

  const selectKind = (k: ObjectType) => {
    onChange({ kind: k });
    if (onNext) onNext();
  };

  return (
    <>
      {/* Секция 1: Тип сделки */}
      <section className={s.section} aria-labelledby="deal-head">
        <div id="deal-head" className={s.groupHead}>Новое объявление</div>
        <div className={s.pills} role="list">
          {DEALS.map(d => (
            <button
              key={d.key}
              type="button"
              role="listitem"
              className={`${s.pill} ${value.deal === d.key ? s.pillActive : ""}`}
              onClick={() => selectDeal(d.key)}
              aria-pressed={value.deal === d.key}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* Разделитель */}
      <div className={s.hr} />

      {/* Секция 2: Тип недвижимости */}
      <section className={s.section} aria-labelledby="kind-head">
        <div id="kind-head" className={s.groupHead}>Недвижимость</div>
        <div className={s.pills} role="list">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              role="listitem"
              className={`${s.pill} ${value.kind === t.value ? s.pillActive : ""}`}
              onClick={() => selectKind(t.value)}
              aria-pressed={value.kind === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
