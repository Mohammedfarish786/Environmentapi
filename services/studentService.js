const User = require("../models/User");
const Student = require("../models/Student");
const Instructor = require("../models/Instructor");
const Class = require("../models/class");
const CourseInstitute = require("../models/CourseInstitute");
const Institute = require("../models/Institute");
const Course = require("../models/course");
const UserService = require("../services/userService");
const { Op, where } = require("sequelize");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const { sequelize } = require("../models");

class StudentService {
  constructor() {
    if (StudentService.instance) {
      return StudentService.instance;
    }
    StudentService.instance = this;
    return this;
  }
  async getAllStudent(roleId, userId, page, limit) {
    try {
      const isPaginated = page && limit;
      const offset = isPaginated ? (page - 1) * limit : null;

      const include = [
        /* 👤 Student User */
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "username",
            "email",
            "mobileNo",
            "is_active",
          ],
          where: { roleId: 5 },
          required: true,
        },

        /* 🏫 Institute */
        {
          model: Institute,
          as: "institute",
          attributes: ["id", "name", "institute_code", "institute_type"],
          required: false,
        },
      ];

      /* 🏫 Institute Admin Filter */
      if (roleId === 3) {
        const admin = await User.findByPk(userId, {
          attributes: ["institute_id"],
        });

        if (admin?.institute_id) {
          // Filter students of same institute
          include[1].where = { id: admin.institute_id };
          include[1].required = true;
        }
      }

      /* 👨‍🏫 Instructor Filter */
      if (roleId === 4) {
        const instructor = await Instructor.findOne({
          where: { user_id: userId },
          attributes: ["id"],
        });

        if (!instructor) return { total: 0, data: [] };

        const assignments = await CourseInstitute.findAll({
          where: { instructor_id: instructor.id },
          attributes: ["class_id"],
        });

        const classIds = assignments.map((a) => a.class_id);

        if (!classIds.length) return { total: 0, data: [] };

        include.push({
          model: Class,
          as: "class",
          attributes: [],
          where: { id: classIds },
          required: true,
        });
      }

      /* 📦 Final Query */
      const { count, rows } = await Student.findAndCountAll({
        attributes: ["id", "user_id", "institute_id", "created_at"],
        include,
        limit: isPaginated ? limit : undefined,
        offset: isPaginated ? offset : undefined,
        order: [["created_at", "DESC"]],
      });

