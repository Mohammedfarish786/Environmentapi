const path = require("path"); // ✅ Required for file extension
const MapService = require("../services/mapService");
const CommonService = require("../services/commonService");

const retrieveProgress = async (req, res) => {
  try {
    const { user_id } = req.params;
    const data = await MapService.retrieveProgress(user_id);
    console.log(data);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Progress retrieved successfully!",
      data,
    );
  } catch (error) {
    console.error("Progress retrieved successfully:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

const saveProgress = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { geo_json } = req.body;
    console.log("IN BACKEND", user_id);
    const data = await MapService.saveProgress({
      geo_json: geo_json,
      user_id: user_id,
    });

    console.log(data);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Progress saved successfully!",
      data,
    );
  } catch (error) {
    console.error("Error saving progress:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

//   const updateStudent= async(req,res)=>{

//     try{
//       const {firstName, lastName, username, email, password, mobileNo} = req.body;
//       const {id}= req.params;
//       console.log(id);
//       let data = await StudentService.updateStudent({
//         firstName :firstName ,
//         lastName : lastName,
//         username : username ,
//         password : password,
//         mobileNo : mobileNo
//       },id);
//       CommonService.sendResponse(res, 200, 1, "School updated successfully", data);

//     }catch(error){
//       console.error("Error updating school:", error);
//         CommonService.sendResponse(res, 500, 0, "Error updating school", []);
//     }
//   }

//   const deleteStudent= async(req,res)=>{

//     try{
//       const {id}= req.params;
//       let data = await studentService.deleteStudent(id);
//       console.log(data);
//       CommonService.sendResponse(res, 200, 1, "Student deleted successfully", data);

//     }catch(error){
//       console.error("Error deleting student:", error);
//         CommonService.sendResponse(res, 500, 0, "Error deleting student", []);
//     }
//   }

module.exports = {
  saveProgress,
  retrieveProgress,
};
