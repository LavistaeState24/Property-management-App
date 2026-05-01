import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isActive: user.isActive,
});

export const listManagedUsers = async (currentUser) => {
  const filters = currentUser.role === "super-admin" ? {} : { role: { $ne: "super-admin" } };
  const users = await User.find(filters).select("-password").sort({ createdAt: -1 });
  return users.map(sanitizeUser);
};

export const createManagedUser = async (payload, currentUser) => {
  if (currentUser.role !== "super-admin") {
    throw new ApiError(403, "Only Super Admin can create users");
  }

  if (payload.role === "super-admin") {
    throw new ApiError(403, "Public user creation cannot assign Super Admin");
  }

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create(payload);
  return sanitizeUser(user);
};
