const BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/+$/, "");
const url = (p: string) => `${BASE}${p}`;

// === helpers ===
const auth = (): Record<string, string> => {
  const t = localStorage.getItem("access");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function handleAuth(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem("access");
    window.location.assign("/login"); // редирект на страницу логина
    throw new Error("Unauthorized");
  }
  return res;
}

export async function login(email: string, password: string) {
  const res = await fetch(url("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }), // <-- только email
  });
  if (res.status === 401) {
    localStorage.removeItem("access");
    window.location.assign("/login");
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Ошибка при логине");
  return res.json(); // ожидаем { access, refresh }
}

export async function getMe(token: string) {
  const res = await authedFetch(url("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleAuth(res);
  if (!res.ok) throw new Error("Не удалось получить профиль");
  return res.json();
}

export type Property = {
  id: number;
  title: string;
  description?: string;
  address?: string;
  deal_type: "sale" | "rent";
  status: "draft" | "active" | "reserved" | "sold" | "archived";
  district?: string;
  rooms: number;
  area: number;
  price: number;
  realtor: number;
  realtor_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Paginated<T> = {  
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Тип пользователя — для проверки владельца на фронте
export type User = { id: number; email: string };

// Удобный вариант getMe без явной передачи токена (оставь И СТАРЫЙ getMe(token))
export async function getMeSelf(): Promise<User> {
  const t = localStorage.getItem("access");
  if (!t) throw new Error("No token");
  const res = await authedFetch(url("/auth/me"), { headers: { Authorization: `Bearer ${t}` } });
  await handleAuth(res);
  if (!res.ok) throw new Error("Не удалось получить профиль");
  return res.json();
}

// На бэке area/price — DecimalField → чаще приходит строкой.
interface RawProperty extends Omit<Property, "price" | "area"> {
  price: string | number;
  area: string | number;
}

const normalizeProperty = (p: RawProperty): Property => ({
  ...p,
  price: typeof p.price === "string" ? Number(p.price) : p.price,
  area: typeof p.area === "string" ? Number(p.area) : p.area,
});

// Детальная карточка
export async function getProperty(id: string | number): Promise<Property> {
  const res = await authedFetch(url(`/properties/${id}/`));
  await handleAuth(res);
  if (!res.ok) throw new Error("Failed to load property");
  const data = (await res.json()) as RawProperty;
  return normalizeProperty(data);
}

// Удаление объекта
export async function deleteProperty(id: string | number): Promise<void> {
  const res = await authedFetch(url(`/properties/${id}/`), { method: "DELETE" });
  await handleAuth(res);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete property");
  }
}

// (Опционально) Обновление — пригодится для /edit
export async function updateProperty(
  id: string | number,
  payload: Partial<Omit<Property, "id" | "realtor" | "created_at" | "updated_at">>
): Promise<Property> {
  const res = await authedFetch(url(`/properties/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await handleAuth(res);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update property");
  }
  const data = (await res.json()) as RawProperty;
  return normalizeProperty(data);
}

// === API: list with filters/pagination ===
export async function getProperties(params?: {
  page?: number;
  page_size?: number;
  deal_type?: "sale" | "rent";
  status?: "draft" | "active" | "reserved" | "sold" | "archived";
  district?: string;
  rooms?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  search?: string;
  ordering?: string;
}) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });

  const res = await authedFetch(url(`/properties/?${qs.toString()}`));

  await handleAuth(res);
  if (!res.ok) throw new Error("Failed to load properties");

  const data = (await res.json()) as Paginated<RawProperty>;
  return {
    ...data,
    results: data.results.map(normalizeProperty),
  } as Paginated<Property>;
}

// === API: create ===
export async function createProperty(payload: {
  title: string;
  description?: string;
  address?: string;
  deal_type: "sale" | "rent";
  status: "draft" | "active" | "reserved" | "sold" | "archived";
  district?: string;
  rooms: number;
  area: number;
  price: number;
}) {
  const res = await authedFetch(url("/properties/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await handleAuth(res);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create property");
  }
  const data = (await res.json()) as RawProperty;
  return normalizeProperty(data);
}

async function refreshAccess(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  const res = await fetch(url("/auth/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;
  const data = await res.json(); // ожидаем { access: "..." }
  if (data?.access) {
    localStorage.setItem("access", data.access);
    return data.access;
  }
  return null;
}

// 2) Универсальный helper-запрос с авто-рефрешем
async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}, retry = false): Promise<Response> {
  const headers = { ...(init.headers || {}), ...auth() };
  const res = await fetch(input, { ...init, headers });

  if (res.status !== 401) return res;

  // Если уже пробовали рефреш — не зацикливаемся
  if (retry) return res;

  // Не пытаемся рефрешить сами эндпоинты логина/рефреша
  const u = String(input);
  if (u.includes("/auth/login") || u.includes("/auth/refresh")) return res;

  const newAccess = await refreshAccess();
  if (!newAccess) return res;

  // Повторяем исходный запрос уже с новым access
  const nextHeaders = { ...(init.headers || {}), Authorization: `Bearer ${newAccess}` };
  return fetch(input, { ...init, headers: nextHeaders });
}
