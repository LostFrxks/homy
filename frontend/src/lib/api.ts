const BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");
const url = (p: string) => `${BASE}${p}`;

export async function login(identity: string, password: string) {
  // identity может быть email или username
  const body = identity.includes("@")
    ? { email: identity, password }
    : { username: identity, password };

  const res = await fetch(url("/auth/login"), {
    method: "POST",                           // ← строго POST
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Ошибка при логине");
  return res.json(); // { access, refresh }
}

export async function getMe(token: string) {
  const res = await fetch(url("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Не удалось получить профиль");
  return res.json();
}
