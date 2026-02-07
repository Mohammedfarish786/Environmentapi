const User = require("../models/User");
const Instructor = require("../models/Instructor");
const Student = require("../models/Student");
const Institute = require("../models/Institute");
const CourseInstitute = require("../models/CourseInstitute");
const Class = require("../models/class");
const Role = require("../models/Role");
const { where } = require("sequelize");
const emailService = require("../services/emailService");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { uploadBase64Image } = require("./s3uploadService");

class UserService {
  constructor() {
    if (UserService.instance) {
      return UserService.instance;
    }
    UserService.instance = this;
    return this;
  }

  // Helper method for pagination and common query options
  _buildQueryOptions(args = {}) {
    const page = +args.page || 1;
    const pageSize = +args.pageSize || 10;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    let queryOptions = {
      where: {},
      include: [],
    };

    // Add institute_id filter if provided
    if (args.institute_id) {
      queryOptions.where["institute_id"] = args.institute_id;
    }

    // Add pagination if not disabled
    if (args?.isPaginated !== false) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    return queryOptions;
  }

  // Get all users without role filtering
  async getAllUsers(args = {}) {
    try {
      const queryOptions = this._buildQueryOptions(args);

      // Include all role-specific data with correct aliases
      queryOptions.include = [
        {
          model: Instructor,
          as: "instructor", // Use correct alias
          required: false,
        },
        {
          model: Student,
          as: "studentProfile", // Use correct alias
          required: false,
        },
      ];

      const users = await User.findAndCountAll(queryOptions);

      return {
        users: users.rows,
        total: users.count,
        message: "All users fetched successfully",
      };
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Error fetching all users: " + error.message);
    }
  }

  // Get users by specific role
  async getUsersByRole(args = {}) {
    try {
      const queryOptions = this._buildQueryOptions(args);
      queryOptions.where["roleId"] = args.roleId;

      const users = await User.findAndCountAll(queryOptions);

      const roleNames = {
        1: "SuperAdmins",
        2: "Admins",
        3: "instructors",
        4: "Students",
      };

      return {
        users: users.rows,
        total: users.count,
        message: `${roleNames[args.roleId]} fetched successfully`,
      };
    } catch (error) {
      console.error("Error fetching users by role:", error);
      throw new Error("Error fetching users by role: " + error.message);
    }
  }

  // Get instructors only (roleId = 3)
  async getinstructors(args = {}) {
    try {
      const queryOptions = this._buildQueryOptions(args);
      queryOptions.where["roleId"] = 3; // instructor role ID

      // Include instructor profile data with correct alias
      queryOptions.include.push({
        model: Instructor,
        as: "instructor", // Changed from 'instructor' to 'instructorProfile'
        required: false,
      });

      const users = await User.findAndCountAll(queryOptions);

      return {
        users: users.rows,
        total: users.count,
        message: "instructors fetched successfully",
      };
    } catch (error) {
      console.error("Error fetching instructors:", error);
      throw new Error("Error fetching instructors: " + error.message);
    }
  }

  // Get students only (roleId = 4)
  async getStudents(args = {}) {
    try {
      const queryOptions = this._buildQueryOptions(args);
      queryOptions.where["roleId"] = 4; // Student role ID

      // Include student profile data with correct alias
      queryOptions.include.push({
        model: Student,
        as: "studentProfile", // Changed from 'student' to 'studentProfile'
        required: false,
      });

      const users = await User.findAndCountAll(queryOptions);

      return {
        users: users.rows,
        total: users.count,
        message: "Students fetched successfully",
      };
    } catch (error) {
      console.error("Error fetching students:", error);
      throw new Error("Error fetching students: " + error.message);
    }
  }

