export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, value]) => [field, value.message])
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";

    return res.status(409).json({
      success: false,
      message: "Validation failed",
      errors: {
        [field]: `${field} already exists`,
      },
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};
