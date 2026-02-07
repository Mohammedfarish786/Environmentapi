const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const EmailService = require("../services/emailService");
const CommonService = require("../services/commonService");
const instituteService = require("../services/instituteService");
const userService = require("../services/userService");

const { Op } = require("sequelize");
const { User, Role, Permission } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret";

// Login Controller
const mapRegistrationError = (message) => {
  const errorMap = {
    // Common validation
    "Missing required fields": 400,
    "All required fields must be provided": 400,
    "Invalid email format": 400,
    "Invalid phone number": 400,
    "Invalid pincode": 400,
    "schooladmindata is required": 400,
    "school_id is required for Teacher": 400,
    "school_id is required for Student": 400,

    // Duplicate conflicts
    "Email already registered": 409,
    "Institute email already registered": 409,
    "Institute code already exists": 409,
    "Admin email already registered": 409,
  };

  return errorMap[message] || 500;
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: "role",
          include: [
            {
              model: Permission,
              as: "permissions",
            },
          ],
        },
      ],
    });
    console.log("userdata", user);
    if (!user) {
      return res
        .status(401)
        .json({ status: 0, message: "Invalid email or password" });
    }

    if (user.approval_status !== "approved") {
      return res.status(403).json({
        status: 0,
        message: `Account ${user.approval_status}. Please wait for admin approval.`,
      });
    }

    if (user.is_active == 0) {
      return res.status(403).json({
        status: 0,
        message: "Account is disabled. Contact admin.",
      });
    }

    //const saltRounds = 10; // The number of rounds to salt the password
    // const hashedPassword = await bcrypt.hash(password, saltRounds);
    //  console.log("hashedPassword",hashedPassword)
    const isMatch = await bcrypt.compare(password, user.password);
    //const isMatch = 1;
    // console.log("Stored hash:", user.password);
    // console.log("Hash length:", user.password.length);
    console.log("isMatch", isMatch);
    if (!isMatch) {
      console.log("Invalid password");
      return res
        .status(401)
        .json({ status: 0, message: "Invalid email or password" });
    }

    const accessToken = jwt.sign(
      { id: user.id, roleId: user.roleId },
      JWT_SECRET,
      { expiresIn: "2d" },
    );
    const refreshToken = jwt.sign(
      { id: user.id, roleId: user.roleId },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const response = {
      status: 1,
      message: "",
      data: {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNo: user.mobileNo,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          role: user.role,
          roleId: user.role.id,
          permissions: user.role.permissions,
        },
        accessToken,
        refreshToken,
      },
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 0, message: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body;
    let user;

    // Case 1: Logged-in user (change password)
    if (currentPassword && req.user && req.user.id) {
      user = await User.findByPk(req.user.id);
    }

    // Case 2: Forgot password flow (email)
    else if (email) {
      user = await User.findOne({ where: { email } });
    }
    if (!user) {
      return CommonService.sendResponse(res, 400, 1, "User not found", {});
    }
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return CommonService.sendResponse(
          res,
          400,
          1,
          "Current password is incorrect",
          {},
        );
      }
    } else {
      // For cases like forgot password where current password is not provided
      if (user.otp_verified == 0) {
        return CommonService.sendResponse(
          res,
          400,
          1,
          "User not verified or OTP not checked",
          {},
        );
      }
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword, otp_verified: 0 });
    await EmailService.sendEmail({
      to: user.email,
      subject: "Password Changed Successfully",
      html: `
      <h3>Geomaticx GeoVerse</h3>
      <p>Hello ${user.firstName || ""},</p>
      <p>Your password has been changed successfully.</p>
    `,
    });

    return CommonService.sendResponse(
      res,
      201,
      1,
      "Password updated successfully",
      {},
    );
  } catch (err) {
    console.error("Error changing password:", err);
    return CommonService.sendResponse(
      res,
      500,
      0,
      err.message || "Internal server error",
      {},
    );
  }
};
// POST api/auth/check-otp
const checkOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return CommonService.sendResponse(res, 404, 0, "User not found", {});
    }

    console.log("User OTP:", user.reset_otp);
    console.log("Provided OTP:", otp);
    console.log("OTP Expiry:", user.reset_otp_expiry);
    console.log("Current Time:", Date.now());

    // Convert expiry date to timestamp
    const expiryTime = new Date(user.reset_otp_expiry).getTime();
    console.log("Expiry Time (timestamp):", expiryTime);

    // Validate OTP
    if (
      user.reset_otp !== otp ||
      !user.reset_otp_expiry ||
      expiryTime < Date.now()
    ) {
      return CommonService.sendResponse(
        res,
        400,
        0,
        "Invalid or expired OTP",
        {},
      );
    }

    // Mark OTP verified
    user.otp_verified = 1;

    // Clear OTP so it can't be reused
    user.reset_otp = null;
    user.reset_otp_expiry = null;

    await user.save();

    return CommonService.sendResponse(
      res,
      200,
      1,
      "OTP verified successfully",
      {},
    );
  } catch (error) {
    console.error("Check OTP error:", error);
    return CommonService.sendResponse(res, 500, 0, "Internal server error", {});
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return CommonService.sendResponse(
        res,
        404,
        0,
        "User with this email does not exist",
        {},
      );
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP + Expiry (10 mins)
    user.reset_otp = otp;
    user.reset_otp_expiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send Email using your EmailService
    await EmailService.sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h3>Geomaticx GeoVerse</h3>
        <p>Your OTP for password reset:</p>
        <h2>${otp}</h2>
        <p>OTP expires in 10 minutes.</p>
      `,
    });

    return CommonService.sendResponse(res, 200, 1, "OTP sent to email", {});
  } catch (err) {
    console.error("Forgot password error:", err);
    return CommonService.sendResponse(res, 500, 0, err, {});
  }
};
const registerInstitute = async (req, res) => {
  try {
    let approved = "pending";

    // Case 1: If logged in user exists
    if (req.user) {
      const roleId = req.user.roleId;

      // Only Super Admin can auto-approve
      if (roleId === 1) {
        approved = "approved";
      } else {
        return CommonService.sendResponse(
          res,
          403,
          0,
          "Forbidden: Only Super Admin can create approved institutes",
          {},
        );
      }
    }
    console.log("Approved:", approved);
    // Case 2: Public self-registration → approved remains "No"

    const institute = await instituteService.createInstitute(
      req.body,
      approved,
    );

    return CommonService.sendResponse(
      res,
      201,
      1,
      approved === "approved"
        ? "Institute registered and approved successfully"
        : "Institute registered successfully and pending approval",
      institute,
    );
  } catch (error) {
    console.error("Error registering institute:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Internal server error",
      {},
    );
  }
};

const registerIndividual = async (req, res) => {
  try {
    const creator = req.user || null;
    const individual = await userService.addUser(req.body, creator);

    return CommonService.sendResponse(
      res,
      201,
      1,
      "User registered successfully",
      individual,
    );
  } catch (error) {
    console.error("Error registering individual:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Internal server error",
      {},
    );
  }
};
const registerStudent = async (req, res) => {
  try {
    let creator = null;

    // If token present → check permission
    if (req.user) {
      const user = await User.findByPk(req.user.id);

      // Only Super Admin (1) or Institute Admin (3)
      if (user.roleId !== 1 && user.roleId !== 3) {
        return CommonService.sendResponse(
          res,
          403,
          0,
          "Forbidden: Only admin can register students",
          {},
        );
      }

      creator = user; // pass creator for auto approval
    }

    const studentData = req.body;

    // Pass creator (null if self-registration)
    const student = await userService.addUser(studentData, creator);

    return CommonService.sendResponse(
      res,
      201,
      1,
      "Student registered successfully",
      student,
    );
  } catch (error) {
    console.error("Error registering student:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Internal server error",
      {},
    );
  }
};
const registerTeacher = async (req, res) => {
  try {
    let creator = null;

    if (req.user) {
      const user = await User.findByPk(req.user.id);

      // Only Super Admin (1) or Institute Admin (3)
      if (user.roleId !== 1 && user.roleId !== 3) {
        return CommonService.sendResponse(
          res,
          403,
          0,
          "Forbidden: Only admin can register teachers",
          {},
        );
      }

      creator = user; // pass creator
    }

    const teacherData = req.body;
    console.log("Teacher Data:", teacherData);
    const teacher = await userService.addUser(teacherData, creator);

    return CommonService.sendResponse(
      res,
      201,
      1,
      "Teacher registered successfully",
      teacher,
    );
  } catch (error) {
    console.error("Error registering teacher:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Internal server error",
      {},
    );
  }
};


module.exports = {
  login,
  changePassword,
  forgotPassword,
  registerInstitute,
  registerIndividual,
  registerStudent,
  registerTeacher,
  checkOtp,
};
