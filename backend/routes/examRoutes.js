const express = require("express");
const router = express.Router();

const { registerForExam } = require("../controllers/examController");
const {
  sendHallTicket,
  getSubjects,
} = require("../controllers/hallTicketController");

// ✅ Register for exam
router.post("/register-exam", registerForExam);

// ✅ Send hall ticket via email
router.post("/send-hallticket", sendHallTicket);

router.get("/subjects/:id", getSubjects);

module.exports = router;
