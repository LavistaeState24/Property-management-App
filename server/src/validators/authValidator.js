import {
  throwIfValidationFailed,
  validateEmail,
  validateEnum,
  validatePassword,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const roles = ["super-admin", "admin", "manager", "sales", "marketing"];

export const validateRegisterInput = (payload) => {
  const errors = {};

  const sanitized = {
    name: validateRequiredText(errors, "name", payload.name, { label: "Name", min: 3, max: 60 }),
    email: validateEmail(errors, "email", payload.email),
    phone: validatePhone(errors, "phone", payload.phone),
    password: validatePassword(errors, "password", payload.password),
    role: validateEnum(errors, "role", payload.role || "sales", { label: "Role", values: roles }),
  };

  const confirmPassword = String(payload.confirmPassword || "");

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (confirmPassword !== sanitized.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateLoginInput = (payload) => {
  const errors = {};
  const sanitized = {
    email: validateEmail(errors, "email", payload.email),
    password: validatePassword(errors, "password", payload.password),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
