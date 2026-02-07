const UserService = require("../services/userService");
const CommonService = require("../services/commonService");

// Get all users without filtering
const getAllUsers = async (req, res) => {
  try {
    const allUsers = await UserService.getAllUsers(req.query);
    CommonService.sendResponse(
      res,
      200,
      1,
      "All users fetched successfully",
      allUsers,
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

// Get users by roleId (from path parameter)
const getUsersByRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    // Validate roleId
    if (![1, 2, 3, 4].includes(roleIdNum)) {
      return CommonService.sendResponse(
        res,
        400,
        0,
        "Invalid roleId. Must be 1(SuperAdmin), 2(Admin), 3(Teacher), or 4(Student)",
        [],
      );
    }

    let result;

    if (roleIdNum === 3) {
      // Get teachers only
      result = await UserService.getTeachers(req.query);
    } else if (roleIdNum === 4) {
      // Get students only
      result = await UserService.getStudents(req.query);
    } else {
      // Get users by specific roleId (SuperAdmin, Admin)
      result = await UserService.getUsersByRole({
        ...req.query,
        roleId: roleIdNum,
      });
    }

    CommonService.sendResponse(res, 200, 1, result.message, result);
  } catch (error) {
    console.error("Error fetching users by role:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    CommonService.sendResponse(res, 200, 1, "User found", user);
  } catch (error) {
    console.error("Error fetching user:", error);
    CommonService.sendResponse(res, 404, 0, error.message, []);
  }
};

// Get user profile by ID
const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await UserService.getUserProfileById(id);
    CommonService.sendResponse(
      res,
      200,
      1,
      "User profile fetched successfully",
      data,
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobileNo,
      username,
      password,
      roleId,
      school_id,
      // Teacher specific fields
      subject_specialization,
      qualification,
      // Student specific fields
      class: studentClass,
      section,
      parent_name,
      parent_phone,
      address,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobileNo ||
      !username ||
      !roleId
    ) {
      return CommonService.sendResponse(
        res,
        400,
        0,
        "Missing required fields: firstName, lastName, email, mobileNo, username, roleId",
        [],
      );
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(mobileNo)) {
      return CommonService.sendResponse(
        res,
        400,
        0,
        "Invalid mobile number. It should be exactly 10 digits.",
        [],
      );
    }

    // Validate school_id for teachers and students
    if ((roleId === 3 || roleId === 4) && !school_id) {
      return CommonService.sendResponse(
        res,
        400,
        0,
        "school_id is required for teachers and students",
        [],
      );
    }

    const userData = {
      firstName,
      lastName,
      email,
      password: password || "123456",
      mobileNo,
      username,
      roleId,
      school_id,
      // Additional fields for specific roles
      subject_specialization,
      qualification,
      class: studentClass,
      section,
      parent_name,
      parent_phone,
      address,
    };

    const newUser = await UserService.addUser(userData);
    CommonService.sendResponse(
      res,
      201,
      1,
      "User created successfully",
      newUser,
    );
  } catch (error) {
    console.error("Error creating user:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedUser = await UserService.updateUser(id, updateData);
    CommonService.sendResponse(
      res,
      200,
      1,
      "User updated successfully",
      updatedUser,
    );
  } catch (error) {
    console.error("Error updating user:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

// Update teacher profile
const updateTeacherProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const profileData = req.body;
    const updatedProfile = await UserService.updateTeacherProfile(
      user_id,
      profileData,
    );
    CommonService.sendResponse(
      res,
      200,
      1,
      "Teacher profile updated successfully",
      updatedProfile,
    );
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const profileData = req.body;
    const updatedProfile = await UserService.updateStudentProfile(
      user_id,
      profileData,
    );
    CommonService.sendResponse(
      res,
      200,
      1,
      "Student profile updated successfully",
      updatedProfile,
    );
  } catch (error) {
    console.error("Error updating student profile:", error);
    CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

module.exports = {
  getAllUsers,
  getUsersByRole,
  getUserById,
  getUserProfileById,
  createUser,
  updateUser,
  updateTeacherProfile,
  updateStudentProfile,
};
