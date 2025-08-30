// src/pages/PropertyDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getMeSelf,      // либо используй getMe(token) — см. ниже
  getMe,
  getProperty,
  deleteProperty,
  type Property as BaseProperty,
  type User,
} from "@/lib/api";

// Локально расширим под будущие фото (опционально)
type Property = BaseProperty & {
  images?: { id: number; url: string }[];
};

function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [me, setMe] = useState<User | null>(null);
  const [item, setItem] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Вариант 1: удобный getMeSelf()
        // const meData = await getMeSelf();

        // Вариант 2: твой getMe(token)
        const token = localStorage.getItem("access") || "";
        const [meData, prop] = await Promise.all([getMe(token), getProperty(id!)]);
        if (!cancelled) {
          setMe(meData);
          setItem(prop as Property);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Не удалось загрузить объект");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const isOwner = useMemo(() => {
    if (!me || !item) return false;
    // у тебя владелец — это realtor (числовой id)
    return item.realtor === me.id;
  }, [me, item]);

  async function onDelete() {
    if (!id) return;
    if (!confirm("Удалить объект? Действие необратимо.")) return;
    try {
      setDeleting(true);
      await deleteProperty(id);
      nav("/properties");
    } catch (e: any) {
      alert(e?.message || "Не получилось удалить объект");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>Загрузка…</div>;
  }

  if (error || !item) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        <p style={{ color: "crimson" }}>{error || "Объект не найден"}</p>
        <Link to="/properties">← Назад к списку</Link>
      </div>
    );
  }

  const areaText = Number.isFinite(Number(item.area)) ? `${Number(item.area)} м²` : "—";
  const priceText = Number.isFinite(Number(item.price)) ? `${Number(item.price).toLocaleString()} ₸` : "—";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>{item.title}</h1>
          {item.address && <div style={{ color: "#555" }}>{item.address}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/properties"><button>Назад</button></Link>
          {isOwner && (
            <>
              <Link to={`/properties/${item.id}/edit`}><button>Редактировать</button></Link>
              <button onClick={onDelete} disabled={deleting} style={{ color: "crimson" }}>
                {deleting ? "Удаление…" : "Удалить"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Фото — заглушка. Когда BE начнёт отдавать images[], этот блок заработает сам */}
      <section style={{ marginTop: 16 }}>
        <h3 style={{ fontWeight: 600 }}>Фото</h3>
        {item.images && item.images.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
            {item.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, color: "#666" }}>
            Фото пока нет. Подключим после BE‑медиа.
          </div>
        )}
      </section>

      {item.description && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Описание</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{item.description}</p>
        </section>
      )}

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Info label="Тип сделки" value={item.deal_type === "sale" ? "Продажа" : "Аренда"} />
        <Info label="Статус" value={item.status} />
        <Info label="Район" value={item.district || "—"} />
        <Info label="Комнат" value={String(item.rooms)} />
        <Info label="Площадь" value={areaText} />
        <Info label="Цена" value={priceText} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default PropertyDetail;
