// frontend/src/pages/PropertyCreate/Wizard.tsx
import { useMemo, useState, useEffect } from "react";
import s from "./Wizard.module.css";
import { createProperty, uploadPropertyImage} from "@/lib/api";

import StepAddress from "./steps/StepAddress";
import StepPrice from "./steps/StepPrice";
import StepDescription from "./steps/StepDescription";
import StepPhotos from "./steps/StepPhotos";
import StepContacts from "./steps/StepContacts";
import StepSelectType, { type DealType, type ObjectType } from "./steps/StepSelectType";
import StepDetails from "./steps/StepDetails";
import StepDocuments from "./steps/StepDocuments";

/** Общая форма состояния мастера */
export type ListingDraft = {
  // выбор типа
  deal: DealType | null;                 // "sale" | "rent"
  kind: ObjectType | null;               // "elite" | "secondary" | ...

  // адрес
  city?: string;
  district?: string;
  microdistrict?: string;
  street?: string;
  house?: string;
  hideHouse?: boolean;
  cross_streets?: string;

  // цена / условия
  price?: string;
  rent_price?: string;
  period?: "day" | "month";
  deposit?: string;
  prepay?: string;
  utilities_included?: boolean;
  commission?: string;

  // описание
  description?: string;

  // фото
  photos?: string[];
  photosFiles?: File[];
  // контакты
  phone?: string;
  name?: string;
  owner?: boolean;

  // характеристики
  rooms?: number;
  floor?: number | null;
  area?: number;

  condition?: "new_psd" | "requires_repair" | "cosmetic" | "euro";
  furniture?: boolean;

  // документы / коммуникации
  documents?: string[];
  communications?: string[];

  offer_type?: "owner" | "intermediary" | "contractor" | "realtor";
  offer_category?: "buyout" | "urgent" | "exclusive";
  status?: "draft" | "active" | "reserved" | "sold" | "archived";

  planFile?: File[];

  // элитка/ЖК (на будущее)
  complexId?: number | null;
  plan?: string | null;
  plan_area?: number | null;

  doc_photos?: string[];
};

const ALL_STEPS = [
  "select",
  "address",
  "price",
  "details",
  "description",
  "photos",
  "documents",
  "contacts",
] as const;

export type StepId = typeof ALL_STEPS[number];
export type StepList = readonly StepId[];

/** Тип полезной нагрузки для createProperty (берём из сигнатуры API) */
type CreatePropertyPayload = Parameters<typeof createProperty>[0];

/** Красивые названия типов объекта для заголовка */
const KIND_LABEL: Record<NonNullable<ObjectType>, string> = {
  elite: "Элитка",
  secondary: "Вторичная",
  commercial: "Коммерческая",
  house_land: "Дом/участок",
  club_house: "Клубный дом",
  parking: "Парковка",
};

/** Преобразуем ListingDraft -> payload для бэка */
function toApi(d: ListingDraft): CreatePropertyPayload {
  const kindLabel = d.kind ? KIND_LABEL[d.kind] : "Объект";
  return {
    title: `${kindLabel}${d.city ? ` в ${d.city}` : ""}`.trim(),
    description: d.description || "",
    address: [d.city, d.district, d.microdistrict, d.street, d.house]
      .filter(Boolean)
      .join(", "),
    deal_type: d.deal === "sale" ? "sale" : "rent",
    status: d.status ?? "active",
    district: d.district || undefined,

    rooms: d.rooms ?? 0,
    area: d.area ?? 0,
    price: Number(d.deal === "sale" ? d.price : d.rent_price) || 0,

    // опциональные поля (бэк примет по мере расширения модели)
    floor: d.floor ?? null,
    kind: d.kind ?? undefined,
    phone: d.phone || undefined,
    owner_name: d.name || undefined,
    cross_streets: d.cross_streets || undefined,
    condition: d.condition || undefined,
    furniture: d.furniture ?? undefined,
    documents: d.documents?.length ? d.documents : undefined,
    communications: d.communications?.length ? d.communications : undefined,
    offer_type: d.offer_type || undefined,
    offer_category: d.offer_category || undefined,
  };
}

