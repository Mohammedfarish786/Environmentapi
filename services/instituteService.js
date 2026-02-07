const Course = require("../models/course");
const CourseInstitute = require("../models/CourseInstitute");
const Class = require("../models/class");
const Student = require("../models/Student");
const Instructor = require("../models/Instructor");
const Institute = require("../models/Institute");
const User = require("../models/User");
const Teacher = require("../models/Instructor");
const { uploadBase64Image } = require("./s3uploadService");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const emailService = require("../services/emailService");

class InstituteService {
  constructor() {
    if (InstituteService.instance) {
      return InstituteService.instance; // Return the existing instance if it exists
    }

    InstituteService.instance = this; // Set the instance for future calls

    return this;
  }
  async getAllInstitute(page, limit, filters, viewer) {
    const isPaginated = page && limit;
    const offset = isPaginated ? (page - 1) * limit : null;

    let whereCondition = {};
    if (viewer.roleId === 3) {
      const viewerInstitute = await Institute.findOne({
        where: { representative_id: viewer.id },
      });
      filters.institute_id = viewerInstitute.id;
      whereCondition.institute_id = filters.institute_id;
    }

    /* 🔍 Dynamic SEARCH */
    if (filters.search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { institute_city: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
        { institute_code: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    /* 🎯 SIMPLE DYNAMIC FILTERS */
    const allowedFilters = ["institute_type", "approvedstatus", "is_active"];

    allowedFilters.forEach((field) => {
      if (
        filters[field] !== undefined &&
        filters[field] !== null &&
        filters[field] !== ""
      ) {
        whereCondition[field] = filters[field];
      }
    });

    /* 📅 DYNAMIC DATE RANGE */
    if (filters.created_from || filters.created_to) {
      whereCondition.created_at = {};

      if (filters.created_from) {
        whereCondition.created_at[Op.gte] = new Date(
          `${filters.created_from} 00:00:00`,
        );
      }

      if (filters.created_to) {
        const endDate = new Date(filters.created_to);
        endDate.setHours(23, 59, 59, 999);
        whereCondition.created_at[Op.lte] = endDate;
      }
    }

    const { count, rows } = await Institute.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "representative",
          attributes: ["id", "firstName", "lastName", "email", "mobileNo"],
        },
      ],
      limit: isPaginated ? limit : undefined,
      offset: isPaginated ? offset : undefined,
      distinct: true,
      order: [["created_at", "DESC"]],
    });

