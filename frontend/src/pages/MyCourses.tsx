// frontend/src/pages/MyCourses.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail_url: string;
}

export default function MyCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            const token = localStorage.getItem("token");

            // If no token, send user to login
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/api/payments/my-courses", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 401) {
                    // Unauthorized — go to login
                    navigate("/login");
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Error: ${res.status}`);
                }

                const data = await res.json();
                setCourses(data);
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError("Failed to load your courses. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [navigate]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <h1>My Courses</h1>
            {courses.length === 0 ? (
                <p>You haven't purchased any courses yet.</p>
            ) : (
                <div className="course-grid">
                    {courses.map((course) => (
                        <div key={course.id} className="course-card">
                            <img src={course.thumbnail_url} alt={course.title} />
                            <h3>{course.title}</h3>
                            <p>{course.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
