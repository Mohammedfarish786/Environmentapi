const pages = require("../models/pages");
const testimonials = require("../models/testimonials");
const associates = require("../models/associates");
const courses = require("../models/course");
const categories = require("../models/category");
const { Op, where } = require("sequelize");
const cities = require("../models/city");
const states = require("../models/state");
const countries = require("../models/country");
const constants = require("../models/constants");
const form = require("../models/form");
const emailTemplate = require("../models/emailTemplate");
const emailTemplateService = require("../services/emailTemplateService");
const { EmailTemplate } = require("../models");
const User = require("../models/User");
class publicService {
  constructor() {
    if (publicService.instance) {
      return publicService.instance;
    }
    publicService.instance = this;
    return this;
  }
  async getHomepage(req, res) {
    try {
      const homepageData = await pages.findOne({
        where: { route: "/", status: "published" },
      });

      const testimonialData = await testimonials.findAll({
        where: { status: "active" },
      });
      const associateData = await associates.findAll({
        where: { status: "active" },
      });
      const courseData = await courses.findAll({
        where: { status: "active" },
        limit: 5,
        order: [["created_at", "DESC"]],
      });
      const categoryData = await categories.findAll({
        where: { status: "active" },
      });

      // ===== Map Courses =====
      const coursesSection = {
        title: {
          prefix: "Featured",
          highlight: "Courses",
        },
        subtitle: "Learn industry-ready skills from experts",
        items: courseData.map((c) => ({
          id: c.id,
          title: c.course_name,
          image: c.thumbnail,
          duration: c.duration,
          rating: Number(c.rating),
          enrollLink: c.enroll_link,
          detailsLink: c.detail_link,
        })),
      };

      // ===== Map Categories =====
      const categoriesSection = {
        title: {
          prefix: "Our Top",
          highlight: "Categories",
        },
        items: categoryData.map((cat) => ({
          id: cat.id,
          icon: cat.icon,
          title: cat.title,
        })),
      };

      // ===== Map Associates =====
      const associatesSection = {
        title: {
          prefix: "Our",
          highlight: "Associates",
        },
        partners: associateData.map((a) => ({
          id: a.id,
          name: a.name,
          logo: a.logo,
        })),
      };

      // ===== Map Testimonials =====
      const testimonialsSection = {
        title: {
          prefix: "Customer",
          highlight: "Testimonials",
        },
        items: testimonialData.map((t) => ({
          id: t.id,
          name: t.name,
          location: t.location,
          image: t.image,
          rating: t.rating,
          text: t.text,
        })),
      };

      // Attach to homepageData content
      homepageData.dataValues.content.sections = {
        coursesSection,
        categoriesSection,
        associatesSection,
        testimonialsSection,
      };

      return homepageData;
    } catch (error) {
      console.error("Error in getHomepage:", error);
      throw new Error("Error fetching homepage data: " + error.message);
    }
  }

  async getContentPage(slug) {
    try {
      const pageData = await pages.findOne({
        where: { route: `/${slug}`, status: "published" },
      });

      if (!pageData) return null;

      if (slug === "courses") {
        const content = pageData.dataValues.content;

        if (!content.sections) content.sections = {};
        if (!content.sections.coursesSection) {
          content.sections.coursesSection = {
            title: "Popular Courses",
            items: [],
          };
        }

        const courseData = await courses.findAll({
          where: { status: "active" },
          limit: 5,
          order: [["created_at", "DESC"]],
        });

        content.sections.coursesSection.items = courseData.map((c) => ({
          id: c.id,
          title: c.course_name,
          image: c.thumbnail,
          duration: c.duration,
          rating: Number(c.rating),
          enrollLink: c.enroll_link,
          detailsLink: c.detail_link,
        }));
      }

      return pageData;
    } catch (error) {
      console.error("Error in getContentPage:", error);
      throw new Error("Error fetching page data: " + error.message);
    }
  }

  async getGalleryPage(req, res) {
    try {
      const galleryData = await pages.findOne({
        where: { route: "/gallery", status: "published" },
      });
      return galleryData;
    } catch (error) {
      console.error("Error in getGalleryPage:", error);
      throw new Error("Error fetching gallery page data: " + error.message);
    }
  }
  async getConstants(slug) {
    try {
      const constant = await constants.findOne({
        where: {
          name: slug,
        },
      });
      return constant;
    } catch (error) {
      console.error("Error in getContentPage:", error);
      throw new Error("Error fetching page data: " + error.message);
    }
  }
  async getcountries() {
    try {
      const countrie = await countries.findAll();
      return countrie;
    } catch (error) {
      console.error("Error in getContentPage:", error);
      throw new Error("Error fetching page data: " + error.message);
    }
  }
  async getcities(id) {
    try {
      const citie = await cities.findAll({ where: { state_id: id } });
      return citie;
    } catch (error) {
      console.error("Error in getContentPage:", error);
      throw new Error("Error fetching page data: " + error.message);
    }
  }
  async getstates(countryId) {
    try {
      console.log(countryId);

      const state = await states.findAll({
        where: { country_id: countryId },
      });

      return state;
    } catch (error) {
      console.error("Error in getstates:", error);
      throw new Error("Error fetching states: " + error.message);
    }
  }

  async processSubmission(submissionData) {
    const { FormID, email, ...payload } = submissionData;

    if (!FormID) throw new Error("FormID is required");
    if (!email) throw new Error("Email is required");

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email format");
    }

    // Fetch form config
    const Form = await form.findOne({ where: { id: FormID } });
    if (!Form) throw new Error("Form not found");

    const formFields = Form.form_fields || [];

    // ===== Dynamic Required Field Validation =====
    for (const field of formFields) {
      if (field.required) {
        const value = payload[field.name];

        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (field.type === "checkbox" && value !== true)
        ) {
          throw new Error(`${field.label} is required`);
        }
      }
    }

    // ===== Save submission (optional but recommended) =====
    // await formSubmission.create({
    //   form_id: FormID,
    //   payload,
    // });

    // ===== Email Routing =====
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = email;

    // Admin email → full payload
    if (Form.admin_email_id) {
      await emailTemplateService.sendEmailUsingTemplate(
        Form.admin_email_id,
        adminEmail,
        payload,
      );
    }

    // User email → same payload (template decides what to use)
    if (Form.user_email_id) {
      await emailTemplateService.sendEmailUsingTemplate(
        Form.user_email_id,
        userEmail,
        payload,
      );
    }

    return {
      success: true,
      message: "Form submitted successfully",
    };
  }

  async activateIndividualAccount(token) {
    if (!token) {
      throw Object.assign(new Error("Activation token is required"), {
        status: 400,
      });
    }

    const user = await User.findOne({
      where: {
        roleId: 6, // Individual
        activation_token: token,
        activation_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      throw Object.assign(new Error("Invalid or expired activation link"), {
        status: 400,
      });
    }

    await user.update({
      is_active: 1,
      approval_status: "approved",
      activation_token: null,
      activation_expires: null,
    });

    return true;
  }
}
module.exports = new publicService();
