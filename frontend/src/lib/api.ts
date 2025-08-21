const BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");
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

export async function login(identity: string, password: string) {
  const body = identity.includes("@")
    ? { email: identity, password }
    : { username: identity, password };

  const res = await fetch(url("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await handleAuth(res);
  if (!res.ok) throw new Error("Ошибка при логине");
  return res.json(); // { access, refresh }
}

export async function getMe(token: string) {
  const res = await fetch(url("/auth/me"), {
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

// На бэке area/price — DecimalField → чаще приходит строкой.
const normalizeProperty = (p: any): Property => ({
  ...p,
  price: typeof p.price === "string" ? Number(p.price) : p.price,
  area: typeof p.area === "string" ? Number(p.area) : p.area,
});

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

  const res = await fetch(url(`/properties/?${qs.toString()}`), {
    headers: auth(),
  });

  await handleAuth(res);
  if (!res.ok) throw new Error("Failed to load properties");

  const data = (await res.json()) as Paginated<any>;
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
  const res = await fetch(url("/properties/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify(payload),
  });

  await handleAuth(res);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create property");
  }
  const data = await res.json();
  return normalizeProperty(data) as Property;
}
