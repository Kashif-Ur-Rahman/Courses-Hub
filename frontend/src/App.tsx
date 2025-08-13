import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";


type User = {
  id: number;
  name: string;
  email: string;
};

function App() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("http://localhost:5000/users");
        if (!res.ok) {
          console.error("Failed to load instructors");
          return;
        }

        const data: User[] = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load instructors", error);
      }
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: parseFloat(price),
          instructorId: parseInt(instructorId, 10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Error: ${err.error || "Failed to create course"}`);
        return;
      }

      const data = await res.json();
      toast.success(`Course created! ID: ${data.id}`);

      setTitle("");
      setPrice("");
      setInstructorId("");
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };
  return (
    <div className="container">
      <Toaster position="top-center" richColors />
      <div className="card">
        <h1>Create a Course</h1>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter course title" required />

          <label>Price</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price in USD" required />

          <label>Instructor</label>
          <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} required>
            <option value="">-- Select an instructor --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <button type="submit">Add Course</button>
        </form>
      </div>
    </div>

  );
}

export default App;