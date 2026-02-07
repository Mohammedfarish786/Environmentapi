const {
  Course,
  CourseInstitute,
  Institute,
  Instructor,
  Class,
  User,
  Student,
  CourseContent,
} = require("../models"); // 👈 index.js
const XLSX = require("xlsx");
const { fn, col } = require("sequelize");
const { uploadBase64Image, uploadBase64File } = require("./s3uploadService");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const path = require("path");
class courseService {
  constructor() {
    if (courseService.instance) return courseService.instance;
    courseService.instance = this;
  }

  async getAllCourses(page, limit) {
    try {
      const isPaginated = page && limit;
      const offset = (page - 1) * limit;

      const { count, rows } = await Course.findAndCountAll({
        attributes: [
          "id",
          "course_name",
          "about_course",
          "description",
          "thumbnail",
          "rating",
          "price",
          "duration",
          "course_level",
          "what_you_will_learn",
          "hashtags",
          "total_weeks",
          "total_ppt",
          "visibility",
          "status",
          "approvedstatus",
          "enroll_link",
          "detail_link",
          "created_at",
          "updated_at",
          [fn("COUNT", col("students.id")), "total_enrolled_students"],
        ],
        include: [
          {
            model: Student,
            as: "students",
            attributes: [],
            required: false,
          },
        ],
        group: ["Course.id"],
        order: [["created_at", "DESC"]],
        subQuery: false,
        limit: isPaginated ? limit : undefined,
        offset: isPaginated ? offset : undefined,
      });

      return {
        rows,
        pagination: {
          total: count.length || count,
          page,
          limit,
          totalPages: Math.ceil((count.length || count) / limit),
        },
      };
    } catch (error) {
      console.error("getAllCourses error:", error);
      throw error;
    }
  }

  async getCourseById(id) {
    try {
      const course = await Course.findByPk(id, {
        include: [
          {
            model: CourseInstitute,
            as: "courseInstitutes",
            include: [
              {
                model: Instructor,
                as: "instructor",
                include: [
                  {
                    model: User,
                    as: "user",
                    attributes: ["firstName", "lastName", "email", "mobileNo"],
                  },
                ],
              },
            ],
          },
          {
            model: Student,
            as: "students",
            attributes: [],
            required: false,
          },
          {
            model: CourseContent,
            as: "CourseContents",
            attributes: [
              "id",
              "month_number",
              "week_number",
              "content_title",
              "content_type",
              "content_url",
            ],
            order: [
              ["month_number", "ASC"],
              ["week_number", "ASC"],
            ],
          },
        ],
      });

      return course;
    } catch (error) {
      console.error("getCourseById error:", error);
      throw error;
    }
  }

  // Create course
  async createCourse(data) {
    const t = await sequelize.transaction();
    try {
      if (!data.course_name) {
        throw new Error("course_name is required");
      }

      // Upload thumbnail
      const thumbnailUrl = await uploadBase64Image(data.thumbnail);

      // Create course
      const course = await Course.create(
        {
          course_name: data.course_name,
          about_course: data.about_course,
          description: data.description,
          thumbnail: thumbnailUrl,
          price: data.price,
          duration: data.duration,
          status: data.status,
          course_level: data.course_level,
          visibility: data.visibility,
          hashtags: data.hashtags,
          total_weeks: data.total_weeks,
          total_ppt: data.total_ppt,
          what_you_will_learn: data.what_you_will_learn,
          enroll_link: data.enroll_link,
          detail_link: data.detail_link,
        },
        { transaction: t },
      );

      // Save contents
      if (data.contents && data.contents.length > 0) {
        for (const item of data.contents) {
          let contentUrl = item.content_url;

          if (item.content_url) {
            contentUrl = await uploadBase64File(item.content_url);
          }
          await CourseContent.create(
            {
              course_id: course.id,
              month_number: item.month_number,
              week_number: item.week_number,
              content_title: item.content_title,
              content_type: item.content_type,
              content_url: contentUrl,
            },
            { transaction: t },
          );
        }
      }

      await t.commit();
      return course;
    } catch (error) {
      await t.rollback();
      console.error("Error creating course:", error);
      throw error;
    }
  }

  // Edit course
  async editCourse(data, id) {
    const t = await sequelize.transaction();
    try {
      const course = await Course.findByPk(id);
      if (!course) throw new Error("Course not found");

      // Thumbnail upload only if base64 is sent
      if (data.thumbnail && data.thumbnail.startsWith("data:")) {
        const thumbnailUrl = await uploadBase64Image(data.thumbnail);
        data.thumbnail = thumbnailUrl;
      } else {
        delete data.thumbnail;
      }

      // Update course main table
      await course.update(
        {
          course_name: data.course_name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          status: data.status,
          course_level: data.course_level,
          visibility: data.visibility,
          hashtags: data.hashtags,
          total_weeks: data.total_weeks,
          total_ppt: data.total_ppt,
          what_you_will_learn: data.what_you_will_learn,
          enroll_link: data.enroll_link,
          detail_link: data.detail_link,
          ...(data.thumbnail && { thumbnail: data.thumbnail }),
        },
        { transaction: t },
      );

      // ---- Handle course contents ----
      if (data.contents) {
        // Simple strategy: delete old and insert new
        // (Easy and safe for admin panel editing)

        await CourseContent.destroy({
          where: { course_id: id },
          transaction: t,
        });

        for (const item of data.contents) {
          let contentUrl = item.content_url;

          if (item.content_url && item.content_url.startsWith("data:")) {
            contentUrl = await uploadBase64File(item.content_url);
          }
          await CourseContent.create(
            {
              course_id: id,
              month_number: item.month_number,
              week_number: item.week_number,
              content_title: item.content_title,
              content_type: item.content_type,
              content_url: contentUrl,
            },
            { transaction: t },
          );
        }
      }

      await t.commit();
      return course;
    } catch (error) {
      await t.rollback();
      console.error("Error updating course:", error);
      throw error;
    }
  }

