# 🚌 BusTick Pro: Final Year Full-Stack Project

Welcome to the **upgraded** Bus Reservation and Ticketing System! This project has been transformed from a single-file console application into a modern, **full-stack architecture** suitable for an academic final year project.

---

## 🏗️ Architecture Overview
The system follows the **Client-Server Architecture** with a clear separation of concerns:

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | Modern, interactive UI with glassmorphism and animations. |
| **Backend** | Spring Boot 3.2.x | RESTful API managing business logic, fares, and bookings. |
| **Database** | H2 (InMemory) | Relational storage for Buses, Routes, and Transactions. |
| **Styling** | Vanilla CSS (Premium) | Custom CSS design for a futuristic, "WOW" user experience. |

---

## ✨ Key Features
- 🔐 **Secure Auth Mockup**: Login using `admin/admin` (based on original system logic).
- 📊 **Dynamic Dashboard**: View real-time stats like total bookings and simulated revenue.
- 🗺️ **Interactive Destination Selection**: Visual pickers with fare and seat availability.
- 💺 **Seat Map Visualization**: Real-time seat selection (select exactly which seat you want!).
- 🎟️ **Automated Fare Calculation**: Supports **Student, PWD, and Senior Citizen** discounts (20% off).
- 🧾 **Transaction History**: Track all payments with unique IDs and "Paid" statuses.
- 🎨 **Premium UI/UX**: Dark mode by default, glassmorphic cards, and smooth transitions using **Framer Motion**.

---

## 🚀 How to Run the Project

### 1. Backend (Spring Boot)
1. Ensure **Java 21** or later is installed.
2. Navigate to `backend/` directory.
3. Run using Maven Wrapper (or your IDE):
   ```bash
   mvn spring-boot:run
   ```
4. API will be available at `http://localhost:8080`.
5. H2 Database Console available at `http://localhost:8080/h2-console`.

### 2. Frontend (React)
1. Ensure **Node.js** is installed.
2. Navigate to `frontend/` directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 📁 Updated Project Structure
```bash
Bus Ticketing System/
├── backend/                # Spring Boot Project
│   ├── src/main/java/      # API, Model, Repo, Config
│   ├── src/main/resources/ # application.properties (DB config)
│   └── pom.xml             # Dependencies (JPA, Web, H2, Lombok)
├── frontend/               # React Vite Project
│   ├── src/App.tsx         # Main Dashboard & Booking Logic
│   ├── src/index.css       # Premium Styling
│   └── package.json        # Frontend dependencies
└── BusReservationAndTicketingSystem.java # Original Source (Reference)
```

> [!TIP]
> This project is designed to be highly extensible. You can easily add **PDF generation** for tickets or integrate a real **payment gateway** (like Stripe or Razorpay) for your final presentation!
