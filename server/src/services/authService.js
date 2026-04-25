import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isActive: user.isActive,
});

export const registerUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create(payload);
  const token = signToken({ id: user._id, role: user.role });

  return { user: sanitizeUser(user), token };
};

export const loginUser = async ({ email, password }) => {
  console.log("LOGIN EMAIL:", email);
  console.log("LOGIN PASSWORD:", password);

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  console.log("USER FOUND:", user ? user.email : "No user found");
  console.log("STORED PASSWORD:", user?.password);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const isPasswordMatch = await user.comparePassword(password);

  console.log("PASSWORD MATCH:", isPasswordMatch);

  if (!isPasswordMatch) {
    throw new ApiError(401, "Password does not match");
  }

  const token = signToken({ id: user._id, role: user.role });

  return { user: sanitizeUser(user), token };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};

export const listUsers = async () =>
  User.find().select("-password").sort({ createdAt: -1 });

