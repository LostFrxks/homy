import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

type Props = {
  value: ListingDraft;
  onChange: (next: Partial<ListingDraft>) => void;
};

export default function StepContacts({ value, onChange }: Props) {
  return (
    <div className={s.form}>
      {/* Телефон */}
      <div className={s.formRow}>
        <label className={s.label}>Номер телефона</label>
        <input
          className={s.input}
          placeholder="+996"
          value={value.phone || ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          inputMode="tel"
        />
      </div>

      {/* Имя */}
      <div className={s.formRow}>
        <label className={s.label}>Имя в личных сообщениях</label>
        <input
          className={s.input}
          placeholder="Как к вам обращаться?"
          value={value.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      {/* Блок “Я хозяин недвижимости” (чекбокс справа) */}
      <div className={s.ownerBlock}>
        <label className={s.ownerRow}>
          <span className={s.ownerText}>
            <span className={s.ownerTitle}>Я хозяин недвижимости</span>
            <span className={s.ownerSub}>Для собственников недвижимости</span>
          </span>

          <input
            type="checkbox"
            className={s.ownerCheck}
            checked={Boolean(value.owner)}
            onChange={(e) => onChange({ owner: e.target.checked })}
          />
        </label>

        <p className={s.note} style={{ marginTop: 12 }}>
          Нажимая на кнопку «Разместить объявление», вы соглашаетесь с{" "}
          <a href="#" className={s.link}>правилами размещения объявлений</a>.
        </p>
      </div>
    </div>
  );
}
