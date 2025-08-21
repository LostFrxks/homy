import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProperties, type Property } from "@/lib/api";

export default function PropertiesList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<{ items: Property[]; count: number }>({ items: [], count: 0 });
  const [loading, setLoading] = useState(false);

  const page = Number(params.get("page") || 1);
  const page_size = 20;
  const dealTypeRaw = params.get("deal_type") || "";
  const deal_type: "sale" | "rent" | undefined = dealTypeRaw === "sale" || dealTypeRaw === "rent" ? (dealTypeRaw as "sale" | "rent") : undefined;  const district = params.get("district") || "";
  const rooms = params.get("rooms") || "";
  const price_min = params.get("price_min") || "";
  const price_max = params.get("price_max") || "";
  const search = params.get("search") || "";
  const ordering = params.get("ordering") || "-created_at";

  const setP = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    next.set("page", "1");
    setParams(next);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getProperties({
          page,
          page_size,
          deal_type,
          district,
          rooms: rooms ? Number(rooms) : undefined,
          price_min: price_min ? Number(price_min) : undefined,
          price_max: price_max ? Number(price_max) : undefined,
          search,
          ordering
        });
        setData({ items: res.results, count: res.count });
      } finally {
        setLoading(false);
      }
    })();
  }, [page, page_size, deal_type, district, rooms, price_min, price_max, search, ordering]);

  const totalPages = Math.max(1, Math.ceil(data.count / page_size));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600" }}>Объекты</h1>
        <Link to="/properties/new">
          <button style={{ padding: "8px 12px", background: "blue", color: "white", border: "none", borderRadius: "4px" }}>
            Добавить
          </button>
        </Link>
      </div>

      {/* Фильтры */}
      <div style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "15px", marginBottom: "20px" }}>
        <h2 style={{ marginBottom: "10px" }}>Фильтры</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
          <select value={deal_type} onChange={(e) => setP("deal_type", e.target.value)}>
            <option value="">Любой</option>
            <option value="sale">Продажа</option>
            <option value="rent">Аренда</option>
          </select>
          <input placeholder="Район" value={district} onChange={(e) => setP("district", e.target.value)} />
          <input placeholder="Комнат" type="number" value={rooms} onChange={(e) => setP("rooms", e.target.value)} />
          <input placeholder="Цена от" type="number" value={price_min} onChange={(e) => setP("price_min", e.target.value)} />
          <input placeholder="Цена до" type="number" value={price_max} onChange={(e) => setP("price_max", e.target.value)} />
          <input placeholder="Поиск..." value={search} onChange={(e) => setP("search", e.target.value)} />
          <select value={ordering} onChange={(e) => setP("ordering", e.target.value)}>
            <option value="-created_at">Новые</option>
            <option value="price">Дешевле → дороже</option>
            <option value="-price">Дороже → дешевле</option>
            <option value="area">Меньше → больше (м²)</option>
            <option value="-area">Больше → меньше (м²)</option>
          </select>
          <button
            style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px", background: "#f9f9f9" }}
            onClick={() => setParams(new URLSearchParams({ page: "1" }))}
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Список */}
      <div style={{ border: "1px solid #ccc", borderRadius: "6px" }}>
        {loading && <div style={{ padding: "10px" }}>Загрузка…</div>}
        {!loading && data.items.length === 0 && <div style={{ padding: "10px" }}>Ничего не найдено</div>}
        {data.items.map((p) => (
          <div key={p.id} style={{ padding: "10px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: "500" }}>{p.title}</div>
              <div style={{ fontSize: "14px", color: "#555" }}>
                {p.deal_type} • {p.district || "—"} • {p.rooms}к • {Number(p.area)} м² •{" "}
                {Number(p.price).toLocaleString()} ₸
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px" }}>
        <button
          disabled={page <= 1}
          onClick={() =>
            setParams(new URLSearchParams({ ...Object.fromEntries(params), page: String(page - 1) }))
          }
          style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: "4px", background: "#f9f9f9" }}
        >
          Назад
        </button>
        <div style={{ fontSize: "14px" }}>Стр. {page} из {totalPages}</div>
        <button
          disabled={page >= totalPages}
          onClick={() =>
            setParams(new URLSearchParams({ ...Object.fromEntries(params), page: String(page + 1) }))
          }
          style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: "4px", background: "#f9f9f9" }}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
