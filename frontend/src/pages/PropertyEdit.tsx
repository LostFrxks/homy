// src/pages/PropertyEdit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProperty, updateProperty } from "@/lib/api";
import PropertyForm from "@/components/PropertyForm";
import type { PropertyFormValues } from "@/components/PropertyForm";
export default function PropertyEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [initialValues, setInitialValues] = useState<PropertyFormValues | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProperty(id!);
      setInitialValues({
        title: p.title,
        description: p.description || "",
        address: p.address || "",
        deal_type: p.deal_type,
        status: p.status,
        district: p.district || "",
        rooms: Number(p.rooms || 0),
        area: Number(p.area || 0),
        price: Number(p.price || 0),
      });
    })();
  }, [id]);

  async function handleSubmit(values: PropertyFormValues) {
    await updateProperty(id!, values);
    nav(`/properties/${id}`);
  }

  if (!initialValues) return <div style={{ padding: 20 }}>Загрузка…</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Редактирование объекта</h2>
      <PropertyForm initialValues={initialValues} onSubmit={handleSubmit} submitText="Сохранить" />
    </div>
  );
}
