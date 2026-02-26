const RAILWAY_API = process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app";

export async function railwayFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${RAILWAY_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}
