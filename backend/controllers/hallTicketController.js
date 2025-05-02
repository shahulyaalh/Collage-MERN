const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Arrear = require("../models/Arrear");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ✅ Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Controller: Send Hall Ticket
exports.sendHallTicket = async (req, res) => {
  try {
    const { studentId } = req.body;
    console.log(`📩 Request to send Hall Ticket for Student ID: ${studentId}`);

    if (!studentId) {
      return res.status(400).json({ message: "❌ Student ID is required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "❌ Student not found" });
    }

    let exam = await Exam.findOne({ studentId });
    if (!exam) {
      const subjects = await Subject.find({
        semester: student.semester,
        department: student.department,
      });

      if (!subjects.length) {
        return res
          .status(400)
          .json({ message: "❌ No subjects found for this student" });
      }

      exam = new Exam({
        studentId,
        subjects: subjects.map((sub) => sub._id),
      });
      await exam.save();
    }

    const regularSubjects = await Subject.find({
      _id: { $in: exam.subjects },
    })
      .select("subjectName subjectCode examSchedule")
      .lean();

    const arrearSubjects = [];
    const arrearData = await Arrear.findOne({ regNumber: student.regNumber });

    if (arrearData?.arrears?.length) {
      const matchedArrears = await Subject.find({
        subjectCode: { $in: arrearData.arrears },
      })
        .select("subjectName subjectCode examSchedule")
        .lean();
      arrearSubjects.push(...matchedArrears);
    }

    if (!regularSubjects.length && !arrearSubjects.length) {
      return res
        .status(404)
        .json({ message: "❌ No subjects found for this student" });
    }

    const allSubjects = [
      ...regularSubjects.map((sub) => ({
        name: sub.subjectName,
        code: sub.subjectCode,
        examSchedule: sub.examSchedule || "Not Scheduled",
        type: "Regular",
      })),
      ...arrearSubjects.map((sub) => ({
        name: sub.subjectName,
        code: sub.subjectCode,
        examSchedule: sub.examSchedule || "Not Scheduled",
        type: "Arrear",
      })),
    ];

    // ✅ Create PDF
    const doc = new PDFDocument();
    const fileName = `hall_ticket_${studentId}.pdf`;
    const filePath = `./uploads/${fileName}`;
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);

    // ✅ Add college logo/header image
    const headerImagePath = path.join(
      __dirname,
      "../asset/college_navbar.jpeg"
    );
    if (fs.existsSync(headerImagePath)) {
      doc.image(headerImagePath, {
        fit: [500, 100],
        align: "center",
        valign: "top",
      });
    }
    doc.moveDown(1);

    // ✅ Add Student Info
    doc.fontSize(16).text(`Hall Ticket`, { align: "center", underline: true });
    doc.moveDown(1);
    doc.fontSize(12).text(`Name: ${student.name}`);
    doc.text(`Register Number: ${student.regNumber}`);
    doc.text(`Department: ${student.department}`);
    doc.text(`Semester: ${student.semester}`);
    doc.moveDown(1);

    // ✅ Add Subjects Table
    doc.fontSize(12).text("Subjects to Write:", { underline: true });
    doc.moveDown(0.5);

    // Table Header
    doc
      .font("Helvetica-Bold")
      .text("Subject Name", 50, doc.y, { width: 150 })
      .text("Subject Code", 200, doc.y, { width: 100 })
      .text("Subject Type", 300, doc.y, { width: 100 })
      .text("Exam Schedule", 400, doc.y, { width: 150 });
    doc.moveDown(0.5);

    // Line after headers
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Content
    doc.font("Helvetica");
    allSubjects.forEach((sub) => {
      doc
        .text(sub.name, 50, doc.y, { width: 150 })
        .text(sub.code, 200, doc.y, { width: 100 })
        .text(sub.type, 300, doc.y, { width: 100 })
        .text(sub.examSchedule, 400, doc.y, { width: 150 });
      doc.moveDown(0.5);
    });

    // ✅ Attendance and Fees
    doc.moveDown(1);
    doc.text(`Attendance: ${student.attendance}%`, { continued: true });
    doc.text(`   Fees Paid: ${student.feesPaid ? " Yes" : " No"}`);
    doc.end();

    // ✅ Send Email
    fileStream.on("finish", async () => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: "🎟️ Your Hall Ticket",
        text: `Hello ${student.name},\n\nYour hall ticket is ready. Please find the attached PDF.\n\nGood luck!\nExam Department`,
        attachments: [{ filename: fileName, path: filePath }],
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${student.email}`);
        res.json({ message: "📩 Hall Ticket sent successfully!" });
      } catch (error) {
        console.error("❌ Email sending failed:", error);
        res
          .status(500)
          .json({ message: "❌ Failed to send email", error: error.message });
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) console.error("❌ Failed to delete PDF:", err);
        });
      }
    });
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    res.status(500).json({
      message: "❌ Error sending Hall Ticket",
      error: error.message,
    });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    let studentId = req.params.id;

    // Fetch the student
    let student = await Student.findById(studentId); // Use findById for cleaner access
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    console.log(student);

    let semester = student.semester;
    let dept = student.department;
    let arrears = student.arrears;

    // Fetch regular subjects based on semester and department (assuming schema includes dept)
    const regularSubjects = await Subject.find({
      semester: semester,
      department: dept,
    });

    console.log(regularSubjects);

    // Fetch arrear subjects based on subject codes
    const arrearSubjects = await Subject.find({
      subjectCode: { $in: arrears },
    });

    console.log(arrearSubjects);

    // Combine both
    // const allSubjects = [...regularSubjects, ...arrearSubjects];

    // console.log(allSubjects);

    res.json({ regularSubjects, arrearSubjects });
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    res.status(500).json({
      message: "❌ Error sending Hall Ticket",
      error: error.message,
    });
  }
};
