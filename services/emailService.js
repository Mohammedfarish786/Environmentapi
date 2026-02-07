const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    if (EmailService.instance) return EmailService.instance;
    EmailService.instance = this;
  }

  async sendEmail(data) {
    console.log("data email", data);
    const transporter = nodemailer.createTransport({
      host: "asmtp.mail.hostpoint.ch",
      port: 587,
      auth: {
        user: "et@geomaticx.com",
        pass: "Geomaticx@ET",
      },
    });

    let res = await transporter.sendMail({
      from: "Geomaticx GeoVerse <et@geomaticx.com>", // 👈 name added
      to: data.to,
      subject: data.subject,
      html: data.html,
    });

    console.log("Email sent:", res);
  }
}

module.exports = new EmailService();
