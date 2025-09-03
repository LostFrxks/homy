import type { Dispatch, SetStateAction } from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

type Props = {
  value: ListingDraft;
  onChange: Dispatch<SetStateAction<ListingDraft>>;
};

export default function StepDescription({ value, onChange }: Props) {
  const max = 2000;
  const len = value.description?.length || 0;

  return (
    <form className={s.form} onSubmit={(e) => e.preventDefault()}>

      <div className={s.formRow}>
        <textarea
          className={s.textarea}
          placeholder={"• Подробнее про ремонт\n• Состояние построек\n• Инфраструктура поблизости"}
          value={value.description || ""}
          maxLength={max}
          onChange={(e) => onChange((d) => ({ ...d, description: e.target.value }))}
        />
        <div className={s.hint}>{len}/{max}</div>
      </div>
    </form>
  );
}
