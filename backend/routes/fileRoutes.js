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

// ✅ Upload & Process CSV/XLSX File
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`📂 Uploaded File: ${req.file.originalname}`);
    console.log(`📊 Detected Sheet Name: ${sheetName}`);
    console.log(`📌 Upload Type:`, req.body.uploadType);
    console.log(`📄 First 5 Rows:`, data.slice(0, 5));

    let processed = false;
    const uploadType = req.body.uploadType.toLowerCase();

    if (uploadType === "student_list") {
      console.log("📌 Processing Student List...");
      await processStudentData(data);
      processed = true;
    } else if (uploadType === "arrear_list") {
      console.log("📌 Processing Arrear List...");
      await processArrearData(data);
      processed = true;
    } else if (uploadType === "attendance") {
      console.log("📌 Processing Attendance & Fees...");
      await processAttendanceAndFeesData(data);
      processed = true;
    } else if (uploadType === "subjectname") {
      console.log("📌 Processing Subject List...");
      await processSubjectData(data);
      processed = true;
    }

    if (!processed) {
      console.log("⚠️ Unknown file type. Skipping...");
      return res
        .status(400)
        .json({ message: "Invalid upload type or incorrect sheet name" });
    }

    fs.removeSync(filePath);
    res.status(200).json({ message: "✅ File processed successfully!" });
  } catch (error) {
    console.error("❌ Error processing file:", error);
    res
      .status(500)
      .json({ message: "Error processing file", error: error.message });
  }
});

// ✅ Process Student Data
const processStudentData = async (data) => {
  console.log("🔹 Processing Student List...");
  for (const row of data) {
    console.log(`➡️ Checking Student: ${row.Name} - ${row["Reg no"]}`);

    const existingStudent = await Student.findOne({
      $or: [{ regNumber: row["Reg no"] }, { email: row.Email }],
    });

    if (!existingStudent) {
      console.log(`✅ Inserting Student: ${row.Name} - ${row["Reg no"]}`);
      await Student.create({
        regNumber: row["Reg no"],
        name: row.Name,
        email: row.Email,
        department: row.Dep,
        semester: row.Sem,
        attendance: 0,
        feesPaid: false,
        arrears: [],
      });
    } else {
      console.log(
        `⚠️ Student ${row["Reg no"]} or Email ${row.Email} already exists. Skipping...`
      );
    }
  }
};

// ✅ Process Arrear Data
const processArrearData = async (data) => {
  console.log("🔹 Processing Arrear List...");
  for (const row of data) {
    console.log(`➡️ Processing Arrears for ${row.Name} - ${row["Reg no"]}`);
    const arrearSubjects = row["Arrear sub"].split(",");

    await Student.updateOne(
      { regNumber: row["Reg no"] },
      { $set: { arrears: arrearSubjects } }
    );

    await Arrear.create({
      regNumber: row["Reg no"],
      name: row.Name,
      department: row.Dep,
      semester: row.Sem,
      arrears: arrearSubjects,
    });

    console.log(
      `✅ Inserted Arrear for ${row.Name} - ${arrearSubjects.join(", ")}`
    );
  }
};

// ✅ Process Subject Data
const processSubjectData = async (data) => {
  console.log("🔹 Processing Subject List...");

  // this is the data that need to put into the table
  for (const row of data) {
    console.log(
      `➡️ Processing Subject: ${row["Subject Name"]} (${row["Subject Code"]})`
    );
    const existingSubject = await Subject.findOne({
      code: row["Subject Code"],
    });

    if (!existingSubject) {
      await Subject.create({
        code: row["Subject Code"],
        name: row["Subject Name"],
        department: row["Dept"],
        semester: row["Sem"],
        fees: row["Cost"],
      });
      console.log(`✅ Inserted Subject: ${row["Subject Name"]}`);
    } else {
      console.log(
        `⚠️ Subject ${row["Subject Code"]} already exists. Skipping...`
      );
    }
  }
};

// ✅ Process Attendance & Fees Data
const processAttendanceAndFeesData = async (data) => {
  console.log("🔹 Processing Attendance & Fees Status...");
  for (const row of data) {
    console.log(`➡️ Processing Attendance for ${row.Name} - ${row["Reg no"]}`);

    const feesPaid = row["Fees Status"].toLowerCase() === "paid";

    const studentUpdate = await Student.updateOne(
      { regNumber: row["Reg no"] },
      { $set: { attendance: row.Percentage, feesPaid } }
    );

    if (studentUpdate.matchedCount > 0) {
      console.log(
        `✅ Student ${row["Reg no"]} updated with Attendance: ${row.Percentage}%`
      );
    } else {
      console.log(`⚠️ Student ${row["Reg no"]} not found. Skipping update.`);
    }

    await Attendance.create({
      regNumber: row["Reg no"],
      name: row.Name,
      department: row.Dep,
      semester: row.Sem,
      email: row.Email,
      percentage: row.Percentage,
      feesPaid,
    });

    console.log(`✅ Attendance Inserted for ${row.Name} - ${row.Percentage}%`);
  }
};

module.exports = router;
