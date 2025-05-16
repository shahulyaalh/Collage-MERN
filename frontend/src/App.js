import React from "react";
import { Routes, Route } from "react-router-dom"; // ✅ No BrowserRouter here
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import HallTicket from "./pages/HallTicket";
import AdminDashboard from "./pages/AdminDashboard";
import ExamRegistration from "./pages/ExamRegistration"; // ✅ Added Exam Registration
import AddSubjects from "./pages/AddSubjects";
import ExamUpdate from "./pages/ExamUpdate"; // ✅ Import ExamUpdate.js

const Home = () => (
  <div
    style={{
      backgroundImage: "url('/bg-clg.jpeg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <h1
      style={{
        color: "black",
        textAlign: "initial",
        position: "absolute",
        marginBottom: "30px",
      }}
    >
      Welcome to Hall Ticket System
    </h1>
  </div>
);

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/hall-ticket" element={<HallTicket />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/exam-registration" element={<ExamRegistration />} />{" "}
        {/* ✅ New Route */}
        <Route path="/exam-update" element={<ExamUpdate />} />{" "}
        {/* ✅ Added Exam Update Route */}
      </Routes>
    </>
  );
}

export default App;
