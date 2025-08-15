# Online Courses Platform

A full-stack web application for browsing, purchasing, and accessing online courses.  
Built with **React**, **Node.js**, **Express**, **PostgreSQL**, and integrated with **Stripe** for secure payment processing.

## 🚀 Features
- 🔐 User registration and login (JWT authentication)
- 🎥 Browse courses with detailed descriptions
- 💳 Secure payments with Stripe Checkout
- 📦 Access purchased course materials instantly
- 🛡️ Protected API routes for authorized users only

## 🛠️ Tech Stack
**Frontend:** React, Axios, TailwindCSS  
**Backend:** Node.js, Express, PostgreSQL  
**Payments:** Stripe API & Webhooks  
**Authentication:** JWT & bcrypt

## 📂 Project Structure

online-courses/

├── backend/ # Express API & Stripe integration

│ ├── src/

│ ├── .env

│ └── package.json

├── frontend/ # React client application

│ ├── src/

│ ├── package.json

└── README.md


## ⚙️ Installation

### 1️⃣ Clone the repository

git clone https://github.com/YOUR-USERNAME/online-courses.git

cd online-courses

2️⃣ Backend Setup

cd backend

npm install

stripe.exe listen --forward-to localhost:5000/api/payments/webhooks/stripe

npm run dev

3️⃣ Frontend Setup

cd ./frontend

npm install

npm run dev

🔑 Environment Variables

Backend .env file example:

PORT=5000

JWT_SECRET=your-secret

STRIPE_SECRET_KEY=sk_test_xxx

STRIPE_WEBHOOK_SECRET=whsec_xxx

CLIENT_URL= http://localhost:5173/

🧪 Stripe Test Payments

Use the following test card to simulate payments:

Card Number: 4242 4242 4242 4242

Expiry Date: Any future date

CVC: Any 3 digits

ZIP: Any 5 digits
