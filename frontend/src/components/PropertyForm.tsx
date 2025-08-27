import { useState } from "react";

const toNum = (v: any) => Number(String(v).replace(",", "."));

export type PropertyFormValues = {
  title: string;
  description?: string;                 // единственное необязательное
  address: string;                      // теперь обязательно
  deal_type: "sale" | "rent";           // обязательно
  status: "draft" | "active" | "reserved" | "sold" | "archived"; // обязательно
  district: string;                     // теперь обязательно
  rooms: number;                        // обязательно
  area: number;                         // обязательно
  price: number;                        // обязательно
};

type Props = {
  initialValues: PropertyFormValues;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  submitText: string;
};

type Errors = Partial<Record<keyof PropertyFormValues, string>>;

export default function PropertyForm({ initialValues, onSubmit, submitText }: Props) {
  const [form, setForm] = useState<PropertyFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function validate(values: PropertyFormValues): Errors {
    const e: Errors = {};
    if (!values.title.trim()) e.title = "Введите заголовок";
    if (!values.address.trim()) e.address = "Укажите адрес";
    if (!values.district.trim()) e.district = "Укажите район";
    if (!values.deal_type) e.deal_type = "Выберите тип сделки";
    if (!values.status) e.status = "Выберите статус";

    const rooms = toNum(values.rooms);
    const area = toNum(values.area);
    const price = toNum(values.price);

    if (!Number.isFinite(rooms) || rooms < 1) e.rooms = "Комнат должно быть ≥ 1";
    if (!Number.isFinite(area) || area <= 0) e.area = "Площадь должна быть > 0";
    if (!Number.isFinite(price) || price <= 0) e.price = "Цена должна быть > 0";

    return e;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: PropertyFormValues = {
      ...form,
      rooms: toNum(form.rooms),
      area: toNum(form.area),
      price: toNum(form.price),
      // description может быть пустой/не заданной — это ок
    };

    const v = validate(cleaned);
    setErrors(v);
    if (Object.keys(v).length) return; // не уходим, пока есть ошибки

    try {
      setSaving(true);
      await onSubmit(cleaned);
    } finally {
      setSaving(false);
    }
  };

  const fieldWrap: React.CSSProperties = { marginBottom: 10 };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={fieldWrap}>
        <label>Заголовок *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        {errors.title && <div style={{ color: "crimson", fontSize: 12 }}>{errors.title}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Тип сделки *</label>
        <select
          value={form.deal_type}
          onChange={(e) => setForm((f) => ({ ...f, deal_type: e.target.value as any }))}
          required
        >
          <option value="sale">Продажа</option>
          <option value="rent">Аренда</option>
        </select>
        {errors.deal_type && <div style={{ color: "crimson", fontSize: 12 }}>{errors.deal_type}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Статус *</label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
          required
        >
          <option value="draft">Черновик</option>
          <option value="active">Активен</option>
          <option value="reserved">Зарезервирован</option>
          <option value="sold">Продан</option>
          <option value="archived">Архив</option>
        </select>
        {errors.status && <div style={{ color: "crimson", fontSize: 12 }}>{errors.status}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Район *</label>
        <select
          value={form.district}
          onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
          required
        >
          <option value="">Выберите район</option>
          <option value="Первомайский район">Первомайский район</option>
          <option value="Свердловский район">Свердловский район</option>
          <option value="Октябрьский район">Октябрьский район</option>
          <option value="Ленинский район">Ленинский район</option>
        </select>
        {errors.district && <div style={{ color: "crimson", fontSize: 12 }}>{errors.district}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Адрес *</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          required
        />
        {errors.address && <div style={{ color: "crimson", fontSize: 12 }}>{errors.address}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Комнат *</label>
        <input
          type="number"
          value={form.rooms}
          min={1}
          onChange={(e) => setForm((f) => ({ ...f, rooms: Number(e.target.value) }))}
          required
        />
        {errors.rooms && <div style={{ color: "crimson", fontSize: 12 }}>{errors.rooms}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Площадь (м²) *</label>
        <input
          type="number"
          value={form.area}
          min={0.01}
          step="0.01"
          onChange={(e) => setForm((f) => ({ ...f, area: Number(e.target.value) }))}
          required
        />
        {errors.area && <div style={{ color: "crimson", fontSize: 12 }}>{errors.area}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Цена *</label>
        <input
          type="number"
          value={form.price}
          min={0.01}
          step="0.01"
          onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
          required
        />
        {errors.price && <div style={{ color: "crimson", fontSize: 12 }}>{errors.price}</div>}
      </div>

      <div style={fieldWrap}>
        <label>Описание (необязательно)</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Можно оставить пустым"
        />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="submit" disabled={saving}>
          {saving ? "Сохранение…" : submitText}
        </button>
      </div>
    </form>
  );
}
