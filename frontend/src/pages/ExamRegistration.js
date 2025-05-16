import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const ExamRegistration = () => {
  const [regularSubjects, setRegularSubjects] = useState([]);
  const [arrearSubjects, setArrearSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [studentInfo, setStudentInfo] = useState(null);

  const studentId = localStorage.getItem("studentId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentId) {
          setMessage({ text: "User not logged in!", type: "error" });
          navigate("/login");
          return;
        }

        const [subjectRes, studentRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/exams/subjects/${studentId}`),
          axios.get(`http://localhost:5000/api/student/${studentId}`),
        ]);

        setRegularSubjects(subjectRes.data.regularSubjects || []);
        setArrearSubjects(subjectRes.data.arrearSubjects || []);
        setStudentInfo(studentRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ text: "Error fetching data", type: "error" });
      }
    };
    fetchData();
  }, [studentId, navigate]);

  const validateForm = () => {
    if (!studentInfo) return "No student data found!";
    if (studentInfo.attendance < 75)
      return "Attendance must be at least 75% to register!";
    if (!studentInfo.feesPaid) return "Fees must be paid before registering.";
    if (regularSubjects.length + arrearSubjects.length === 0)
      return "No subjects available for registration.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validateForm();
    if (errorMessage) {
      setMessage({ text: errorMessage, type: "error" });
      return;
    }

    setLoading(true);

    const allSubjects = [...regularSubjects, ...arrearSubjects];

    const data = {
      studentId,
      subjects: allSubjects.map((sub) => sub._id),
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/exams/register-exam",
        data
      );

      setMessage({ text: res.data.message, type: "success" });
      navigate("/hall-ticket"); // After successful registration
    } catch (err) {
      setMessage({ text: "Error registering for the exam", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderSubjectsTable = (subjects, title) => (
    <>
      <Typography variant="h6" style={{ marginTop: 20, marginBottom: 10 }}>
        {title}
      </Typography>
      {subjects.length > 0 ? (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow
                style={{
                  fontWeight: "bold",
                }}
              >
                <TableCell
                  align="center"
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  S.No
                </TableCell>
                <TableCell
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  Subject Code
                </TableCell>
                <TableCell
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  Subject Name
                </TableCell>
                <TableCell
                  align="right"
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  Cost (₹)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject, index) => (
                <TableRow key={subject._id}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell>{subject.code}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell align="right">{subject.fees}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="textSecondary">No subjects available.</Typography>
      )}
    </>
  );

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: 20, marginTop: 30 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Exam Registration
        </Typography>

        {message.text && (
          <Alert severity={message.type} style={{ marginBottom: 10 }}>
            {message.text}
          </Alert>
        )}

        {studentInfo && (
          <div style={{ marginBottom: 20 }}>
            <Typography variant="h6">
              📊 Attendance: {studentInfo.attendance}%
            </Typography>
            <Typography variant="h6">
              💰 Fees Paid: {studentInfo.feesPaid ? "✅ Yes" : "❌ No"}
            </Typography>
          </div>
        )}

        {renderSubjectsTable(regularSubjects, "📚 Regular Subjects")}
        {renderSubjectsTable(arrearSubjects, "📚 Arrear Subjects")}

        <form onSubmit={handleSubmit}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            style={{ marginTop: 30 }}
          >
            {loading
              ? "Submitting registration..."
              : "📝 Register All Subjects"}
            {loading && (
              <CircularProgress size={24} style={{ marginLeft: 10 }} />
            )}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default ExamRegistration;
