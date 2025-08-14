import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import App from "./App.tsx"; // AddCourse form
import Home from "./pages/Home.tsx";
import CourseDetails from "./pages/CourseDetails.tsx";
import Register from "./pages/Register.tsx";
import Login from "./pages/Login.tsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";

import { Toaster } from "sonner";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>

    <Navbar />
    {/* ✅ Sonner Toaster for notifications */}
    <Toaster position="top-right" richColors />

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add-course" element={<App />} />
      <Route path="/course/:id" element={<CourseDetails />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
    </Routes>
  </BrowserRouter>
);
