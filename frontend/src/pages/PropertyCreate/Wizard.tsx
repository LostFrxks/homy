import { useMemo, useState } from "react";
import s from "./Wizard.module.css";

import StepAddress from "./steps/StepAddress";
import StepPrice from "./steps/StepPrice";
import StepDescription from "./steps/StepDescription";
import StepPhotos from "./steps/StepPhotos";
import StepContacts from "./steps/StepContacts";
import StepSelectType from "./steps/StepSelectType";
import type { DealType, ObjectType } from "./steps/StepSelectType";

/** Общая форма состояния мастера */
export type ListingDraft = {
  // выбор типа
  deal: DealType | null;                 // "sale" | "rent"
  kind: ObjectType | null;               // "apartment" | "house" | "land" | "commercial" | "business" | "parking"

  // адрес
  city?: string; district?: string; microdistrict?: string;
  street?: string; house?: string; hideHouse?: boolean;

  // цена / условия
  price?: string;
  rent_price?: string; period?: "day" | "month";
  deposit?: string; prepay?: string; utilities_included?: boolean; commission?: string;

  // описание
  description?: string;

  // фото
  photos?: string[];

  // контакты
  phone?: string; name?: string; owner?: boolean;
};

const ALL_STEPS = ["select","address","price","description","photos","contacts"] as const;
export type StepId = typeof ALL_STEPS[number];
export type StepList = readonly StepId[];

export default function Wizard() {
  const [data, setData] = useState<ListingDraft>({ deal: null, kind: null, photos: [] });
  const [step, setStep] = useState<StepId>("select");
  const update = (next: Partial<ListingDraft>) =>
    setData(prev => ({ ...prev, ...next }));
  // линейный флоу (при необходимости позже разветвим по deal/kind)
  const flow = useMemo<StepList>(() => ALL_STEPS, []);
  const idx = flow.indexOf(step);

  // валидаторы по шагам — определяют, когда шаг считается "выполненным"
  const validators: Record<StepId, (d: ListingDraft) => boolean> = {
    select:   d => Boolean(d.deal && d.kind),
    address:  d => Boolean(d.city && d.street),
    price:    d => (d.deal === "sale" ? Boolean(d.price) : Boolean(d.rent_price)),

    description: d => Boolean(d.description && d.description.trim().length > 0),

    // станет выполнен только если добавлена хотя бы 1 фотка
    // (если у тебя не string[], а File[]/{url:string}[], оставь только проверку длины)
    photos: d => Array.isArray(d.photos) && d.photos.filter(Boolean).length > 0,

    contacts: d => Boolean(d.phone && d.phone.trim()),
  };

  // карта "шаг -> выполнен?"
  const doneByStep = useMemo(() => {
    const map = {} as Record<StepId, boolean>;
    for (const id of flow) map[id] = validators[id](data);
    return map;
  }, [flow, data]);

  // доступность кнопки "Далее"
  const canNext = validators[step](data);

  const goNext = () => { if (idx < flow.length - 1) setStep(flow[idx + 1]); };
  const goPrev = () => { if (idx > 0) setStep(flow[idx - 1]); };

  return (
    <div className={s.wrap}>
        {/* Верхняя полоска управления: слева текст «назад», справа крестик */}
        <div className={s.topControls}>
        <button
            type="button"
            className={s.backLink}
            onClick={goPrev}
            disabled={idx === 0}
        >
            назад
        </button>

        <button
            className={s.closeBtn}
            type="button"
            onClick={() => history.back()}
            aria-label="Закрыть"
            >
            <svg className={s.closeIcon} viewBox="0 0 24 24" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
        </button>
    </div>

    {/* Прогресс-бар шагов (кликабельный) */}
    <div className={s.progress}>
    {flow.map((id) => (
        <button
        key={id}
        type="button"
        className={`${s.bar} ${doneByStep[id] ? s.barDone : ""} ${step === id ? s.barActive : ""}`}
        onClick={() => setStep(id)}
        aria-label={id}
        />
    ))}
    </div>

    {/* ...дальше твоя секция с карточкой шага и футером... */}


      {/* Контент шага */}
      <section className={s.card}>
        {step === "select" && (
          <>
            <h2 className={s.cardTitle}>Подать объявление</h2>
            <StepSelectType
              value={{ deal: data.deal, kind: data.kind }}
              onChange={(next) => setData((d) => ({ ...d, ...next }))}
            />
          </>
        )}

        {step === "address" && (
          <>
            <h2 className={s.cardTitle}>Укажите адрес</h2>
            <StepAddress value={data} onChange={update} />
          </>
        )}

        {step === "price" && (
          <>
            <h2 className={s.cardTitle}>Укажите цену</h2>
            <StepPrice value={data} onChange={setData} />
          </>
        )}

        {step === "description" && (
          <>
            <h2 className={s.cardTitle}>Добавьте описание</h2>
            <StepDescription value={data} onChange={setData} />
          </>
        )}

        {step === "photos" && (
          <>
            <h2 className={s.cardTitle}>Добавьте фото</h2>
            <StepPhotos value={data} onChange={setData} />
          </>
        )}

        {step === "contacts" && (
          <>
            <h2 className={s.cardTitle}>Укажите контакты</h2>
            <StepContacts value={data} onChange={setData} />
          </>
        )}
      </section>

      {/* Нижняя панель */}
      <div className={s.footer}>
        <button className={s.btnGhost}>Сохранить черновик</button>
        <button
          className={s.btnPrimary}
          disabled={!canNext}
          onClick={idx === flow.length - 1 ? () => alert("Пока только UI — подключим API позже") : goNext}
        >
          {idx === flow.length - 1 ? "Разместить объявление" : "Перейти к подаче"}
        </button>
      </div>
    </div>
  );
}
