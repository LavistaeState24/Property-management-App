import {
  throwIfValidationFailed,
  validateEmail,
  validateEnum,
  validatePassword,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const roles = ["admin", "manager", "sales"];

export const validateCreateUserInput = (payload) => {
  const errors = {};

  const sanitized = {
    name: validateRequiredText(errors, "name", payload.name, { label: "Name", min: 3, max: 60 }),
    email: validateEmail(errors, "email", payload.email),
    phone: validatePhone(errors, "phone", payload.phone),
    password: validatePassword(errors, "password", payload.password),
    role: validateEnum(errors, "role", payload.role, { label: "Role", values: roles }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
