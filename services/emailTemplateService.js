const EmailTemplate = require("../models/emailTemplate");
const emailService = require("../services/emailService");

class EmailTemplateService {
  async getAllTemplates() {
    const templates = await EmailTemplate.findAll();
    return { templates };
  }

  async getTemplateById(id) {
    const template = await EmailTemplate.findByPk(id);
    if (!template) throw new Error("Template not found");
    return { template };
  }

  async createTemplate(data) {
    const { title, subject, template_html } = data;
    if (!title || !subject || !template_html)
      throw new Error("All fields are required");

    const template = await EmailTemplate.create({
      title,
      subject,
      template_html,
    });

    return { template };
  }

  async updateTemplate(id, data) {
    const template = await EmailTemplate.findByPk(id);
    if (!template) throw new Error("Template not found");

    await template.update(data);
    return { template };
  }

  async deleteTemplate(id) {
    const template = await EmailTemplate.findByPk(id);
    if (!template) throw new Error("Template not found");

    await template.destroy();
    return { deletedId: id };
  }

  // ===== SEND EMAIL USING TEMPLATE =====
  async sendEmailUsingTemplate(templateId, to, variables = {}) {
    const template = await EmailTemplate.findByPk(templateId);
    if (!template) throw new Error("Template not found");

    let html = template.template_html;

    // Handle blocks + variables
    Object.keys(variables).forEach((key) => {
      const value = variables[key];

      if (value === undefined || value === null || value === "") {
        // Remove entire block if empty
        const blockRegex = new RegExp(
          `<!--${key}-->[\\s\\S]*?<!--\\/${key}-->`,
          "g",
        );
        html = html.replace(blockRegex, "");
      } else {
        // Replace variable
        const varRegex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(varRegex, value);
      }
    });

    // Safety cleanup: remove any leftover placeholders or empty blocks
    html = html.replace(/{{.*?}}/g, "");
    html = html.replace(/<p>\s*<\/p>/g, "");

    await emailService.sendEmail({
      to,
      subject: template.subject,
      html,
    });

    return { to, templateId };
  }
}

module.exports = new EmailTemplateService();
