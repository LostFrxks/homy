// src/pages/PropertyCreate.tsx
import { useNavigate } from "react-router-dom";
import { createProperty } from "@/lib/api";
import PropertyForm from "@/components/PropertyForm";
import type { PropertyFormValues } from "@/components/PropertyForm";
export default function PropertyCreate() {
  const nav = useNavigate();

  const initialValues: PropertyFormValues = {
    title: "",
    description: "",
    address: "",
    deal_type: "sale",
    status: "draft",
    district: "",
    rooms: 1,
    area: 0,
    price: 0,
  };

  async function handleSubmit(values: PropertyFormValues) {
    await createProperty(values);
    nav("/properties");
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Новый объект</h2>
      <PropertyForm initialValues={initialValues} onSubmit={handleSubmit} submitText="Создать" />
    </div>
  );
}
