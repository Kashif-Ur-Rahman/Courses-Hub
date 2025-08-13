import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseById } from "../services/courses";

interface Material {
    id: number;
    fileName: string;
    url: string;
}

export default function CourseDetails() {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<any>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            const courseId = Number(id);

            // Fetch course details
            getCourseById(courseId)
                .then((data) => setCourse(data))
                .catch(() => setError("Failed to load course"))
                .finally(() => setLoading(false));

            // Fetch course materials for enrolled users
            const token = localStorage.getItem("token");
            if (token) {
                fetch(`http://localhost:5000/courses/${courseId}/materials`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => {
                        if (!res.ok) throw new Error("You must purchase this course to access materials");
                        return res.json();
                    })
                    .then((data: Material[]) => setMaterials(data))
                    .catch((err: any) => console.log(err.message));
            }
        }
    }, [id]);

    const handlePurchase = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("You must be logged in to make a purchase");

            const res = await fetch(
                "http://localhost:5000/api/payments/checkout/create-session",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ courseId: course.id }),
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create checkout session");
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe checkout
            }
        } catch (err: any) {
            alert(err.message || "Payment failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="course-details">Loading...</div>;
    if (error) return <div className="course-details">{error}</div>;
    if (!course) return <div className="course-details">Course not found</div>;

    return (
        <div className="course-details">
            <h1 className="course-title">{course.title}</h1>
            <p className="course-price">Price: ${course.price.toFixed(2)}</p>
            <p className="course-instructor">Instructor: {course.instructor.name}</p>
            <p className="course-created">
                Created At: {new Date(course.createdAt).toLocaleDateString()}
            </p>

            <button
                className="btn-pay"
                onClick={handlePurchase}
                disabled={processing}
            >
                {processing ? "Processing..." : "Purchase / View Course"}
            </button>

            <button className="btn-live">Join Live Stream</button>

            {/* Display course materials if available */}
            {materials.length > 0 && (
                <div className="course-materials">
                    <h2>Course Materials:</h2>
                    <ul>
                        {materials.map((mat) => (
                            <li key={mat.id}>
                                <a href={mat.url} target="_blank" rel="noopener noreferrer">
                                    {mat.fileName}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
