import s from "../Wizard.module.css";

export type DealType = "sale" | "rent";
export type ObjectType =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "business"
  | "parking";

type Props = {
  value: { deal: DealType | null; kind: ObjectType | null };
  onChange: (next: Partial<Props["value"]>) => void;
  onNext?: () => void;
};

const DEALS = [
  { key: "sale" as const, label: "Продать" },
  { key: "rent" as const, label: "Аренда" },
];

const KINDS = [
  { key: "apartment" as const, label: "Квартира" },
  { key: "house" as const, label: "Дом или дача" },
  { key: "land" as const, label: "Участок" },
  { key: "commercial" as const, label: "Коммерческая недвижимость" },
  { key: "business" as const, label: "Бизнес" },
  { key: "parking" as const, label: "Гараж или паркинг" },
];

export default function StepSelectType({ value, onChange }: Props) {
  return (
    <>
      {/* Секция 1: Новое объявление */}
      <section className={s.section} aria-labelledby="deal-head">
        <div id="deal-head" className={s.groupHead}>Новое объявление</div>
        <div className={s.pills}>
          {DEALS.map(d => (
            <button
              key={d.key}
              type="button"
              className={`${s.pill} ${value.deal === d.key ? s.pillActive : ""}`}
              onClick={() => onChange({ deal: d.key })}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* Серый разделитель как в макете */}
      <div className={s.hr} />

      {/* Секция 2: Недвижимость */}
      <section className={s.section} aria-labelledby="kind-head">
        <div id="kind-head" className={s.groupHead}>Недвижимость</div>
        <div className={s.pills}>
          {KINDS.map(k => (
            <button
              key={k.key}
              type="button"
              className={`${s.pill} ${value.kind === k.key ? s.pillActive : ""}`}
              onClick={() => onChange({ kind: k.key })}
            >
              {k.label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
