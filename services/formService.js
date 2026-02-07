const Form = require("../models/form");

class FormService {
  async getAllForms() {
    const forms = await Form.findAll();
    return { forms };
  }

  async getFormById(id) {
    const form = await Form.findByPk(id);
    if (!form) throw new Error("Form not found");
    return { form };
  }

  async createForm(data) {
    const { form_name, form_fields, icon_id, admin_email_id, user_email_id } =
      data;

    if (!form_name) {
      throw new Error("form_name is required");
    }

    if (!Array.isArray(form_fields)) {
      throw new Error("form_fields must be an array");
    }

    // 🔹 Validate ADMIN email template
    if (admin_email_id) {
      const adminTemplate = await EmailTemplate.findByPk(admin_email_id);
      if (!adminTemplate) {
        throw new Error("Invalid admin_email_id");
      }
    }

    // 🔹 Validate USER email template
    if (user_email_id) {
      const userTemplate = await EmailTemplate.findByPk(user_email_id);
      if (!userTemplate) {
        throw new Error("Invalid user_email_id");
      }
    }

    const form = await Form.create({
      form_name,
      form_fields,
      icon_id: icon_id || null,
      admin_email_id: admin_email_id || null,
      user_email_id: user_email_id || null,
    });

    return { form };
  }

  async updateForm(id, data) {
    const form = await Form.findByPk(id);
    if (!form) throw new Error("Form not found");

    const { form_name, form_fields, icon_id, admin_email_id, user_email_id } =
      data;

    // 🔹 Validate form_name (if provided)
    if (form_name !== undefined && !form_name) {
      throw new Error("form_name cannot be empty");
    }

    // 🔹 Validate form_fields (if provided)
    if (form_fields !== undefined && !Array.isArray(form_fields)) {
      throw new Error("form_fields must be an array");
    }

    // 🔹 Validate ADMIN email template (if provided)
    if (admin_email_id !== undefined && admin_email_id !== null) {
      const adminTemplate = await EmailTemplate.findByPk(admin_email_id);
      if (!adminTemplate) {
        throw new Error("Invalid admin_email_id");
      }
    }

    // 🔹 Validate USER email template (if provided)
    if (user_email_id !== undefined && user_email_id !== null) {
      const userTemplate = await EmailTemplate.findByPk(user_email_id);
      if (!userTemplate) {
        throw new Error("Invalid user_email_id");
      }
    }

    await form.update({
      ...(form_name !== undefined && { form_name }),
      ...(form_fields !== undefined && { form_fields }),
      ...(icon_id !== undefined && { icon_id }),
      ...(admin_email_id !== undefined && { admin_email_id }),
      ...(user_email_id !== undefined && { user_email_id }),
    });

    return { form };
  }

  async deleteForm(id) {
    const form = await Form.findByPk(id);
    if (!form) throw new Error("Form not found");

    await form.destroy();
    return { deletedId: id };
  }
}

module.exports = new FormService();
