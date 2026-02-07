const Class = require("../models/class");
const Institute = require("../models/Institute");
const Course = require("../models/course");
const CourseInstitute = require("../models/CourseInstitute");
const Instructor = require("../models/Instructor");
const User = require("../models/User");
const sequelize = require("../config/database");
const XLSX = require("xlsx");
const { Op } = require("sequelize");

class ClassService {
  // ---------- Helper Validation ----------
  validateClassPayload(data, user) {
    if (!data.grade || data.grade.trim() === "")
      throw Object.assign(new Error("Grade is required"), { status: 400 });

    if (!data.section || !/^[A-Za-z]{1,2}$/.test(data.section))
      throw Object.assign(
        new Error("Section must be 1–2 alphabetic characters"),
        { status: 400 },
      );

    if (
      !data.capacity ||
      isNaN(data.capacity) ||
      data.capacity < 1 ||
      data.capacity > 100
    )
      throw Object.assign(new Error("Capacity must be between 1 and 100"), {
        status: 400,
      });

    if (user.roleId !== 3 && !data.institute_id)
      throw Object.assign(new Error("Institute ID is required"), {
        status: 400,
      });

    if (!data.course_id)
      throw Object.assign(new Error("Course ID is required"), { status: 400 });
  }

  // ---------- CREATE ----------
  async createClass(data, user) {
    const t = await sequelize.transaction();
    try {
      this.validateClassPayload(data, user);

      // Institute Admin forced institute
      if (user.roleId === 3) {
        data.institute_id = user.institute_id;
      }

      // Check institute existence
      const inst = await Institute.findByPk(data.institute_id);
      if (!inst)
        throw Object.assign(new Error("Invalid institute_id"), { status: 400 });

      // Check course existence
      const course = await Course.findByPk(data.course_id);
      if (!course)
        throw Object.assign(new Error("Invalid course_id"), { status: 400 });

      // Map classname → class_name
      const newClass = await Class.create(
        {
          grade: data.grade,
          section: data.section,
          class_name: data.class_name,
          capacity: data.capacity,
          institute_id: data.institute_id,
          description: data.description || null,
        },
        { transaction: t },
      );

      // Mapping table
      await CourseInstitute.create(
        {
          course_id: data.course_id,
          institute_id: data.institute_id,
          class_id: newClass.id,
        },
        { transaction: t },
      );

      await t.commit();
      return newClass;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // ---------- GET ALL ----------
  async getAllClasses({ page, limit, filters, instituteId }) {
    try {
      const isPaginated = page && limit;
      const offset = isPaginated ? (page - 1) * limit : undefined;

      let whereCondition = {};

      /* 🔐 Institute Restriction */
      if (instituteId) {
        whereCondition.institute_id = instituteId;
      }

      /* 🔍 Search */
      if (filters.search) {
        whereCondition[Op.or] = [
          { class_name: { [Op.like]: `%${filters.search}%` } },
          { grade: { [Op.like]: `%${filters.search}%` } },
          { section: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      /* 🎯 Allowed Filters */
      const allowedFilters = ["grade", "section"];

      Object.entries(filters).forEach(([key, value]) => {
        if (
          allowedFilters.includes(key) &&
          value !== undefined &&
          value !== ""
        ) {
          whereCondition[key] = value;
        }
      });

      const { count, rows } = await Class.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: Institute,
            as: "institute",
            attributes: ["name"],
          },
          {
            model: CourseInstitute,
            as: "course_assignment",
            include: [
              {
                model: Course,
                as: "course",
                attributes: ["course_name"],
              },
              {
                model: Instructor,
                as: "instructor",
                attributes: ["employee_id"],
                include: [
                  {
                    model: User,
                    as: "user",
                    attributes: ["id", "firstName", "lastName", "email"],
                  },
                ],
              },
            ],
          },
        ],
        limit: isPaginated ? limit : undefined,
        offset,
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
    } catch (error) {
      console.error("Error fetching classes:", error);
      throw error;
    }
  }

  // ---------- UPDATE ----------
  async updateClass(id, data, user) {
    const t = await sequelize.transaction();
    try {
      // ---- Fetch class ----
      const cls = await Class.findByPk(id, { transaction: t });
      if (!cls)
        throw Object.assign(new Error("Class not found"), { status: 404 });

      // ---- Role + institute boundary ----
      if (user.roleId === 3 && cls.institute_id !== user.institute_id)
        throw Object.assign(new Error("Forbidden"), { status: 403 });

      // ---- Prevent institute change ----
      if (
        data.institute_id !== undefined &&
        data.institute_id !== cls.institute_id
      ) {
        throw Object.assign(
          new Error("Institute change not allowed for class"),
          { status: 400 },
        );
      }
      delete data.institute_id;

      // ---- Handle classname alias ----
      if (data.classname) {
        data.class_name = data.classname;
        delete data.classname;
      }

      // ---- Course assignment update (EXPLICIT ONLY) ----
      if (data.course_id !== undefined) {
        if (data.course_id === null) {
          throw Object.assign(new Error("course_id cannot be null"), {
            status: 400,
          });
        }

        const course = await Course.findByPk(data.course_id);
        if (!course)
          throw Object.assign(new Error("Invalid course_id"), { status: 400 });

        const mapping = await CourseInstitute.findOne({
          where: { class_id: id },
          transaction: t,
        });

        if (!mapping) {
          // create new mapping
          await CourseInstitute.create(
            {
              course_id: data.course_id,
              institute_id: cls.institute_id,
              class_id: id,
            },
            { transaction: t },
          );
        } else {
          // update existing mapping safely
          await mapping.update(
            { course_id: data.course_id },
            { transaction: t },
          );
        }

        delete data.course_id; // prevent class table pollution
      }

      // ---- Update class fields ----
      await cls.update(data, { transaction: t });

      await t.commit();
      return cls;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ---------- DELETE ----------
  async deleteClass(id, user) {
    const t = await sequelize.transaction();
    try {
      const cls = await Class.findByPk(id);
      if (!cls)
        throw Object.assign(new Error("Class not found"), { status: 404 });

      if (user.roleId === 3 && cls.institute_id !== user.institute_id)
        throw Object.assign(new Error("Forbidden"), { status: 403 });

      await cls.destroy({ transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ---------- IMPORT ----------
  async importClasses(fileBuffer, user) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const success = [];
    const failed = [];

    for (const row of rows) {
      try {
        if (
          !row.grade ||
          !row.section ||
          !row.class_name ||
          !row.capacity ||
          !row.course_id
        ) {
          failed.push({ row, error: "Missing required fields" });
          continue;
        }

        const payload = {
          grade: row.grade,
          section: row.section,
          classname: row.class_name,
          capacity: row.capacity,
          description: row.description || null,
          course_id: row.course_id,
          institute_id:
            user.roleId === 3 ? user.institute_id : row.institute_id,
        };

        await this.createClass(payload, user);
        success.push(row.class_name);
      } catch (err) {
        failed.push({ row, error: err.message });
      }
    }

    return { success, failed };
  }

  // ---------- EXPORT ----------
  async exportClasses(user) {
    const classes = await Class.findAll({
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["name"],
        },
        {
          model: CourseInstitute,
          as: "course_assignment",
          include: [
            { model: Course, as: "course", attributes: ["course_name"] },
          ],
        },
      ],
    });

    let filtered = classes;
    if (user.roleId === 3) {
      filtered = classes.filter((c) => c.institute_id === user.institute_id);
    }

    const rows = filtered.map((c) => ({
      class_name: c.class_name,
      grade: c.grade,
      section: c.section,
      institute: c.institute?.name || "",
      course: c.course_assignment?.course?.course_name || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}

module.exports = new ClassService();
