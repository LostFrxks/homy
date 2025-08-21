import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../lib/api";

const toNum = (v: any) => Number(String(v).replace(",", "."));

export default function PropertyCreate() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    deal_type: "sale",
    status: "draft",
    district: "",
    rooms: 1,
    area: 0,
    price: 0,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProperty({
        title: form.title,
        description: form.description || undefined,
        address: form.address || undefined,
        deal_type: form.deal_type as "sale" | "rent",
        status: (form.status as any) || undefined,
        district: form.district || undefined,
        rooms: toNum(form.rooms),
        area: toNum(form.area),
        price: toNum(form.price),
      } as any);
      nav("/properties");
    } catch (err) {
      alert("Ошибка при создании");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Новый объект</h2>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label>Заголовок</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label>Тип сделки</label>
          <select
            value={form.deal_type}
            onChange={(e) => setForm(f => ({ ...f, deal_type: e.target.value as any }))}
          >
            <option value="sale">Продажа</option>
            <option value="rent">Аренда</option>
          </select>
        </div>

        <div>
          <label>Статус</label>
          <select
            value={form.status}
            onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
          >
            <option value="draft">Черновик</option>
            <option value="active">Активен</option>
            <option value="reserved">Зарезервирован</option>
            <option value="sold">Продан</option>
            <option value="archived">Архив</option>
          </select>
        </div>

        <div>
          <label>Район</label>
          <input
            type="text"
            value={form.district}
            onChange={(e) => setForm(f => ({ ...f, district: e.target.value }))}
          />
        </div>

        <div>
          <label>Комнат</label>
          <input
            type="number"
            value={form.rooms}
            min={0}
            onChange={(e) => setForm(f => ({ ...f, rooms: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label>Площадь (м²)</label>
          <input
            type="number"
            value={form.area}
            min={0}
            step="0.01"
            onChange={(e) => setForm(f => ({ ...f, area: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label>Цена</label>
          <input
            type="number"
            value={form.price}
            min={0}
            step="0.01"
            onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label>Адрес</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div>
          <label>Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => nav(-1)}>
            Отмена
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Создаю…" : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}