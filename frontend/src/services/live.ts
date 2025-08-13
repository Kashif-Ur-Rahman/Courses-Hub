import { fetcher, API_URL } from "./api";

export const getPlaybackToken = async (courseId: number, token: string) => {
    const res = await fetch(`${API_URL}/api/mux/courses/${courseId}/playback-token`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};
