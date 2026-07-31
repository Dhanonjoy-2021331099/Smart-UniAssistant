import AppError from "../utils/AppError.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { mapMongooseError } from "../utils/validators.js";
import {
  registerUser,
  loginUser,
  googleLoginUser,
  completeUserProfile,
  getUserProfile,
} from "../services/auth.service.js";

const handleAuthError = (res, error, context) => {
  console.error(`${context}:`, error);

  const mappedError =
    error instanceof AppError ? error : mapMongooseError(error);

  if (mappedError instanceof AppError) {
    return sendError(res, mappedError.statusCode, mappedError.message);
  }

  return sendError(
    res,
    500,
    mappedError.message || "Internal server error",
  );
};

export const register = async (req, res) => {
  try {
    const authData = await registerUser(req.body);

    return sendSuccess(res, 201, "Registration successful", authData);
  } catch (error) {
    return handleAuthError(res, error, "Register error");
  }
};

export const login = async (req, res) => {
  try {
    const authData = await loginUser(req.body);

    return sendSuccess(res, 200, "Login successful", authData);
  } catch (error) {
    return handleAuthError(res, error, "Login error");
  }
};

export const googleLogin = async (req, res) => {
  try {
    const authData = await googleLoginUser(req.body);

    return sendSuccess(res, 200, "Google login successful", authData);
  } catch (error) {
    return handleAuthError(res, error, "Google login error");
  }
};

export const completeProfile = async (req, res) => {
  try {
    const profileData = await completeUserProfile(req.user._id, req.body);

    return sendSuccess(res, 200, "Profile completed successfully", profileData);
  } catch (error) {
    return handleAuthError(res, error, "Complete profile error");
  }
};

export const getProfile = async (req, res) => {
  try {
    const profileData = await getUserProfile(req.user._id);

    return sendSuccess(res, 200, "Profile retrieved successfully", profileData);
  } catch (error) {
    return handleAuthError(res, error, "Get profile error");
  }
};

export default {
  register,
  login,
  googleLogin,
  completeProfile,
  getProfile,
};
