import { fetcher } from "./api";

export const getCourses = () => fetcher("/courses");
export const getCourseById = (id: number) => fetcher(`/courses/${id}`);
export const createCourse = (data: any) =>
    fetcher("/courses", { method: "POST", body: JSON.stringify(data) });
