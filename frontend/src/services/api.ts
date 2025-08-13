export const API_URL = "http://localhost:5000";

export async function fetcher(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });
    if (!res.ok) throw new Error("API error");
    return res.json();
}