      return {
        total: count,
        data: rows,
      };
    } catch (error) {
      console.error("getAllStudent error:", error);
      throw error;
    }
  }

  async getStudentById(id, roleId, userId) {
    try {
      const include = [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "mobileNo",
            "is_active",
            "avatar",
          ],
          where: { roleId: 5 }, // student users only
          required: true,
        },
        {
          model: Class,
          as: "class",
          attributes: ["id", "class_name", "grade", "section"],
        },
      ];

      /* 🏫 Institute Admin */
      if (roleId === 3) {
        const user = await User.findByPk(userId, {
          attributes: ["institute_id"],
        });

        if (user?.institute_id) {
          include[0].where.institute_id = user.institute_id;
        }
      }

      /* 👨‍🏫 Instructor */
      if (roleId === 4) {
        const instructor = await Instructor.findOne({
          where: { user_id: userId },
          attributes: ["id"],
        });

        if (!instructor) return null;

        const assignments = await CourseInstitute.findAll({
          where: { instructor_id: instructor.id },
          attributes: ["class_id"],
        });

        const classIds = assignments.map((a) => a.class_id);

        if (!classIds.length) return null;

        // Filter students by instructor classes
        include.push({
          model: Class,
          as: "class",
          where: { id: classIds },
          attributes: [],
          required: true,
        });
      }

      /* 🔎 Fetch by user_id instead of PK */
      const student = await Student.findOne({
        where: { user_id: id },
        include,
      });

      return student;
    } catch (error) {
      console.error("getStudentById error:", error);
      throw error;
    }
  }

  async updateApproval(id, status) {
    const user = await User.findByPk(id);
    await user.update({
      approval_status: status,
      is_active: status === "approved" ? 1 : 0,
    });
    return user;
  }
  async createStudent(studentData, adminUser) {
    try {
      // ================= VALIDATE REQUIRED FIELDS =================
      if (!studentData.class_id) {
        throw Object.assign(new Error("class_id is required for student"), {
          status: 400,
        });
      }
      const instituteId = await User.findByPk(adminUser.id, {
        attributes: ["institute_id"],
      });

      // ================= VALIDATE CLASS =================
      const classObj = await Class.findByPk(studentData.class_id);

      if (!classObj) {
        throw Object.assign(new Error("Invalid class_id"), { status: 400 });
      }

      // Institute admin safety (optional but recommended)
      if (
        adminUser &&
        adminUser.roleId === 3 &&
        classObj.institute_id !== instituteId.institute_id
      ) {
        throw Object.assign(
          new Error("Class does not belong to your institute"),
          { status: 403 },
        );
      }
      // ================= BUILD PAYLOAD FOR addUser =================
      const userPayload = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        password: studentData.password || "Student@123",
        mobileNo: studentData.mobileNo,
        roleId: 5, // STUDENT
        institute_id: classObj.institute_id,
        avatar: studentData.avatar || null,
        // 👇 Student-specific fields (USED INSIDE addUser)
        class_id: studentData.class_id,
        course_id: studentData.course_id || null,
        roll_number: studentData.roll_number || null,
        parent_name: studentData.parent_name,
        parent_phone: studentData.parent_phone,
        parent_email: studentData.parent_email || null,
        address: studentData.address,
        date_of_birth: studentData.date_of_birth || null,
        blood_group: studentData.blood_group || null,
      };

      // ================= CREATE USER + STUDENT =================
      const newUser = await UserService.addUser(userPayload, adminUser);

      return newUser;
    } catch (error) {
      console.error("Error creating student via addUser:", error.message);
      throw error;
    }
  }
  async updateStudent(studentId, payload, roleId, adminUserId) {
    const t = await sequelize.transaction();

    try {
      // ================= FETCH STUDENT =================
      const student = await Student.findByPk(studentId, {
        include: [
          { model: User, as: "user" },
          { model: Institute, as: "institute" },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // ================= INSTITUTE ADMIN SCOPE =================
      if (roleId === 3) {
        const admin = await User.findByPk(adminUserId, {
          attributes: ["institute_id"],
          transaction: t,
        });

        if (!admin || admin.institute_id !== student.institute_id) {
          throw new Error(
            "Unauthorized: Student does not belong to your institute",
          );
        }
      }

      // ================= SPLIT PAYLOAD =================
      const userFields = {};
      const studentFields = {};

      // -------- USER FIELDS --------
      const allowedUserFields = [
        "firstName",
        "lastName",
        "username",
        "email",
        "mobileNo",
        "is_active",
      ];

      for (const key of allowedUserFields) {
        if (payload[key] !== undefined) {
          userFields[key] = payload[key];
        }
      }

      // -------- STUDENT FIELDS --------
      const allowedStudentFields = [
        "class_id",
        "course_id",
        "roll_number",
        "parent_name",
        "parent_phone",
        "parent_email",
        "address",
        "date_of_birth",
        "blood_group",
      ];

      for (const key of allowedStudentFields) {
        if (payload[key] !== undefined) {
          studentFields[key] = payload[key];
        }
      }

      // ================= VALIDATIONS =================

      // Email uniqueness
      if (userFields.email) {
        const emailExists = await User.findOne({
          where: { email: userFields.email },
          transaction: t,
        });

        if (emailExists && emailExists.id !== student.user_id) {
          throw new Error("Email already in use");
        }
      }

      // Mobile uniqueness
      if (userFields.mobileNo) {
        const mobileExists = await User.findOne({
          where: { mobileNo: userFields.mobileNo },
          transaction: t,
        });

        if (mobileExists && mobileExists.id !== student.user_id) {
          throw new Error("Mobile number already in use");
        }
      }

      // Class validation
      if (studentFields.class_id) {
        const classExists = await Class.findByPk(studentFields.class_id, {
          transaction: t,
        });

        if (!classExists) {
          throw new Error("Invalid class selected");
        }

        // Ensure same institute
        if (classExists.institute_id !== student.institute_id) {
          throw new Error("Class does not belong to student's institute");
        }
      }

      // ================= UPDATE USER =================
      if (Object.keys(userFields).length > 0) {
        await student.user.update(userFields, { transaction: t });
      }

      // ================= UPDATE STUDENT =================
      if (Object.keys(studentFields).length > 0) {
        await student.update(studentFields, { transaction: t });
      }

      await t.commit();

      return {
        user: student.user,
        student,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
  async deleteStudent(id) {
    try {
      const student = await User.findOne({ where: { id } });
      if (!student) {
        throw new Error("Student not found");
      }

      await student.destroy();
      return;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw new Error("Error deleting student: " + error.message);
    }
  }
  async importStudents(rows, adminUser) {
    const success = [];
    const failed = [];
    const instituteId = await User.findByPk(adminUser.id, {
      attributes: ["institute_id"],
    });
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(row);
      const t = await sequelize.transaction();

      try {
        // ================= REQUIRED FIELD CHECK =================
        const requiredFields = [
          "firstName",
          "lastName",
          "email",
          "mobileNo",
          "institute_code",
          "class_name",
          "parent_name",
          "parent_phone",
          "address",
        ];

        for (const field of requiredFields) {
          if (!row[field]) {
            throw new Error(`Missing ${field}`);
          }
        }

        // ================= INSTITUTE LOOKUP (CODE ONLY) =================
        const institute = await Institute.findOne({
          where: { institute_code: row.institute_code },
          transaction: t,
        });

        if (!institute) {
          throw new Error("Invalid institute code");
        }

        // NOTE:  row.institute_code is NOT trusted or used
        // row.institute_name is NOT trusted or used

        // Institute admin restriction
        if (
          adminUser.roleId === 3 &&
          instituteId.institute_id !== institute.id
        ) {
          throw new Error("You cannot import students for another institute");
        }

        // ================= CLASS LOOKUP =================
        const classObj = await Class.findOne({
          where: {
            class_name: row.class_name,
            institute_id: institute.id,
          },
          transaction: t,
        });

        if (!classObj) {
          throw new Error("Invalid class name");
        }

        // ================= BUILD USER PAYLOAD =================
        const userPayload = {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          mobileNo: row.mobileNo,
          password: "demo1234",
          roleId: 5, // STUDENT
          institute_id: institute.id,

          // Student profile fields
          class_id: classObj.id,
          parent_name: row.parent_name,
          parent_phone: row.parent_phone,
          address: row.address,
        };
        console.log(userPayload);
        // ================= CREATE USER + STUDENT =================
        const newUser = await UserService.addUser(userPayload, adminUser);

        await t.commit();

        success.push({
          row: i + 1,
          email: row.email,
          userId: newUser.id,
        });
      } catch (error) {
        await t.rollback();

        failed.push({
          row: i + 1,
          email: row.email || null,
          reason: error.message,
        });
      }
    }

    return {
      total: rows.length,
      successCount: success.length,
      failedCount: failed.length,
      success,
      failed,
    };
  }
  async exportStudent(roleId, adminUser) {
    try {
      // ================= INSTITUTE FILTER =================
      let instituteWhere = {};

      if (roleId === 3) {
        // School admin → only own institute
        const instituteId = await User.findByPk(adminUser.id, {
          attributes: ["institute_id"],
        });
        console.log(instituteId);
        instituteWhere.id = instituteId.institute_id;
      }

      // ================= FETCH INSTITUTES =================
      const institutes = await Institute.findAll({
        where: instituteWhere,
        attributes: ["id", "name", "institute_code"],
        order: [["name", "ASC"]],
      });

      if (!institutes.length) {
        throw new Error("No institutes found for export");
      }

      const workbook = XLSX.utils.book_new();

      // ================= LOOP SCHOOL-WISE =================
      for (const institute of institutes) {
        const students = await Student.findAll({
          where: { institute_id: institute.id },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "email", "mobileNo"],
            },
            {
              model: Class,
              as: "class",
              attributes: ["class_name"],
            },
            {
              model: Course,
              as: "course", // ✅ DIRECT RELATION
              attributes: ["course_name"], // ✅ SINGLE COURSE
            },
          ],
          order: [["created_at", "ASC"]],
        });

        // ---- Prepare rows ----
        const sheetRows = students.map((stu, index) => ({
          "S.No": index + 1,
          "Student Name": `${stu.user?.firstName || ""} ${stu.user?.lastName || ""}`,
          Email: stu.user?.email || "",
          Mobile: stu.user?.mobileNo || "",
          Class: stu.class?.class_name || "",
          Course: stu.course?.course_name || "", // ✅ FIXED
          "Roll Number": stu.roll_number || "",
          "Parent Name": stu.parent_name || "",
          "Parent Phone": stu.parent_phone || "",
          Address: stu.address || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(
          sheetRows.length ? sheetRows : [{}],
        );

        let sheetName = `${institute.name} (${institute.institute_code})`
          .replace(/[\\/?*\[\]:]/g, "")
          .substring(0, 31);

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      // ================= SAVE FILE =================
      const fileName = `students_school_wise_${Date.now()}.xlsx`;
      const uploadDir = path.join(__dirname, "../uploads");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      XLSX.writeFile(workbook, filePath);

      return { fileName, filePath };
    } catch (error) {
      console.error("Export student (school-wise) error:", error);
      throw error;
    }
  }
}

module.exports = new StudentService();
