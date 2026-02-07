const Instructor = require("../models/Instructor");
const User = require("../models/User");
const Institute = require("../models/Institute");
const CourseInstitute = require("../models/CourseInstitute");
const Course = require("../models/course");
const Class = require("../models/class");
const Student = require("../models/Student");

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const sequelize = require("../config/database");
const XLSX = require("xlsx");
const { uploadBase64Image } = require("./s3uploadService");

class InstructorService {
  async getAllInstructors({ institutionId, page, limit, filters }) {
    try {
      console.log(filters, institutionId);
      let instructorWhere = {};
      let userWhere = {};
      /* 🔍 SEARCH ON USER NAME + EMAIL */
      if (filters?.search) {
        userWhere[Op.or] = [
          { firstName: { [Op.like]: `%${filters.search}%` } },
          { lastName: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      /* 🎯 INSTRUCTOR FILTERS */
      const allowedFilters = ["approvedstatus", "is_active"];
      allowedFilters.forEach((field) => {
        if (
          filters?.[field] !== undefined &&
          filters?.[field] !== null &&
          filters?.[field] !== ""
        ) {
          instructorWhere[field] = filters[field];
        }
      });

      /* 📅 DATE RANGE */
      if (filters?.created_from || filters?.created_to) {
        instructorWhere.created_at = {};

        if (filters.created_from) {
          instructorWhere.created_at[Op.gte] = new Date(
            `${filters.created_from} 00:00:00`,
          );
        }

        if (filters.created_to) {
          const endDate = new Date(filters.created_to);
          endDate.setHours(23, 59, 59, 999);
          instructorWhere.created_at[Op.lte] = endDate;
        }
      }

      /* 🏫 INSTITUTION */
      if (institutionId) {
        instructorWhere.institute_id = institutionId;
      }

      /* 📄 PAGINATION */
      const isPaginated = page && limit;
      const offset = isPaginated ? (page - 1) * limit : undefined;

      const hasSearch = !!filters?.search;

      const { rows, count } = await Instructor.findAndCountAll({
        where: instructorWhere,
        limit: isPaginated ? limit : undefined,
        offset: isPaginated ? offset : undefined,
        attributes: [
          "id",
          "employee_id",
          "department",
          "city",
          "state",
          "gender",
          "subject_specialization",
          "qualification",
        ],

        include: [
          {
            model: User,
            as: "user",
            required: hasSearch, // ⭐ THIS IS THE FIX
            where: hasSearch
              ? {
                  [Op.or]: [
                    { firstName: { [Op.like]: `%${filters.search}%` } },
                    { lastName: { [Op.like]: `%${filters.search}%` } },
                    { email: { [Op.like]: `%${filters.search}%` } },
                  ],
                }
              : undefined,
            attributes: ["id", "firstName", "lastName", "email", "mobileNo"],
          },
        ],
        order: [["created_at", "DESC"]],
        distinct: true,
      });

      return {
        data: rows,
        pagination: {
          total: count,
          page: isPaginated ? page : null,
          limit: isPaginated ? limit : null,
          totalPages: isPaginated ? Math.ceil(count / limit) : null,
        },
      };
    } catch (error) {
      console.error("getAllInstructors error:", error);
      throw error;
    }
  }
  async getInstructorById(userId) {
    try {
      const data = await Instructor.findOne({
        where: { user_id: userId },
        attributes: [
          "id",
          "employee_id",
          "department",
          "qualification",
          "subject_specialization",
          "joining_date",
          "institute_id",

          // personal
          "address",
          "city",
          "state",
          "pincode",
          "alternate_phone",
          "emergency_contact",
          "emergency_contact_name",
          "blood_group",
          "date_of_birth",
          "gender",
          "marital_status",
        ],
        include: [
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
          },
          {
            model: CourseInstitute,
            as: "course_assignments",
            attributes: ["class_id", "course_id", "institute_id"],

            include: [
              {
                model: Class,
                as: "class",
                attributes: ["id", "class_name", "grade", "section"],
              },
              {
                model: Course,
                as: "course",
                attributes: ["id", "course_name"],
              },
              {
                model: Institute,
                as: "institute",
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      console.log(data);
      return data;
    } catch (error) {
      console.error("getInstructorById error:", error);
      throw error;
    }
  }
  async updateInstructor(userId, updateData) {
    const t = await sequelize.transaction();
    try {
      // ===== Fetch instructor =====
      const instructor = await Instructor.findOne({
        where: { user_id: userId },
        transaction: t,
      });
      if (!instructor)
        throw Object.assign(new Error("Instructor not found"), { status: 404 });

      // ===== Fetch user =====
      const user = await User.findByPk(userId, { transaction: t });
      if (!user)
        throw Object.assign(new Error("User not found"), { status: 404 });

      // ===== Block forbidden user fields (SECURITY) =====
      delete updateData.roleId;
      delete updateData.institute_id;
      delete updateData.is_active;
      delete updateData.approval_status;
      delete updateData.password;
      if (updateData.avatar)
        updateData.avatar = await uploadBase64Image(updateData.avatar);

      // ===== Prevent duplicate email =====
      if (updateData.email && updateData.email !== user.email) {
        const exists = await User.findOne({
          where: {
            email: updateData.email,
            id: { [Op.ne]: userId },
          },
          transaction: t,
        });
        if (exists)
          throw Object.assign(new Error("Email already in use"), {
            status: 400,
          });
      }

      // ===== Prevent duplicate mobile =====
      if (updateData.mobileNo && updateData.mobileNo !== user.mobileNo) {
        const exists = await User.findOne({
          where: {
            mobileNo: updateData.mobileNo,
            id: { [Op.ne]: userId },
          },
          transaction: t,
        });
        if (exists)
          throw Object.assign(new Error("Mobile already in use"), {
            status: 400,
          });
      }

      // ===== Update User =====
      await user.update(updateData, { transaction: t });

      // ===== Update Instructor Profile =====
      const instructorFields = [
        // professional
        "subject_specialization",
        "qualification",
        "experience_years",
        "joining_date",
        "department",

        // personal / contact
        "address",
        "city",
        "state",
        "pincode",
        "alternate_phone",
        "emergency_contact",
        "emergency_contact_name",
        "blood_group",
        "date_of_birth",
        "gender",
        "marital_status",
      ];

      const instructorUpdate = {};
      for (const field of instructorFields) {
        if (updateData[field] !== undefined) {
          instructorUpdate[field] = updateData[field];
        }
      }

      if (Object.keys(instructorUpdate).length > 0) {
        await instructor.update(instructorUpdate, { transaction: t });
      }

      // ===== Update Class Assignments (EXPLICIT ONLY) =====
      if (updateData.classAssignments !== undefined) {
        if (!Array.isArray(updateData.classAssignments)) {
          throw Object.assign(new Error("classAssignments must be an array"), {
            status: 400,
          });
        }

        // 🔹 Empty array → remove ALL assignments
        if (updateData.classAssignments.length === 0) {
          await CourseInstitute.update(
            { instructor_id: null },
            {
              where: {
                instructor_id: instructor.id,
                institute_id: instructor.institute_id,
              },
              transaction: t,
            },
          );
        }

        // 🔹 Replace assignments
        else {
          // 1️⃣ Unassign instructor from all current classes
          await CourseInstitute.update(
            { instructor_id: null },
            {
              where: {
                instructor_id: instructor.id,
                institute_id: instructor.institute_id,
              },
              transaction: t,
            },
          );

          // 2️⃣ Assign new classes
          for (const assign of updateData.classAssignments) {
            if (!assign.class_id || !assign.course_id) {
              throw Object.assign(
                new Error("class_id and course_id are required"),
                { status: 400 },
              );
            }

            // Validate class belongs to institute
            const classObj = await Class.findOne({
              where: {
                id: assign.class_id,
                institute_id: instructor.institute_id,
              },
              transaction: t,
            });
            if (!classObj) {
              throw Object.assign(
                new Error("Class does not belong to this institute"),
                { status: 400 },
              );
            }

            // Validate course
            const course = await Course.findByPk(assign.course_id, {
              transaction: t,
            });
            if (!course) {
              throw Object.assign(new Error("Invalid course_id"), {
                status: 400,
              });
            }

            const existing = await CourseInstitute.findOne({
              where: {
                class_id: assign.class_id,
                institute_id: instructor.institute_id,
              },
              transaction: t,
            });

            if (!existing) {
              // create mapping
              await CourseInstitute.create(
                {
                  class_id: assign.class_id,
                  course_id: assign.course_id,
                  institute_id: instructor.institute_id,
                  instructor_id: instructor.id,
                },
                { transaction: t },
              );
            } else {
              // course_id is part of PK → delete + recreate if changed
              if (existing.course_id !== assign.course_id) {
                await CourseInstitute.destroy({
                  where: {
                    class_id: assign.class_id,
                    institute_id: instructor.institute_id,
                    course_id: existing.course_id,
                  },
                  transaction: t,
                });

                await CourseInstitute.create(
                  {
                    class_id: assign.class_id,
                    course_id: assign.course_id,
                    institute_id: instructor.institute_id,
                    instructor_id: instructor.id,
                  },
                  { transaction: t },
                );
              } else {
                // only instructor change
                await CourseInstitute.update(
                  { instructor_id: instructor.id },
                  {
                    where: {
                      class_id: assign.class_id,
                      institute_id: instructor.institute_id,
                      course_id: existing.course_id,
                    },
                    transaction: t,
                  },
                );
              }
            }
          }
        }
      }

      await t.commit();
      return { user, instructor };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async deleteInstructors(userIds, roleId, instituteId) {
    const t = await sequelize.transaction();
    try {
      const instructors = await Instructor.findAll({
        where: { user_id: userIds },
      });

      if (!instructors.length)
        throw Object.assign(new Error("Instructor not found"), { status: 404 });

      // Institute Admin → ownership check
      if (roleId === 3) {
        const invalid = instructors.find((i) => i.institute_id !== instituteId);
        if (invalid)
          throw Object.assign(new Error("Forbidden"), { status: 403 });
      }

      // Get instructor IDs
      const instructorIds = instructors.map((i) => i.id);

      // ✅ Delete course mappings first
      await CourseInstitute.destroy({
        where: { instructor_id: instructorIds },
        transaction: t,
      });

      // Delete instructors
      await Instructor.destroy({
        where: { user_id: userIds },
        transaction: t,
      });

      // Delete users
      await User.destroy({
        where: { id: userIds },
        transaction: t,
      });

      await t.commit();
      return { deleted: userIds };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async approveInstructor(userId, approved, roleId, instituteId) {
    const instructor = await Instructor.findOne({ where: { user_id: userId } });
    if (!instructor)
      throw Object.assign(new Error("Instructor not found"), { status: 404 });

    if (roleId === 3 && instructor.institute_id !== instituteId)
      throw Object.assign(new Error("Forbidden"), { status: 403 });

    await User.update(
      { approval_status: approved, is_active: approved === "approved" ? 1 : 0 },
      { where: { id: userId } },
    );

    return { userId, approval_status: approved };
  }

  async importInstructors(fileBuffer, creatorUser, instituteID) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const success = [];
    const failed = [];

    // ✅ Super Admin institute validation (once)
    let superAdminInstitute = null;

    if (creatorUser.roleId === 1) {
      if (!instituteID) throw new Error("instituteId is required");

      superAdminInstitute = await Institute.findByPk(instituteID);

      if (!superAdminInstitute) throw new Error("Invalid instituteId");
    }

    for (const [index, row] of rows.entries()) {
      const t = await sequelize.transaction();

      try {
        // ===== Basic validation =====
        if (!row.firstName || !row.lastName || !row.email)
          throw new Error("Missing required fields");

        const email = String(row.email).trim().toLowerCase();

        // ===== Institute handling =====
        let instituteId;

        // 🏫 School Admin
        if (creatorUser.roleId === 3) {
          const admin = await User.findByPk(creatorUser.id, {
            attributes: ["institute_id"],
            transaction: t,
          });

          if (!admin?.institute_id) throw new Error("Institute ID required");

          instituteId = admin.institute_id;
        }

        // 🏫 Super Admin
        else if (creatorUser.roleId === 1) {
          instituteId = superAdminInstitute.id;
        }

        // ===== Prevent duplicate email =====
        const emailExists = await User.findOne({
          where: { email },
          transaction: t,
        });

        if (emailExists) throw new Error("Email already exists");

        // ===== Create user =====
        const hashedPassword = await bcrypt.hash(row.password || "123456", 10);

        const user = await User.create(
          {
            firstName: row.firstName,
            lastName: row.lastName,
            email,
            password: hashedPassword,
            roleId: 4,
            institute_id: instituteId,
            approval_status: creatorUser.roleId === 3 ? "approved" : "pending",
          },
          { transaction: t },
        );
        const institute = await Institute.findByPk(instituteId, {
          transaction: t,
        });
        const year = new Date().getFullYear();
        const serial = await Institute.count({
          where: { institute_code: institute.institute_code },
        });
        const employeeId = `EMP-${institute.institute_code}-${year}-${serial}`;
        // ===== Create instructor =====
        const instructor = await Instructor.create(
          {
            user_id: user.id,
            institute_id: instituteId,
            employee_id: employeeId,
            subject_specialization: row.subject_specialization || "General",

            qualification: row.qualification || "Not specified",

            experience_years: row.experience_years || 0,

            department: row.department || null,
            address: row.address || null,
            city: row.city || null,
            state: row.state || null,
            pincode: row.pincode || null,
            alternate_phone: row.alternate_phone || null,
            emergency_contact: row.emergency_contact || null,
            emergency_contact_name: row.emergency_contact_name || null,
            blood_group: row.blood_group || null,
            date_of_birth: row.date_of_birth || null,
            gender: row.gender || null,
            marital_status: row.marital_status || null,
          },
          { transaction: t },
        );

        // ===== Class Assignments =====
        if (row.class_ids && row.course_ids) {
          const classIds = String(row.class_ids).split(",");

          const courseIds = String(row.course_ids).split(",");

          if (classIds.length !== courseIds.length)
            throw new Error("class_ids and course_ids count mismatch");

          for (let i = 0; i < classIds.length; i++) {
            await CourseInstitute.create(
              {
                course_id: parseInt(courseIds[i]),
                class_id: parseInt(classIds[i]),
                institute_id: instituteId,
                instructor_id: instructor.id,
              },
              { transaction: t },
            );
          }
        }

        await t.commit();

        success.push({
          rowNumber: index + 2,
          userId: user.id,
        });
      } catch (err) {
        await t.rollback();

        failed.push({
          rowNumber: index + 2,
          error: err.message,
        });
      }
    }

    return { success, failed };
  }

  async exportInstructors(roleId, userId, res) {
    const user = await User.findByPk(userId);
    const institute_id = user.roleId === 3 ? await user.institute_id : null;
    const where = {};
    if (roleId === 3) {
      where.institute_id = institute_id;
    }

    const instructors = await Instructor.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email", "mobileNo"],
        },
        {
          model: Institute,
          as: "institute",
          attributes: ["name"],
        },
        {
          model: CourseInstitute,
          as: "course_assignments",
          include: [
            {
              model: Course,
              as: "course",
              attributes: ["course_name"],
            },
            {
              model: Class,
              as: "class",
              include: [
                {
                  model: Student,
                  as: "students",
                  include: [
                    {
                      model: User,
                      as: "user",
                      attributes: [
                        "firstName",
                        "lastName",
                        "email",
                        "mobileNo",
                      ],
                    },
                  ],
                  attributes: [
                    "id",
                    "roll_number",
                    "parent_name",
                    "parent_phone",
                  ],
                },
              ],
              attributes: ["class_name"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });
    console.log(instructors);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Instructors");
    const studentSheet = workbook.addWorksheet("Instructor Students");

    studentSheet.columns = [
      { header: "Instructor Name", key: "instructor", width: 25 },
      { header: "Employee ID", key: "employee_id", width: 15 },
      { header: "Institute", key: "institute", width: 20 },
      { header: "Course", key: "course", width: 25 },
      { header: "Class", key: "class_name", width: 15 },
      { header: "Student Name", key: "student_name", width: 25 },
      { header: "Student Email", key: "student_email", width: 30 },
      { header: "Roll No", key: "roll_number", width: 15 },
      { header: "Parent Name", key: "parent", width: 25 },
      { header: "Parent Phone", key: "phone", width: 18 },
    ];

    sheet.columns = [
      { header: "Instructor Name", key: "name", width: 25 },
      { header: "Employee ID", key: "employee_id", width: 15 },
      { header: "Institute", key: "institute", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Courses Assigned", key: "courses", width: 35 },
      { header: "Classes", key: "classes", width: 25 },
      { header: "Total Students", key: "students", width: 15 },
    ];

    instructors.forEach((inst) => {
      const courses = new Set();
      const classes = new Set();
      let studentCount = 0;
      inst.course_assignments.forEach((ca) => {
        if (ca.course) courses.add(ca.course.course_name);
        if (ca.class) {
          classes.add(`Class ${ca.class.class_name}`);
          studentCount += ca.class.students?.length || 0;
        }
      });

      sheet.addRow({
        name: inst.user
          ? `${inst.user.firstName} ${inst.user.lastName}`
          : "N/A",
        employee_id: inst.employee_id || "-",
        institute: inst.institute?.name || "-",
        department: inst.department || "-",
        courses: [...courses].join(", "),
        classes: [...classes].join(", "),
        students: studentCount,
      });
    });

    instructors.forEach((inst) => {
      const instructorName = inst.user
        ? `${inst.user.firstName} ${inst.user.lastName}`
        : "N/A";

      inst.course_assignments.forEach((ca) => {
        const courseName = ca.course?.course_name || "-";
        const className = ca.class ? `Class ${ca.class.class_name}` : "-";

        ca.class?.students?.forEach((stu) => {
          studentSheet.addRow({
            instructor: instructorName,
            employee_id: inst.employee_id || "-",
            institute: inst.institute?.name || "-",
            course: courseName,
            class_name: className,

            // ✅ Student → User fields
            student_name: stu.user
              ? `${stu.user.firstName} ${stu.user.lastName}`
              : "-",

            student_email: stu.user?.email || "-",

            // ✅ Student fields
            roll_number: stu.roll_number || "-",
            parent: stu.parent_name || "-",
            phone: stu.parent_phone || "-",
          });

          console.log(stu);
        });
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=instructors_export.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}

module.exports = new InstructorService();