  // Delete course
  async deleteCourse(id) {
    const t = await sequelize.transaction();
    try {
      const course = await Course.findByPk(id, { transaction: t });
      if (!course) throw new Error("Course not found");

      await course.destroy({ transaction: t });
      await t.commit();
      return course;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // Export courses (simple flat data for reports)

  async exportCourses() {
    const courses = await Course.findAll({
      attributes: [
        "id",
        "course_name",
        "description",
        "price",
        "duration",
        "status",
        "created_at",
      ],
      include: [
        {
          model: CourseInstitute,
          as: "courseInstitutes",
          include: [
            {
              model: Institute,
              as: "institute",
              attributes: ["name", "institute_code"],
            },
            {
              model: Instructor,
              as: "instructor",
              attributes: ["employee_id"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["firstName", "lastName", "email", "mobileNo"],
                },
              ],
            },
            {
              model: Class,
              as: "class",
              attributes: ["class_name", "grade", "section"],
            },
          ],
        },
        {
          model: CourseContent,
          as: "CourseContents",
          attributes: [
            "month_number",
            "week_number",
            "content_title",
            "content_type",
            "content_url",
          ],
        },
      ],
    });

    const workbook = new ExcelJS.Workbook();

    for (const course of courses) {
      const sheet = workbook.addWorksheet(course.course_name.substring(0, 30));

      // Course details
      sheet.addRow(["Course Name", course.course_name]);
      sheet.addRow(["Description", course.description]);
      sheet.addRow(["Price", course.price]);
      sheet.addRow(["Duration", course.duration]);
      sheet.addRow(["Status", course.status]);
      sheet.addRow(["Created At", course.created_at]);
      sheet.addRow([]);

      // Institute / Instructor
      sheet.addRow([
        "Institute",
        "Institute Code",
        "Instructor",
        "Email",
        "Mobile",
        "Class",
        "Grade",
        "Section",
      ]).font = { bold: true };

      course.courseInstitutes.forEach((ci) => {
        sheet.addRow([
          ci.institute?.name || "",
          ci.institute?.institute_code || "",
          `${ci.instructor?.user?.firstName || ""} ${ci.instructor?.user?.lastName || ""}`,
          ci.instructor?.user?.email || "",
          ci.instructor?.user?.mobileNo || "",
          ci.class?.class_name || "",
          ci.class?.grade || "",
          ci.class?.section || "",
        ]);
      });

      sheet.addRow([]);

      // Course content table
      sheet.addRow([
        "Month",
        "Week",
        "Content Title",
        "Content Type",
        "Content URL",
      ]).font = { bold: true };

      course.CourseContents.forEach((content) => {
        sheet.addRow([
          content.month_number,
          content.week_number,
          content.content_title,
          content.content_type,
          content.content_url,
        ]);
      });

      sheet.columns.forEach((col) => (col.width = 25));
    }

    return workbook;
  }

  async importcourses(fileBuffer) {
    const t = await sequelize.transaction();
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      const courseSheet = workbook.Sheets[workbook.SheetNames[0]];
      const contentSheet = workbook.Sheets[workbook.SheetNames[1]];

      const courseRows = XLSX.utils.sheet_to_json(courseSheet);
      const contentRows = XLSX.utils.sheet_to_json(contentSheet);

      const success = [];
      const failed = [];

      // ---- STEP 1: Import Courses ----
      const courseMap = {};
      // course_name → course_id

      for (const [index, row] of courseRows.entries()) {
        try {
          if (!row.course_name) {
            failed.push({
              rowNumber: index + 2,
              row,
              error: "course_name is required",
            });
            continue;
          }

          const name = row.course_name.trim();

          let course = await Course.findOne({ where: { course_name: name } });

          // Create only if not exists
          if (!course) {
            course = await Course.create(
              {
                course_name: name,
                description: row.description?.trim() || null,
                price: row.price || 0,
                duration: row.duration || null,
                status: row.status || "active",
              },
              { transaction: t },
            );
          }

          courseMap[name] = course.id;
          success.push(course);
        } catch (err) {
          failed.push({ rowNumber: index + 2, row, error: err.message });
        }
      }

      // ---- STEP 2: Import Course Contents ----
      for (const [index, row] of contentRows.entries()) {
        try {
          if (!row.course_name || !row.content_title) {
            failed.push({
              rowNumber: index + 2,
              row,
              error: "course_name and content_title required",
            });
            continue;
          }

          const courseId = courseMap[row.course_name.trim()];

          if (!courseId) {
            failed.push({
              rowNumber: index + 2,
              row,
              error: "Course not found for this content row",
            });
            continue;
          }

          await CourseContent.create(
            {
              course_id: courseId,
              month_number: row.month_number || 1,
              week_number: row.week_number || 1,
              content_title: row.content_title.trim(),
              content_type: row.content_type || "ppt",
              content_url: row.content_url || "",
            },
            { transaction: t },
          );
        } catch (err) {
          failed.push({ rowNumber: index + 2, row, error: err.message });
        }
      }

      await t.commit();
      return { success, failed };
    } catch (error) {
      await t.rollback();
      console.error("Error importing courses:", error);
      throw error;
    }
  }
}

module.exports = new courseService();
