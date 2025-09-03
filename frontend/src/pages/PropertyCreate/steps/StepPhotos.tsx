import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

type Props = {
  value: ListingDraft;
  onChange: Dispatch<SetStateAction<ListingDraft>>;
};

export default function StepPhotos({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    onChange((d) => ({ ...d, photos: [...(d.photos || []), ...urls] }));
  }

  function remove(idx: number) {
    onChange((d) => ({ ...d, photos: (d.photos || []).filter((_, i) => i !== idx) }));
  }

  const photos = value.photos || [];

  return (
    <div className={s.form}>

      <div className={s.uploadGrid}>
        {photos.map((src, i) => (
          <div className={s.uploadCell} key={i}>
            <img className={s.uploadImg} src={src} alt="" />
            <button type="button" className={s.uploadDel} onClick={() => remove(i)}>×</button>
          </div>
        ))}
        <button type="button" className={s.uploadAdd} onClick={pick}>＋</button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onFiles}
      />

      <div className={s.hint}>Совет: горизонтальные фото выглядят лучше. Первое — будет обложкой.</div>
    </div>
  );
}