export default function Wizard() {
  const [data, setData] = useState<ListingDraft>({
    deal: null,
    kind: null,
    photos: [],
    planFile: [],
  });
  const [step, setStep] = useState<StepId>("select");
  const [submitting, setSubmitting] = useState(false);

  // Запоминаем посещённые шаги (для подсветки "Документы" после первого визита)
  const [visited, setVisited] = useState<Partial<Record<StepId, boolean>>>({});

  const update = (next: Partial<ListingDraft>) =>
    setData((prev) => ({ ...prev, ...next }));

  // линейный флоу
  const flow = useMemo<StepList>(() => ALL_STEPS, []);
  const idx = flow.indexOf(step);

  // отмечаем текущий шаг посещённым
  useEffect(() => {
    setVisited((v) => (v?.[step] ? v : { ...v, [step]: true }));
  }, [step]);

  // валидаторы по шагам — когда шаг считается "выполненным"
  const validators: Record<StepId, (d: ListingDraft) => boolean> = {
    select:   (d) => Boolean(d.deal && d.kind),
    address:  (d) => Boolean(d.city && d.street),
    price:    (d) => (d.deal === "sale" ? Boolean(d.price) : Boolean(d.rent_price)),
    details:  (d) =>
      Boolean(d.rooms && d.area) &&
      (d.kind !== "parking" ? (d.floor ?? null) !== null : true),
    description: (d) => Boolean(d.description && d.description.trim().length > 0),
    photos:   (d) => Array.isArray(d.photos) && d.photos.filter(Boolean).length > 0,
    documents: (_d) => true, // шаг проходной; "Далее" доступно
    contacts: (d) => Boolean(d.phone && d.phone.trim()),
  };

  // карта "шаг -> выполнен?"
  const doneByStep = useMemo(() => {
    const map = {} as Record<StepId, boolean>;
    for (const id of flow) {
      map[id] =
        id === "documents"
          ? Boolean(visited.documents ?? false) // готов только после посещения
          : validators[id](data);               // остальные — по валидатору
    }
    return map;
  }, [flow, data, visited]);

  // доступность кнопки "Далее"
  const canNext = validators[step](data);

  const goNext = () => { if (idx < flow.length - 1) setStep(flow[idx + 1]); };
  const goPrev = () => { if (idx > 0) setStep(flow[idx - 1]); };

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = toApi(data);

      // создаём один раз и берём id созданного объекта
      const created = await createProperty(payload);

      // загружаем выбранные фото на этот id
      if (data.photosFiles?.length) {
        for (const f of data.photosFiles) {
          await uploadPropertyImage(created.id, f);
        }
      }

      window.location.assign("/objects/my");
    } catch (e: any) {
      alert(e?.message || "Не удалось создать объект");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={s.wrap}>
      {/* Верхняя полоска управления */}
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

      {/* Прогресс-бар шагов */}
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

        {step === "details" && (
          <>
            <h2 className={s.cardTitle}>Характеристики объекта</h2>
            <StepDetails value={data} onChange={update} />
          </>
        )}

        {step === "documents" && (
          <>
            <h2 className={s.cardTitle}>Документы и коммуникации</h2>
            <StepDocuments value={data} onChange={update} />
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
            <StepContacts value={data} onChange={update} />
          </>
        )}
      </section>

      {/* Нижняя панель */}
      <div className={s.footer}>
        <button
          className={s.btnPrimary}
          disabled={!canNext || submitting}
          onClick={idx === flow.length - 1 ? handleSubmit : goNext}
          style={{ width: "100%" }}
        >
          {submitting
            ? "Отправка..."
            : idx === flow.length - 1
              ? "Разместить объявление"
              : "Далее"}
        </button>
      </div>
    </div>
  );
}