  // Create user with role-based logic
  async addUser(userData, creatorUser) {
    const t = await sequelize.transaction();
    let approvalStatus = "pending";
    const isIndividualSelfRegister = !creatorUser && userData.roleId === 6;
    const activationToken = isIndividualSelfRegister
      ? crypto.randomBytes(32).toString("hex")
      : null;

    const activationExpires = isIndividualSelfRegister
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    console.log("Creator User:", creatorUser);
    // ===== Approval Status Logic =====
    if (!creatorUser) {
      // Self-registration
      approvalStatus = "pending";
    } else if (creatorUser.roleId === 1) {
      // Super Admin creates anyone
      approvalStatus = "approved";
    } else if (
      creatorUser.roleId === 3 &&
      (userData.roleId === 4 || userData.roleId === 5)
    ) {
      // Institute Admin creates Instructor / Student
      approvalStatus = "approved";
    }

    try {
      const {
        firstName,
        lastName,
        email,
        password,
        roleId,
        avatar,
        institute_id,
        classAssignments,
      } = userData;
      console.log("userData", userData);
      // ===== Required field check =====
      if (!firstName || !lastName || !email || !password || !roleId) {
        throw Object.assign(new Error("Missing required fields"), {
          status: 400,
        });
      }

      // ===== Email validation =====
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw Object.assign(new Error("Invalid email format"), { status: 400 });
      }

      // ===== Duplicate email check =====
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        throw Object.assign(new Error("Email already registered"), {
          status: 400,
        });
      }

      // ===== Hash password =====
      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarurl = avatar ? await uploadBase64Image(avatar) : null;

      // ===== Determine Institute =====
      let finalInstituteId;

      if (creatorUser && creatorUser.roleId === 3) {
        // 🔥 Fetch institute_id from DB (NOT from JWT)
        const admin = await User.findByPk(creatorUser.id, {
          attributes: ["institute_id"],
          transaction: t,
        });

        if (!admin || !admin.institute_id) {
          throw Object.assign(new Error("Institute ID is required"), {
            status: 400,
          });
        }

        finalInstituteId = admin.institute_id;
      } else {
        finalInstituteId = institute_id;
      }

      if (!finalInstituteId && roleId !== 6) {
        throw Object.assign(new Error("Institute ID is required"), {
          status: 400,
        });
      }

