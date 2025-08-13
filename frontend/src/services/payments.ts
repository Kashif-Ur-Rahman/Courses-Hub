import { fetcher, API_URL } from "./api";

export const createCheckoutSession = async (courseId: number, token: string) => {
    const res = await fetch(`${API_URL}/api/payments/checkout/create-session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
    });
    return res.json();
};
