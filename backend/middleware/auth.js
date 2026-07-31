import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return sendError(res, 401, "User not found");
    }

    if (!user.isActive) {
      return sendError(res, 403, "Account is deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token");
  }
};

export default authenticate;
