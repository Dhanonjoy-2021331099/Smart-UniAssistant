import Department from "../models/Department.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

export const listDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: { $ne: false } })
      .select("_id name code description")
      .sort({ name: 1 });

    return sendSuccess(res, 200, "Departments retrieved successfully", departments);
  } catch (error) {
    console.error("List departments error:", error);
    return sendError(res, 500, error.message || "Failed to load departments");
  }
};

export default { listDepartments };
