const { User, Institute, Instructor, Student } = require("../models");

class profileService {
  constructor() {
    if (profileService.instance) {
      return profileService.instance;
    }
    profileService.instance = this;
    return this;
  }

  // ---------- USER BASE PROFILE ----------
  async getUserProfileById(id, user_id, role_id) {
    if (id !== user_id && role_id !== 1)
      throw new Error("Forbidden: Only authorized users can fetch profile");

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password", "reset_otp", "reset_otp_expiry"] },
    });

    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUserProfileById(id, data, user_id, role_id) {
    if (id !== user_id && role_id !== 1)
      throw new Error("Forbidden: Only authorized users can update profile");

    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update(data);
    return user;
  }

  // ---------- INSTITUTE ----------
  async getInstituteProfileById(id, user_id, role_id) {
    const institute = await Institute.findByPk(id);
    if (!institute) throw new Error("Institute not found");
    if (institute.status === 0) throw new Error("Institute is not active");
    if (institute.representative_id !== user_id && role_id !== 1)
      throw new Error("Forbidden: Unauthorized access");

    const representative = await User.findByPk(institute.representative_id, {
      attributes: { exclude: ["password", "reset_otp", "reset_otp_expiry"] },
    });

    return { ...institute.dataValues, representative };
  }

  async updateInstituteProfileById(id, data, role_id) {
    const institute = await Institute.findByPk(id);
    if (!institute) throw new Error("Institute not found");
    if (institute.status === 0) throw new Error("Institute is not active");
    if (institute.representative_id !== data.representative_id && role_id !== 1)
      throw new Error("Forbidden: Unauthorized update");

    await institute.update(data);
    return institute;
  }

  // ---------- TEACHER ----------
  async getTeacherProfileByUserId(user_id, requester_id, role_id) {
    if (user_id !== requester_id && ![1, 3, 4].includes(role_id))
      throw new Error("Forbidden: Unauthorized access");

    const teacher = await Instructor.findOne({ where: { user_id } });
    if (!teacher) throw new Error("Teacher profile not found");

    const user = await User.findByPk(user_id, {
      attributes: { exclude: ["password", "reset_otp", "reset_otp_expiry"] },
    });

    return { ...teacher.dataValues, user };
  }

  async updateTeacherProfileByUserId(user_id, data, role_id, requester_id) {
    if (user_id !== requester_id && ![1, 3, 4].includes(role_id))
      throw new Error("Forbidden: Unauthorized update");

    const teacher = await Instructor.findOne({ where: { user_id } });
    if (!teacher) throw new Error("Teacher profile not found");

    await teacher.update(data);
    return teacher;
  }

  // ---------- STUDENT ----------
  async getStudentProfileByUserId(user_id, requester_id, role_id) {
    if (user_id !== requester_id && ![1, 3, 4].includes(role_id))
      throw new Error("Forbidden: Unauthorized access");

    const student = await Student.findOne({ where: { user_id } });
    if (!student) throw new Error("Student profile not found");

    const user = await User.findByPk(user_id, {
      attributes: { exclude: ["password", "reset_otp", "reset_otp_expiry"] },
    });

    return { ...student.dataValues, user };
  }

  async updateStudentProfileByUserId(user_id, data, role_id) {
    if (![1, 3, 4].includes(role_id))
      throw new Error("Forbidden: Unauthorized update");

    const student = await Student.findOne({ where: { user_id } });
    if (!student) throw new Error("Student profile not found");

    await student.update(data);
    return student;
  }
}

module.exports = new profileService();
