import mongoose from "mongoose";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import CRAdmin from "../models/CRAdmin.js";
import { generateToken } from "../utils/jwt.js";
import { verifyFirebaseToken } from "../config/firebase.js";
import AppError from "../utils/AppError.js";
import {
  normalizeEmail,
  validateRegisterPayload,
  validateCompleteProfilePayload,
  mapMongooseError,
} from "../utils/validators.js";

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileCompleted: user.profileCompleted,
  profileImage: user.profileImage,
  isActive: user.isActive,
});

const buildAuthData = (user) => ({
  token: generateToken({
    userId: user._id,
    role: user.role,
  }),
  user: formatUser(user),
});

const createRoleProfile = async (role, userId, payload, session) => {
  const options = session ? { session } : {};

  if (role === "student") {
    return Student.create(
      [
        {
          userId,
          studentId: payload.studentId,
          department: payload.department,
          section: payload.section || "",
          semester: payload.semester || "",
          academicSession: payload.academicSession || "",
          session: payload.academicSession || "",
        },
      ],
      options,
    );
  }

  if (role === "teacher") {
    return Teacher.create(
      [
        {
          userId,
          teacherId: payload.teacherId,
          department: payload.department,
        },
      ],
      options,
    );
  }

  if (role === "cr_admin") {
    return CRAdmin.create(
      [
        {
          userId,
          studentId: payload.studentId,
          department: payload.department,
          batch: payload.batch,
        },
      ],
      options,
    );
  }

  throw new AppError("Unsupported role", 400);
};

const getRoleProfile = async (user) => {
  if (user.role === "student") {
    return Student.findOne({ userId: user._id });
  }

  if (user.role === "teacher") {
    return Teacher.findOne({ userId: user._id });
  }

  if (user.role === "cr_admin") {
    return CRAdmin.findOne({ userId: user._id })
      .populate("department")
      .populate("batch");
  }

  return null;
};

export const registerUser = async (body) => {
  const payload = await validateRegisterPayload(body);

  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [user] = await User.create(
      [
        {
          email: payload.email,
          password: payload.password,
          name: payload.name,
          role: payload.role,
          profileCompleted: false,
        },
      ],
      { session },
    );

    await createRoleProfile(payload.role, user._id, payload, session);

    user.profileCompleted = true;
    user.updatedAt = new Date();
    await user.save({ session });

    await session.commitTransaction();

    return buildAuthData(user);
  } catch (error) {
    await session.abortTransaction();
    throw mapMongooseError(error);
  } finally {
    session.endSession();
  }
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated. Contact support.", 403);
  }

  if (!user.password) {
    throw new AppError("Please sign in with Google for this account", 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  user.lastLogin = new Date();
  await user.save();

  return buildAuthData(user);
};

export const googleLoginUser = async ({ idToken }) => {
  if (!idToken) {
    throw new AppError("Firebase ID token is required", 400);
  }

  let decoded;

  try {
    decoded = await verifyFirebaseToken(idToken);
  } catch (error) {
    throw new AppError("Invalid or expired Google token", 401);
  }

  const { uid, email, name } = decoded;

  if (!email) {
    throw new AppError("Google account email is required", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.firebaseUid = uid;

      if (name && !user.name) {
        user.name = name;
      }
    } else {
      user = await User.create({
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        firebaseUid: uid,
        role: "student",
        profileCompleted: false,
      });
    }
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated. Contact support.", 403);
  }

  user.lastLogin = new Date();
  await user.save();

  return buildAuthData(user);
};

export const completeUserProfile = async (userId, body) => {
  const payload = await validateCompleteProfilePayload(body);

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.profileCompleted) {
    throw new AppError("Profile is already completed", 409);
  }

  const [existingStudent, existingTeacher, existingCRAdmin] = await Promise.all([
    Student.findOne({ userId: user._id }),
    Teacher.findOne({ userId: user._id }),
    CRAdmin.findOne({ userId: user._id }),
  ]);

  if (existingStudent || existingTeacher || existingCRAdmin) {
    throw new AppError("Profile already exists", 409);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await createRoleProfile(payload.role, user._id, payload, session);

    user.role = payload.role;
    user.profileCompleted = true;
    user.updatedAt = new Date();
    await user.save({ session });

    await session.commitTransaction();

    const profile = await getRoleProfile(user);

    return {
      ...buildAuthData(user),
      profile,
    };
  } catch (error) {
    await session.abortTransaction();
    throw mapMongooseError(error);
  } finally {
    session.endSession();
  }
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  let profile = await getRoleProfile(user);

  if (profile && !user.profileCompleted) {
    user.profileCompleted = true;
    user.updatedAt = new Date();
    await user.save();
    profile = await getRoleProfile(user);
  }

  return {
    user,
    profile: user.profileCompleted ? profile : null,
  };
};
