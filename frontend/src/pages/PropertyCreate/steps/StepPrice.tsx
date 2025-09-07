import type { Dispatch, SetStateAction } from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

const digits = (v: string) => v.replace(/\D+/g, "");

type Props = {
  value: ListingDraft;
  onChange: Dispatch<SetStateAction<ListingDraft>>;
};

export default function StepPrice({ value, onChange }: Props) {
  const isSale = value.deal === "sale";

  return (
    <form className={s.form} onSubmit={(e) => e.preventDefault()}>

      {isSale ? (
        <div className={s.formItem}>
          <input
            className={s.input}
            inputMode="numeric"
            placeholder="Например, 125000"
            value={value.price || ""}
            onChange={(e) => onChange((d) => ({ ...d, price: digits(e.target.value) }))}
          />
        </div>
      ) : (
        <>
          <div className={s.formItem}>
            <label className={s.labelRow}>Цена аренды</label>
            <input
              className={s.input}
              inputMode="numeric"
              placeholder="Например, 25000"
              value={value.rent_price || ""}
              onChange={(e) => onChange((d) => ({ ...d, rent_price: digits(e.target.value) }))}
            />
          </div>

          <div className={s.formItem}>
            <label className={s.labelRow}>Период</label>
            <div className={s.pills}>
              {(["day", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${s.pill} ${value.period === p ? s.pillActive : ""}`}
                  onClick={() => onChange((d) => ({ ...d, period: p }))}
                >
                  {p === "day" ? "Посуточно" : "В месяц"}
                </button>
              ))}
            </div>
          </div>

          <div className={s.twoColsRow}>
            <div className={s.formItem}>
              <label className={s.labelRow}>Залог</label>
              <input
                className={s.input}
                inputMode="numeric"
                placeholder="0"
                value={value.deposit || ""}
                onChange={(e) => onChange((d) => ({ ...d, deposit: digits(e.target.value) }))}
              />
            </div>
            <div className={s.formItem}>
              <label className={s.labelRow}>Предоплата (мес.)</label>
              <input
                className={s.input}
                inputMode="numeric"
                placeholder="0"
                value={value.prepay || ""}
                onChange={(e) => onChange((d) => ({ ...d, prepay: digits(e.target.value) }))}
              />
            </div>
          </div>

          <label className={s.checkLine}>
            <span>Коммунальные включены</span>
            <input
              type="checkbox"
              checked={Boolean(value.utilities_included)}
              onChange={(e) => onChange((d) => ({ ...d, utilities_included: e.target.checked }))}
              style={{ cursor: "pointer" }}
            />
          </label>
              
          <div className={s.formItem}>
            <label className={s.labelRow}>Комиссия</label>
            <input
              className={s.input}
              inputMode="numeric"
              placeholder="% или сумма"
              value={value.commission || ""}
              onChange={(e) => onChange((d) => ({ ...d, commission: digits(e.target.value) }))}
            />
          </div>
        </>
      )}
    </form>
  );
}
