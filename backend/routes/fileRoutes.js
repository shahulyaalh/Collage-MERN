const express = require("express");
const XLSX = require("xlsx");
const fs = require("fs-extra");
const path = require("path");
const upload = require("../middleware/upload");

const Student = require("../models/Student");
const Arrear = require("../models/Arrear");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

const router = express.Router();

// 🔧 Normalize keys in row object
const normalizeKeys = (row) => {
  const normalized = {};
  for (const key in row) {
    normalized[key.trim().toLowerCase()] = row[key];
  }
  return normalized;
};

// ✅ File Upload Route
router.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;
  const fileType = path.extname(req.file?.originalname || "").toLowerCase();
  const validExtensions = [".xlsx", ".xls", ".csv"];

  if (!filePath || !validExtensions.includes(fileType)) {
    if (filePath) fs.removeSync(filePath);
    return res.status(400).json({ message: "Invalid or missing file" });
  }

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const data = rawData.map(normalizeKeys);

    const uploadType = req.body.uploadType?.trim().toLowerCase();
    console.log(`📂 File: ${req.file.originalname}`);
    console.log(`📊 Sheet: ${sheetName}`);
    console.log(`📌 Type: ${uploadType}`);
    console.log(`📝 Sample:`, data.slice(0, 3));

    let result;

    switch (uploadType) {
      case "student_list":
        result = await processStudentData(data);
        break;
      case "arrear_list":
        result = await processArrearData(data);
        break;
      case "attendance":
        result = await processAttendanceAndFeesData(data);
        break;
      case "subjectname":
        result = await processSubjectData(data);
        break;
      default:
        fs.removeSync(filePath);
        return res.status(400).json({ message: "Invalid upload type" });
    }

    fs.removeSync(filePath);
    res.status(200).json({
      message: "✅ File processed successfully!",
      summary: result,
    });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.removeSync(filePath);
    console.error("❌ File processing error:", error);
    res
      .status(500)
      .json({ message: "Error processing file", error: error.message });
  }
});

// ✅ Student Data Processor
const processStudentData = async (data) => {
  let inserted = 0,
    skipped = 0;
  for (const row of data) {
    const reg = row["reg no"];
    const email = row["email"];
    if (!reg || !row["name"]) continue;

    const exists = await Student.findOne({
      $or: [{ regNumber: reg }, { email }],
    });

    if (!exists) {
      await Student.create({
        regNumber: reg,
        name: row["name"],
        email,
        department: row["dep"] || row["department"],
        semester: row["sem"],
        attendance: 0,
        feesPaid: false,
        arrears: [],
        createdAt: new Date(),
      });
      inserted++;
    } else {
      skipped++;
    }
  }
  return { inserted, skipped };
};

// ✅ Arrear Data Processor
const processArrearData = async (data) => {
  let inserted = 0;
  for (const row of data) {
    const reg = row["reg no"];
    const arrearSubjects = (row["arrear sub"] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await Student.updateOne(
      { regNumber: reg },
      { $set: { arrears: arrearSubjects } }
    );

    await Arrear.create({
      regNumber: reg,
      name: row["name"],
      department: row["dep"] || row["department"],
      semester: row["sem"],
      arrears: arrearSubjects,
      createdAt: new Date(),
    });

    inserted++;
  }
  return { inserted };
};

// ✅ Subject Data Processor
const processSubjectData = async (data) => {
  let inserted = 0,
    skipped = 0;
  for (const row of data) {
    const code = row["subject code"];
    if (!code) continue;

    const exists = await Subject.findOne({ subjectCode: code });
    if (!exists) {
      await Subject.create({
        subjectCode: code,
        subjectName: row["subject name"],
        department: row["dept"] || row["department"],
        semester: row["sem"],
        cost: row["cost"],
        createdAt: new Date(),
      });
      inserted++;
    } else {
      skipped++;
    }
  }
  return { inserted, skipped };
};

// ✅ Attendance & Fees Data Processor
const processAttendanceAndFeesData = async (data) => {
  let inserted = 0,
    updated = 0;
  for (const row of data) {
    const reg = row["reg no"];
    const feesPaid = row["fees status"]?.toLowerCase() === "paid";
    const percentage = row["percentage"];

    const studentUpdate = await Student.updateOne(
      { regNumber: reg },
      { $set: { attendance: percentage, feesPaid } }
    );
    if (studentUpdate.matchedCount > 0) updated++;

    await Attendance.create({
      regNumber: reg,
      name: row["name"],
      department: row["dep"] || row["department"],
      semester: row["sem"],
      email: row["email"],
      percentage,
      feesPaid,
      createdAt: new Date(),
    });

    inserted++;
  }
  return { inserted, updated };
};

// ✅ Delete All Uploaded Data & Files
router.delete("/delete-all", async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../uploads");
    if (fs.existsSync(uploadDir)) {
      fs.emptyDirSync(uploadDir);
      console.log("🧹 Uploads cleared");
    }

    const [students, arrears, subjects, attendance] = await Promise.all([
      Student.deleteMany({}),
      Arrear.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
    ]);

    console.log(`🗑️ Students: ${students.deletedCount}`);
    console.log(`🗑️ Arrears: ${arrears.deletedCount}`);
    console.log(`🗑️ Subjects: ${subjects.deletedCount}`);
    console.log(`🗑️ Attendance: ${attendance.deletedCount}`);

    res
      .status(200)
      .json({ message: "✅ All uploaded data deleted successfully!" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete data", error: error.message });
  }
});

module.exports = router;
