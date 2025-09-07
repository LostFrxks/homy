import { useRef } from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

const DOC_OPTS = [
  { value: "red_book", label: "Красная книга" },
  { value: "tech_passport", label: "Техпаспорт" },
  { value: "ddu", label: "ДДУ" },
];

const COMM_OPTS = [
  { value: "water", label: "Вода" },
  { value: "gas", label: "Газ" },
  { value: "electricity", label: "Электричество" },
  { value: "sewage", label: "Канализация" },
];

type Props = {
  value: ListingDraft;
  onChange: (next: Partial<ListingDraft>) => void;
};

export default function StepDocuments({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toggle = (arr: string[] | undefined, v: string) => {
    const set = new Set(arr ?? []);
    set.has(v) ? set.delete(v) : set.add(v);
    return Array.from(set);
  };

  const planFiles = value.planFile ?? [];

  // === Планировки: выбор/удаление ===
  const pick = () => inputRef.current?.click();

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onChange({ planFile: [...planFiles, ...files] });
    // очищаем value, чтобы повторно выбирать те же файлы
    e.currentTarget.value = "";
  }

  function removeAt(idx: number) {
    const next = planFiles.slice();
    next.splice(idx, 1);
    onChange({ planFile: next });
  }

  // Вспомогалки
  const isImage = (f: File) => f.type.startsWith("image/");
  const fileSize = (f: File) => {
    const kb = f.size / 1024;
    return kb < 1024 ? `${Math.round(kb)} КБ` : `${(kb / 1024).toFixed(1)} МБ`;
  };

  return (
    <div className={s.form}>
      {/* Документы */}
      <div className={s.formItem}>
        <label className={s.labelRow}>Документы</label>
        {DOC_OPTS.map((o, i) => (
          <label
            key={o.value}
            className={s.checkLine}
            style={{
              borderBottom: i === DOC_OPTS.length - 1 ? "none" : "1px solid #e5e7eb",
            }}
          >
            <span>{o.label}</span>
            <input
              type="checkbox"
              checked={!!value.documents?.includes(o.value)}
              onChange={() =>
                onChange({ documents: toggle(value.documents, o.value) })
              }
              className={s.input_checkbox}
            />
          </label>
        ))}
      </div>

      {/* Коммуникации */}
      <div className={s.formItem}>
        <label className={s.labelRow}>Коммуникации</label>
        {COMM_OPTS.map((o, i) => (
          <label
            key={o.value}
            className={s.checkLine}
            style={{
              borderBottom: i === COMM_OPTS.length - 1 ? "none" : "1px solid #e5e7eb",
            }}
          >
            <span>{o.label}</span>
            <input
              type="checkbox"
              checked={!!value.communications?.includes(o.value)}
              onChange={() =>
                onChange({ communications: toggle(value.communications, o.value) })
              }
              className={s.input_checkbox}
            />
          </label>
        ))}
      </div>

      <div className={s.hr} />
      {/* Планировки: множественные файлы */}
      <div className={`${s.formItem} ${s.addFiles}`}>
        <label className={s.labelRow} style={{margin:"0", textAlign:"center", color:"#000000", fontSize:"18px", fontWeight:"500"}}>Планировки (файлы)</label>

          <button type="button" className={s.button_addfiles} onClick={pick}>
            Добавить файлы
          </button>
          {planFiles.length > 0 && (
            <span className={s.fileName}>
              Выбрано: {planFiles.length}
            </span>
          )}

        {/* Превью изображений в сетке */}
        {planFiles.some(isImage) && (
          <div className={s.uploadGrid} style={{ marginTop: 10 }}>
            {planFiles.map((f, i) =>
              isImage(f) ? (
                <div className={s.uploadCell} key={`${f.name}-${i}`}>
                  <img
                    className={s.uploadImg}
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                  />
                  <button
                    type="button"
                    className={s.uploadDel}
                    onClick={() => removeAt(i)}
                    aria-label="Удалить файл"
                  >
                    ×
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Список не-изображений (PDF и пр.) */}
        {planFiles.some((f) => !isImage(f)) && (
          <ul className={s.fileList}>
            {planFiles.map((f, i) =>
              !isImage(f) ? (
                <li key={`${f.name}-${i}`} className={s.fileChip}>
                  <span className={s.fileChipName} title={f.name}>
                    {f.name}
                  </span>
                  <span className={s.fileChipSize}>{fileSize(f)}</span>
                  <button
                    type="button"
                    className={s.btnGhost}
                    onClick={() => removeAt(i)}
                  >
                    Удалить
                  </button>
                </li>
              ) : null
            )}
          </ul>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          hidden
          onChange={onFiles}
        />

        <div className={s.fileName} style={{margin:"0", textAlign:"center"}}>
          Прикрепляйте PDF или изображения.
        </div>
      </div>
    </div>
  );
}