    return {
      data: rows,
      pagination: isPaginated
        ? {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
          }
        : null,
    };
  }

  async createInstitute(data, approved) {
    const t = await sequelize.transaction();

    try {
      const {
        name,
        institute_type,
        institute_board_university,
        address,
        institute_city,
        state,
        pincode,
        phone,
        alternate_phone,
        email,
        institute_code,
        institute_logo, // (filename or URL)
        schooladmindata,
      } = data;
      const institute_logo_url = institute_logo
        ? await uploadBase64Image(institute_logo)
        : null;

      // ===== Validation =====
      if (
        !name ||
        !institute_type ||
        !address ||
        !institute_city ||
        !state ||
        !pincode ||
        !phone ||
        !email ||
        !institute_code
      ) {
        throw new Error("All required fields must be provided");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Invalid email format");

      if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("Invalid phone number");

      if (alternate_phone && !/^[6-9]\d{9}$/.test(alternate_phone))
        throw new Error("Invalid alternate phone number");

      if (!/^\d{6}$/.test(pincode)) throw new Error("Invalid pincode");

      // ===== Unique checks =====
      const emailExists = await Institute.findOne({
        where: { email },
        transaction: t,
      });
      if (emailExists) throw new Error("Institute email already registered");

      const codeExists = await Institute.findOne({
        where: { institute_code },
        transaction: t,
      });
      if (codeExists) throw new Error("Institute code already exists");

      // ===== 1. Create Institute =====
      const newInstitute = await Institute.create(
        {
          name: name.trim(),
          institute_type,
          institute_board_university,
          address: address.trim(),
          institute_city,
          state,
          pincode,
          phone,
          alternate_phone,
          email: email.toLowerCase(),
          institute_code: institute_code.toUpperCase(),
          institute_logo: institute_logo_url,
          representative_id: null,
          approvedstatus: approved, // approved / pending / rejected
          is_active: approved === "approved" ? 1 : 0,
        },
        { transaction: t },
      );

      // ===== 2. Create Institute Admin User =====
      if (!schooladmindata) throw new Error("schooladmindata is required");

      const { firstName, lastName, adminEmail, password, mobileNo } =
        schooladmindata;

      const userExists = await User.findOne({
        where: { email: adminEmail },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (userExists) throw new Error("Admin email already registered");

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create(
        {
          firstName,
          lastName,
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          mobileNo,
          roleId: 3, // Institute Admin
          institute_id: newInstitute.id,
          is_active: approved === "approved" ? 1 : 0,
          approval_status: approved,
        },
        { transaction: t },
      );
      console.log("newUser", newUser.email);
      console.log("newInstitute", newInstitute.email);
      // ===== 3. Update representative_id =====
      await newInstitute.update(
        { representative_id: newUser.id },
        { transaction: t },
      );
      // ===== Send Email to Institute Admin =====
      try {
        await emailService.sendEmail({
          to: newUser.email,
          subject:
            approved === "approved"
              ? "Institute Registered & Approved"
              : "Institute Registration Submitted",
          html: `
          <h3>Welcome to Geomaticx GeoVerse</h3>
          <p>Your institute <b>${newInstitute.name}</b> has been registered.</p>
          <p>Status: <b>${approved}</b></p>
        `,
        });
        await emailService.sendEmail({
          to: newInstitute.email,
          subject:
            approved === "approved"
              ? "Institute Registered & Approved"
              : "Institute Registration Submitted",
          html: `
          <h3>Welcome to Geomaticx GeoVerse</h3>
          <p>Your institute <b>${newInstitute.name}</b> has been registered.</p>
          <p>Status: <b>${approved}</b></p>
        `,
        });
      } catch (mailError) {
        throw new Error(
          "Invalid or unreachable email address. Registration aborted.",
        );
      }

      await t.commit();

      return { institute: newInstitute, adminUser: newUser };
    } catch (error) {
      await t.rollback();
      console.error("Error creating Institute:", error.message);
      throw error;
    }
  }

  async approveInstitute(id, approval_status) {
    const t = await sequelize.transaction();
    try {
      const institute = await Institute.findByPk(id, { transaction: t });

      if (!institute) {
        throw new Error("Institute not found");
      }

      const user = await User.findByPk(institute.representative_id, {
        transaction: t,
      });

      if (!user) {
        throw new Error("Representative user not found");
      }

      // Validate status
      if (!["approved", "rejected"].includes(approval_status)) {
        throw new Error("Invalid approval status");
      }

      // Apply status
      const isApproved = approval_status === "approved";

      institute.approvedstatus = approval_status;
      institute.is_active = isApproved ? 1 : 0;

      user.approval_status = approval_status;
      user.is_active = isApproved ? 1 : 0;

      await institute.save({ transaction: t });
      await user.save({ transaction: t });

      // Send email
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: `Institute ${isApproved ? "Approved" : "Rejected"}`,
          html: `
            <h3>Welcome to Geomaticx GeoVerse</h3>
            <p>Your institute <b>${institute.name}</b> has been ${
              isApproved ? "approved" : "rejected"
            }.</p>
          `,
        });
      } catch (mailError) {
        throw new Error(
          "Invalid or unreachable email address. Registration aborted.",
        );
      }

      await t.commit();

      return institute;
    } catch (error) {
      await t.rollback();
      console.error("Error updating Institute:", error);
      throw error; // important so controller catches it
    }
  }

  async updateInstitute(data, id) {
    try {
      const institute = await Institute.findByPk(id);
      const representative = await User.findByPk(institute.representative_id);

      if (!institute) throw new Error("Institute not found");

      // ===== Validation =====
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error("Invalid email format");
      }

      if (data.phone && !/^[6-9]\d{9}$/.test(data.phone)) {
        throw new Error("Invalid phone number");
      }

      if (data.alternate_phone && !/^[6-9]\d{9}$/.test(data.alternate_phone)) {
        throw new Error("Invalid alternate phone number");
      }

      if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
        throw new Error("Invalid pincode");
      }
      let instituteLogo;
      if (data.institute_logo) {
        instituteLogo = await uploadBase64Image(data.institute_logo);
      }
      data.institute_logo = instituteLogo;
      // ===== Perform update =====
      await institute.update(data);
      return institute;
    } catch (error) {
      console.error("Error updating Institute:", error.message);
      throw error;
    }
  }

  async deleteInstitute(id) {
    const t = await sequelize.transaction();
    try {
      const institute = await Institute.findByPk(id, { transaction: t });
      if (!institute) throw new Error("Institute not found");

      // Because we set onDelete: CASCADE on CourseInstitute,
      // mappings will auto-delete.
      await institute.destroy({ transaction: t });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      console.error("Error deleting institute:", error);
      throw error;
    }
  }

  async importinstitutes(fileBuffer) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const success = [];
      const failed = [];

      for (const row of rows) {
        try {
          // ===== Required Fields Check =====
          if (
            !row.name ||
            !row.institute_type ||
            !row.address ||
            !row.city ||
            !row.state ||
            !row.pincode ||
            !row.phone ||
            !row.email ||
            !row.institute_code ||
            !row.admin_firstName ||
            !row.admin_lastName ||
            !row.admin_email ||
            !row.admin_password ||
            !row.admin_mobile
          ) {
            failed.push({ row, error: "Missing required fields" });
            continue;
          }

          // ===== Skip duplicates =====
          const exists = await Institute.findOne({
            where: {
              [Op.or]: [
                { email: row.email.trim() },
                { institute_code: row.institute_code.trim() },
              ],
            },
          });

          if (exists) {
            failed.push({ row, error: "Institute already exists" });
            continue;
          }

          // ===== Build payload =====
          const payload = {
            name: row.name.trim(),
            institute_type: row.institute_type.trim(),
            institute_board_university: row.board_university
              ? row.board_university.trim()
              : null,
            address: row.address.trim(),
            institute_city: row.city.trim(),
            state: row.state.trim(),
            pincode: row.pincode.toString().trim(),
            phone: row.phone.toString().trim(),
            alternate_phone: row.alternate_phone
              ? row.alternate_phone.toString().trim()
              : null,
            email: row.email.trim(),
            institute_code: row.institute_code.trim(),

            schooladmindata: {
              firstName: row.admin_firstName.trim(),
              lastName: row.admin_lastName.trim(),
              adminEmail: row.admin_email.trim(),
              password: row.admin_password.toString(),
              mobileNo: row.admin_mobile.toString().trim(),
            },
          };
          // ===== Call create service =====
          const result = await this.createInstitute(payload, "approved");

          success.push({
            institute: result.institute.id,
            admin: result.adminUser.id,
          });
        } catch (err) {
          failed.push({ row, error: err.message });
        }
      }

      return { success, failed };
    } catch (error) {
      console.error("Error importing institutes:", error);
      throw error;
    }
  }

  async exportinstitutes() {
    try {
      const institutes = await Institute.findAll({
        include: [
          {
            model: User,
            as: "representative",
            attributes: ["firstName", "lastName", "email", "mobileNo"],
          },
          {
            model: CourseInstitute,
            as: "courseInstitutes",
            include: [
              { model: Course, as: "course", attributes: ["course_name"] },
              { model: Class, as: "class", attributes: ["class_name"] },
              {
                model: Instructor,
                as: "instructor",
                include: [
                  {
                    model: User,
                    as: "user",
                    attributes: ["firstName", "lastName"],
                  },
                ],
              },
            ],
          },
          {
            model: Student,
            as: "students",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["firstName", "lastName"],
              },
            ],
            required: false,
          },
        ],
      });

      const workbook = XLSX.utils.book_new();

      for (const inst of institutes) {
        const rows = [];

        const admin = inst.representative;
        const adminName = admin ? `${admin.firstName} ${admin.lastName}` : "";

        // No course mappings
        if (!inst.courseInstitutes || inst.courseInstitutes.length === 0) {
          rows.push({
            //institute_id: inst.id,
            institute_name: inst.name,
            institute_type: inst.institute_type,
            institute_city: inst.institute_city,
            state: inst.state,
            institute_code: inst.institute_code,
            institute_email: inst.email,
            institute_phone: inst.phone,
            admin_name: adminName,
            admin_email: admin?.email || "",
            admin_mobile: admin?.mobileNo || "",
            course_name: "",
            class_name: "",
            instructor_name: "",
            student_name: "",
            student_roll: "",
            parent_name: "",
            parent_phone: "",
          });
        } else {
          for (const link of inst.courseInstitutes) {
            const courseName = link.course?.course_name || "";
            const className = link.class?.class_name || "";
            const instructorName = link.instructor?.user
              ? `${link.instructor.user.firstName} ${link.instructor.user.lastName}`
              : "";

            const students = (inst.students || []).filter(
              (s) => s.course_id === link.course_id,
            );

            // No students for this course
            if (students.length === 0) {
              rows.push({
                //institute_id: inst.id,
                institute_name: inst.name,
                institute_type: inst.institute_type,
                institute_city: inst.institute_city,
                state: inst.state,
                institute_code: inst.institute_code,
                institute_email: inst.email,
                institute_phone: inst.phone,
                admin_name: adminName,
                admin_email: admin?.email || "",
                admin_mobile: admin?.mobileNo || "",
                course_name: courseName,
                class_name: className,
                instructor_name: instructorName,
                student_name: "",
                student_roll: "",
                parent_name: "",
                parent_phone: "",
              });
            } else {
              // One row per student
              for (const stu of students) {
                const stuUser = stu.user;
                rows.push({
                  //institute_id: inst.id,
                  institute_name: inst.name,
                  institute_type: inst.institute_type,
                  institute_city: inst.institute_city,
                  state: inst.state,
                  institute_code: inst.institute_code,
                  institute_email: inst.email,
                  institute_phone: inst.phone,
                  admin_name: adminName,
                  admin_email: admin?.email || "",
                  admin_mobile: admin?.mobileNo || "",
                  course_name: courseName,
                  class_name: className,
                  instructor_name: instructorName,
                  student_name: stuUser
                    ? `${stuUser.firstName} ${stuUser.lastName}`
                    : "",
                  student_roll: stu.roll_number || "",
                  parent_name: stu.parent_name || "",
                  parent_phone: stu.parent_phone || "",
                });
              }
            }
          }
        }

        // Create sheet per institute
        const sheet = XLSX.utils.json_to_sheet(rows);

        // Safe sheet name (Excel max 31 chars)
        const sheetName = `Inst_${inst.institute_code || inst.id}`.substring(
          0,
          31,
        );

        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      }

      return XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });
    } catch (error) {
      console.error("Error exporting institute data:", error);
      throw error;
    }
  }
}

module.exports = new InstituteService();
