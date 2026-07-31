import Batch from "../models/Batch.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isValidObjectId } from "../utils/validators.js";

export const listBatches = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { isActive: { $ne: false } };

    if (department) {
      if (!isValidObjectId(department)) {
        return sendError(res, 400, "Invalid department ID");
      }

      filter.department = department;
    }

    const batches = await Batch.find(filter)
      .select("_id name year department session")
      .sort({ year: -1, name: 1 });

    return sendSuccess(res, 200, "Batches retrieved successfully", batches);
  } catch (error) {
    console.error("List batches error:", error);
    return sendError(res, 500, error.message || "Failed to load batches");
  }
};

export default { listBatches };
