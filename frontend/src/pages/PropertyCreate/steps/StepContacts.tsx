// src/pages/.../steps/StepContacts.tsx
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

type Props = {
  value: ListingDraft;
  onChange: (next: Partial<ListingDraft>) => void;
};

const KG_PREFIX = "+996 ";
const MAX_DIGITS = 9; // после кода страны

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function formatKgPhone(digits: string) {
  const d = onlyDigits(digits).slice(0, MAX_DIGITS); // максимум 9 цифр
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const parts = [p1, p2, p3].filter(Boolean);
  return KG_PREFIX + parts.join(" ");
}

export default function StepContacts({ value, onChange }: Props) {
  // Держим отформатированную строку прямо в draft'е
  const phone = value.phone && value.phone.startsWith("+996")
    ? value.phone
    : KG_PREFIX;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    // Берём всё, что правее префикса, и форматируем
    const rawRight = e.target.value.startsWith(KG_PREFIX)
      ? e.target.value.slice(KG_PREFIX.length)
      : e.target.value;

    const formatted = formatKgPhone(rawRight);
    onChange({ phone: formatted });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const input = e.currentTarget;
    const pos = input.selectionStart ?? 0;

    // Запрещаем удалять/перепрыгивать в префикс
    if (
      (e.key === "Backspace" && pos <= KG_PREFIX.length) ||
      (e.key === "Delete" && (input.selectionStart ?? 0) < KG_PREFIX.length)
    ) {
      e.preventDefault();
      input.setSelectionRange(KG_PREFIX.length, KG_PREFIX.length);
      return;
    }

    // Разрешаем только цифры (кроме управл. клавиш)
    const allowedControl = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End",
    ];
    if (!allowedControl.includes(e.key) && !/^\d$/.test(e.key)) {
      // Разрешаем вводить плюс только если курсор в самом начале (защиты ради)
      if (!(e.key === "+" && pos === 0)) e.preventDefault();
    }

    // Блокируем ввод, если 9 цифр уже набрано
    const currentDigits = onlyDigits(phone.slice(KG_PREFIX.length));
    if (/^\d$/.test(e.key) && currentDigits.length >= MAX_DIGITS) {
      e.preventDefault();
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const formatted = formatKgPhone(pasted);
    onChange({ phone: formatted });
  };

  return (
    <div className={s.form}>
      {/* Телефон */}
      <div className={s.formRow}>
        <label className={s.labelRow}>Номер телефона</label>
        <input
          className={s.input}
          value={phone}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          inputMode="tel"
          // атрибуты валидации для мобильных клавиатур/браузеров
          pattern="\+996\s\d{3}\s\d{3}\s\d{3}"
          aria-label="Телефон в формате +996 501 234 567"
        />
      </div>

      {/* Имя */}
      <div className={s.formRow}>
        <label className={s.labelRow}>Имя в личных сообщениях</label>
        <input
          className={s.input}
          placeholder="Как к вам обращаться?"
          value={value.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      {/* Блок “Я хозяин недвижимости” */}
      <div className={s.ownerBlock}>
        <label className={s.checkLine}>
          <span>
            <div className={s.ownerTitle}>Я хозяин недвижимости</div>
          </span>

          <input
            type="checkbox"
            checked={Boolean(value.owner)}
            onChange={(e) => onChange({ owner: e.target.checked })}
            style={{ cursor: "pointer" }}
          />
        </label>

        <p className={s.note}>
          Нажимая на кнопку «Разместить объявление», вы соглашаетесь с{" "}
          <a href="#" className={s.link}>правилами размещения объявлений</a>.
        </p>
      </div>
    </div>
  );
}
