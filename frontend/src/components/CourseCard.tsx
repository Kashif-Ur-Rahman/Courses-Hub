import { Link } from "react-router-dom";
import "./CourseCard.css";

type Course = {
    id: number;
    title: string;
    price: number;
    instructor: {
        name: string;
        email: string;
    };
};

type Props = {
    course: Course;
};

export default function CourseCard({ course }: Props) {
    return (
       <div className="course-card">
            <h2 className="course-card-title">{course.title}</h2>
            <p className="course-card-price">${course.price.toFixed(2)}</p>
            <p className="course-card-instructor">{course.instructor.name}</p>
            <Link to={`/course/${course.id}`} className="btn-view">
                View Course
            </Link>
        </div>
    );
}
