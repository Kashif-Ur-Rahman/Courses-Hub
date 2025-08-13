import { useEffect, useState } from "react";
import { getCourses } from "../services/courses";
import CourseCard from "../components/CourseCard";
import "./Home.css";

export default function Home() {
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        getCourses()
            .then(setCourses)
            .catch(console.error);
    }, []);

    return (
        <div className="home-container">
            <h1 className="home-title">Available Courses</h1>
            <div className="courses-grid">
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
}
