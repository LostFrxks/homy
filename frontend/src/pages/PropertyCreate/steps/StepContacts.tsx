import type { Dispatch, SetStateAction } from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

type Props = {
  value: ListingDraft;
  onChange: Dispatch<SetStateAction<ListingDraft>>;
};

const onlyDigits = (v: string) => v.replace(/[^\d+]/g, "");

export default function StepContacts({ value, onChange }: Props) {
  return (
    <form className={s.form} onSubmit={(e) => e.preventDefault()}>

      <div className={s.formRow}>
        <label className={s.label}>Номер телефона</label>
        <input
          className={s.input}
          placeholder="+996"
          inputMode="tel"
          value={value.phone || ""}
          onChange={(e) => onChange((d) => ({ ...d, phone: onlyDigits(e.target.value) }))}
        />
      </div>

      <div className={s.formRow}>
        <label className={s.label}>Имя в личных сообщениях</label>
        <input
          className={s.input}
          placeholder="Как к вам обращаться?"
          value={value.name || ""}
          onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
        />
      </div>

      <label className={s.switchRow}>
        <input
          type="checkbox"
          checked={Boolean(value.owner)}
          onChange={(e) => onChange((d) => ({ ...d, owner: e.target.checked }))}
        />
        <span>Я хозяин недвижимости</span>
      </label>

      <p className={s.note}>
        Нажимая «Разместить объявление», вы соглашаетесь с правилами размещения.
      </p>
    </form>
  );
}
