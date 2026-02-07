const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const sequelize = require("./config/database");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const fileUpload = require("express-fileupload");
const userRoutes = require("./routes/userRoutes");
const instituteRoutes = require("./routes/instituteRoutes");
const studentRoutes = require("./routes/studentRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const mapRoutes = require("./routes/mapRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const mapAssignmentRoutes = require("./routes/mapAssignmentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const publicRoutes = require("./routes/publicRoutes");
const profileRoutes = require("./routes/profileRoutes");
const formRoutes = require("./routes/formRoutes");
const emailTemplateRoutes = require("./routes/emailRoutes");
const classRoutes = require("./routes/classRoutes");
const individualRoutes = require("./routes/individualRoutes");

const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 150 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    responseOnLimit: "File size limit has been reached",
  }),
);
app.use(express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/mapAssignment", mapAssignmentRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/form", formRoutes);
app.use("/api/emailTemplate", emailTemplateRoutes);
app.use("/api/class", classRoutes);
app.use("/api/individual", individualRoutes);

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Sync Database and Start Server
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected successfully.");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
