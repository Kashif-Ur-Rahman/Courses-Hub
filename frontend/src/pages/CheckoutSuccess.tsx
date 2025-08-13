// src/pages/CheckoutSuccess.tsx
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function CheckoutSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            // Optional: verify session with backend
            fetch(`http://localhost:5000/api/payments/verify-session/${sessionId}`)
                .then(res => res.json())
                .then(data => console.log("Session verified:", data))
                .catch(err => console.error(err));
        }
    }, [sessionId]);

    return (
        <div>
            <h1>Payment Successful ✅</h1>
            <p>Your course is now available in your account.</p>
        </div>
    );
}
