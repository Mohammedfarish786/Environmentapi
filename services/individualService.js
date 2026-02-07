const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");

const User = require("../models/User");
const Institute = require("../models/Institute");

const INDIVIDUAL_ROLE_ID = 6;

class IndividualService {
  // ================= GET ALL =================
  async getAllIndividuals(page, limit) {
    try {
      const isPaginated = page && limit;
      let offset = null;
      if (isPaginated) {
        limit = limit;
        offset = (page - 1) * limit;
      }
      const { rows, count } = await User.findAndCountAll({
        where: { roleId: INDIVIDUAL_ROLE_ID },
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "mobileNo",
          "approval_status",
          "is_active",
          "created_at",
        ],
        limit: isPaginated ? limit : null,
        offset: isPaginated ? offset : null,
        order: [["created_at", "DESC"]],
      });

      return {
        data: rows,
        pagination: {
          total: count.length || count,
          page: isPaginated ? page : null,
          limit: isPaginated ? limit : null,
          totalPages: Math.ceil((count.length || count) / limit),
        },
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  // ================= UPDATE =================
  async updateIndividual(id, updateData) {
    const user = await User.findOne({
      where: { id, roleId: INDIVIDUAL_ROLE_ID },
    });

    if (!user) {
      throw new Error("Individual not found");
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobileNo",
      "approval_status",
      "is_active",
    ];

    const safeData = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        safeData[field] = updateData[field];
      }
    });

    await user.update(safeData);
    return user;
  }

  // ================= DELETE (SOFT) =================
  async deleteIndividual(id) {
    const user = await User.findOne({
      where: { id, roleId: INDIVIDUAL_ROLE_ID },
    });

    if (!user) {
      throw new Error("Individual not found");
    }

    await user.update({
      is_active: 0,
      approval_status: "deleted",
    });
  }

  // ================= EXPORT =================
  async exportIndividuals() {
    const users = await User.findAll({
      where: { roleId: INDIVIDUAL_ROLE_ID },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "mobileNo",
        "approval_status",
        "is_active",
      ],
      order: [["created_at", "DESC"]],
    });

    const rows = users.map((u, index) => ({
      "S.No": index + 1,
      "First Name": u.firstName,
      "Last Name": u.lastName,
      Email: u.email,
      Mobile: u.mobileNo,
      "Approval Status": u.approval_status,
      Active: u.is_active ? "Yes" : "No",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Individuals");

    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `individuals_${Date.now()}.xlsx`;
    const filePath = path.join(uploadDir, fileName);

    XLSX.writeFile(workbook, filePath);

    return { fileName, filePath };
  }
}

module.exports = new IndividualService();
