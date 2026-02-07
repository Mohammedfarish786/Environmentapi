const User = require("../models/User"); // Assuming you have a User model that interacts with the database

class CommonService {
  constructor() {
    if (CommonService.instance) {
      return CommonService.instance; // Return the existing instance if it exists
    }

    CommonService.instance = this; // Set the instance for future calls

    return this;
  }

  // Get all users based on roleId
  sendResponse = (
    res,
    statusCode,
    success,
    message,
    data = null,
    error = null,
  ) => {
    res.status(statusCode).json({ status: success, message, data, error });
  };
}

module.exports = new CommonService(); // Export a single instance of the service