      console.log("finalInstituteId", approvalStatus);
      // ===== Create User =====
      const newUser = await User.create(
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          avatar: avatarurl,
          roleId,
          institute_id: finalInstituteId,
          approval_status: approvalStatus,
          activation_token: activationToken,
          activation_expires: activationExpires,
          is_active: approvalStatus === "approved" ? 1 : 0,
        },
        { transaction: t },
      );

      // ===== Fetch institute for code =====
      const institute = await Institute.findByPk(finalInstituteId);
      if (!institute && roleId !== 6) {
        throw Object.assign(new Error("Invalid institute_id"), { status: 400 });
      }

      const year = new Date().getFullYear();
      const serial = String(newUser.id).padStart(4, "0");

      // ===== Role-based Profile Creation =====

      if (roleId === 4) {
        // ---- Instructor ----
        const employeeId = `EMP-${institute.institute_code}-${year}-${serial}`;

        const instructor = await Instructor.create(
          {
            user_id: newUser.id,
            institute_id: finalInstituteId,
            employee_id: employeeId,

            // ===== Professional =====
            subject_specialization: userData.subjects || "General",
            qualification: userData.qualification || "Not specified",
            experience_years: userData.experience_years || 0,
            department: userData.department || null,
            joining_date: userData.joiningDate || null,

            // ===== Personal / Contact =====
            address: userData.address || null,
            city: userData.city || null,
            state: userData.state || null,
            pincode: userData.pincode || null,
            alternate_phone: userData.alternatePhone || null,
            emergency_contact: userData.emergencyContact || null,
            emergency_contact_name: userData.emergencyContactName || null,
            blood_group: userData.bloodGroup || null,
            date_of_birth: userData.dateOfBirth || null,
            gender: userData.gender || null,
            marital_status: userData.maritalStatus || null,
          },
          { transaction: t },
        );

        // ===== Class / Course Assignments =====
        if (!Array.isArray(classAssignments) || classAssignments.length === 0) {
          throw Object.assign(
            new Error("At least one class assignment is required"),
            { status: 400 },
          );
        }

        for (const assign of classAssignments) {
          if (!assign.class_id || !assign.course_id) {
            throw Object.assign(
              new Error(
                "class_id and course_id are required in classAssignments",
              ),
              { status: 400 },
            );
          }
          await CourseInstitute.destroy({
            where: {
              course_id: assign.course_id,
              institute_id: finalInstituteId,
              class_id: assign.class_id,
            },
            transaction: t,
          });
          await CourseInstitute.create(
            {
              course_id: assign.course_id,
              institute_id: finalInstituteId,
              instructor_id: instructor.id,
              class_id: assign.class_id,
            },
            { transaction: t },
          );
        }
      } else if (roleId === 5) {
        // ---- Student ----
        const studentId = `STU-${institute.institute_code}-${year}-${serial}`;

        // ===== Validate class_id =====
        if (!userData.class_id) {
          throw Object.assign(new Error("class_id is required for student"), {
            status: 400,
          });
        }

        const classObj = await Class.findByPk(userData.class_id, {
          transaction: t,
        });

        if (!classObj || classObj.institute_id !== finalInstituteId) {
          throw Object.assign(
            new Error("Invalid class_id for this institute"),
            { status: 400 },
          );
        }
        const mapping = await CourseInstitute.findOne({
          where: { class_id: userData.class_id },
          transaction: t,
        });
        await Student.create(
          {
            user_id: newUser.id,
            institute_id: finalInstituteId,
            class_id: userData.class_id, // ✅ correct
            course_id: mapping?.course_id || null,
            student_id: studentId,
            roll_number: userData.roll_number || null,
            parent_name: userData.parent_name || "Not provided",
            parent_phone: userData.parent_phone || "Not provided",
            parent_email: userData.parent_email || null,
            address: userData.address || "Not provided",
            date_of_birth: userData.date_of_birth || null,
            blood_group: userData.blood_group || null,
          },
          { transaction: t },
        );
      }

      // ===== Send Email BEFORE commit =====
      try {
        if (isIndividualSelfRegister) {
          const activationLink = `${process.env.FRONTEND_URL}/activate_account?token=${activationToken}`;

          await emailService.sendEmail({
            to: newUser.email,
            subject: "Activate your account",
            html: `
        <h3>Welcome ${newUser.firstName}</h3>
        <p>Please activate your account by clicking below:</p>
        <a href="${activationLink}">Activate Account</a>
        <p>This link is valid for 24 hours.</p>
      `,
          });
        } else {
          await emailService.sendEmail({
            to: newUser.email,
            subject: "Your account has been created",
            html: `
        <h3>Welcome ${newUser.firstName}</h3>
        <p>Your account has been created successfully.</p>
      `,
          });
        }
      } catch (mailError) {
        throw Object.assign(
          new Error("Invalid or unreachable email address."),
          { status: 400 },
        );
      }

      await t.commit();
      return newUser;
    } catch (error) {
      await t.rollback();
      console.error("Error adding user:", error.message);
      throw error;
    }
  }

  // Update user basic information
  async updateUser(id, updateData) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error("User not found");
      }

      await user.update(updateData);
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Error updating user: " + error.message);
    }
  }

  // Update instructor profile
  async updateinstructorProfile(user_id, profileData) {
    try {
      const instructor = await instructor.findOne({ where: { user_id } });
      if (!instructor) {
        throw new Error("instructor profile not found");
      }

      await instructor.update(profileData);
      return instructor;
    } catch (error) {
      console.error("Error updating instructor profile:", error);
      throw new Error("Error updating instructor profile: " + error.message);
    }
  }

  // Update student profile
  async updateStudentProfile(user_id, profileData) {
    try {
      const student = await Student.findOne({ where: { user_id } });
      if (!student) {
        throw new Error("Student profile not found");
      }

      await student.update(profileData);
      return student;
    } catch (error) {
      console.error("Error updating student profile:", error);
      throw new Error("Error updating student profile: " + error.message);
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      throw new Error("Error finding user: " + error.message);
    }
  }

  // Get user profile by ID with role-specific data
  async getUserProfileById(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error("User not found");
      }

      let profile = null;
      if (user.roleId === 3) {
        // Get instructor profile
        profile = await Instructor.findOne({ where: { user_id: user.id } });
      } else if (user.roleId === 4) {
        // Get student profile
        profile = await Student.findOne({ where: { user_id: user.id } });
      }

      return { user, profile };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Error fetching user profile: " + error.message);
    }
  }
  async getAllPermissions() {
    try {
      const Permission = require("../models/Permission");
      // Query the database to get all permissions
      const permissions = await Permission.findAll();
      // Return the list of permissions
      return permissions;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw new Error("Error fetching permissions");
    }
  }

  // Add this method to userService.js
  async getRolePermissions(roleId) {
    try {
      const RolePermission = require("../models/RolePermission");
      const Permission = require("../models/Permission");

      // Query role permissions with permission details
      const rolePermissions = await RolePermission.findAll({
        where: { roleId: roleId },
        include: [
          {
            model: Permission,
            as: "permission", // Make sure this matches your association
            attributes: ["id", "name", "route"],
          },
        ],
      });

      return rolePermissions;
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      throw new Error("Error fetching role permissions");
    }
  }

  // Also add a method to get role with permissions
  async getRoleWithPermissions(roleId) {
    try {
      const Role = require("../models/Role");
      const RolePermission = require("../models/RolePermission");
      const Permission = require("../models/Permission");

      const role = await Role.findByPk(roleId, {
        include: [
          {
            model: Permission,
            as: "permissions", // Make sure this matches your association
            through: {
              model: RolePermission,
              as: "RolePermission",
            },
          },
        ],
      });

      return role;
    } catch (error) {
      console.error("Error fetching role with permissions:", error);
      throw new Error("Error fetching role with permissions");
    }
  }

  async saveRole(roleData) {
    const transaction = await sequelize.transaction();
    try {
      const Role = require("../models/Role");
      const RolePermission = require("../models/RolePermission");
      const Permission = require("../models/Permission");
      let role;

      console.log("Saving role with data:", roleData); // Debug log

      // Check if updating existing role or creating new one
      if (roleData.id && roleData.id !== 0) {
        // Update existing role
        role = await Role.findByPk(roleData.id);
        if (!role) {
          throw new Error("Role not found");
        }

        // Update role basic info - INCLUDE ALL FIELDS
        await role.update(
          {
            name: roleData.name,
            label: roleData.label,
            status: roleData.status,
            desc: roleData.desc,
            order: roleData.order,
          },
          { transaction },
        );

        // Delete existing permissions for this role
        const deletedCount = await RolePermission.destroy({
          where: { roleId: roleData.id },
          transaction,
        });
        console.log("Deleted existing permissions count:", deletedCount);
      } else {
        // Create new role - INCLUDE ALL FIELDS
        console.log("add roleData", roleData);
        console.log({
          name: roleData.name,
          label: roleData.label,
          parent: roleData.parent | null,
          status: roleData.status,
          desc: roleData.desc,
          order: roleData.order,
        });
        role = await Role.create(
          {
            name: roleData.name,
            label: roleData.label,
            parent: roleData.parent | null,
            status: roleData.status,
            desc: roleData.desc,
            order: roleData.order,
          },
          { transaction },
        );
      }

      // Insert new permissions
      if (roleData.permissions && roleData.permissions.length > 0) {
        const rolePermissions = roleData.permissions.map((perm) => ({
          roleId: role.id,
          permissionId: perm.permissionId,
          viewPermission: !!perm.view,
          addPermission: !!perm.add,
          editPermission: !!perm.edit,
          deletePermission: !!perm.delete,
          exportPermission: !!perm.export,
        }));

        console.log("Creating role permissions:", rolePermissions);

        const createdPermissions = await RolePermission.bulkCreate(
          rolePermissions,
          { transaction },
        );
        console.log(
          "Successfully created permissions:",
          createdPermissions.length,
        );
      }

      // Commit transaction
      await transaction.commit();

      // Return complete role with permissions
      const completeRole = await Role.findByPk(role.id, {
        include: [
          {
            model: Permission,
            as: "permissions",
            through: {
              model: RolePermission,
              as: "RolePermission",
            },
          },
        ],
      });

      return completeRole;
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error("Error saving role:", error);
      throw error;
    }
  }
  async getAllRoles() {
    try {
      const roles = await Role.findAll();
      return roles;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }
}

module.exports = new UserService();
