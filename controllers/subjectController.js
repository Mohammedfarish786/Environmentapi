const path = require("path"); // ✅ Required for file extension
const subjectService = require("../services/subjectService");
const CommonService = require("../services/commonService");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3, bucketName, region } = require("../config/aws"); // Your AWS config
const createCustomSubject = async (req, res) => {
  try {
    const { form_name, form_fields } = req.body;
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);

    // Get data from request body or files
    const name = req.body.name || req.files?.path?.name;
    const uploaded_by = req.body.uploaded_by || req.user?.id;

    let now = Date.now();
    let imageUrl = "";

    if (!req.files || !req.files.path) {
      return CommonService.sendResponse(res, 400, 0, "No file uploaded", []);
    }

    const file = req.files.path;
    const ext = path.extname(file.name);
    const filename = `${uploaded_by}-${now}${ext}`;
    const s3Key = `icons/${uploaded_by}/${now}_${filename}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: file.data,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);
    console.log("S3 Upload response:", response);

    imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    console.log("Generated S3 URL:", imageUrl);

    // ✅ Parse form_fields string to array
    let parsedFormFields;
    try {
      parsedFormFields =
        typeof form_fields === "string" ? JSON.parse(form_fields) : form_fields;
    } catch (parseError) {
      console.error("Error parsing form_fields:", parseError);
      return CommonService.sendResponse(
        res,
        400,
        0,
        "Invalid form_fields format",
        [],
      );
    }

    const dataUpload = {
      name: name || `Icon_${now}`,
      uploaded_by,
      path: imageUrl,
      form_name: form_name,
      form_fields: parsedFormFields, // ✅ Now it's an array
    };

    const data = await subjectService.createCustomSubject(dataUpload);
    console.log("Database response:", data);

    return CommonService.sendResponse(
      res,
      201,
      1,
      "Custom subject successfully created",
      data,
    );
  } catch (error) {
    console.error("Error creating custom subject:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error creating custom subject",
      [],
    );
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const data = await subjectService.getAllSubjects();
    console.log(data);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "All subjects fetched successfully",
      data,
    );
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

// // ✅ Update document logic placeholder (currently updating user, not document)
// const updateDoc = async (req, res) => {
//   try {
//     // placeholder: update logic for doc (not implemented)
//     return CommonService.sendResponse(res, 501, 0, "Update document not implemented", []);
//   } catch (error) {
//     console.error("Error updating document:", error);
//     return CommonService.sendResponse(res, 500, 0, error.message || "Error", []);
//   }
// };

module.exports = {
  getAllSubjects,
  createCustomSubject,
  // getDoc,
  // updateDoc
};
