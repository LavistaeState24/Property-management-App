export const buildProjectFilters = (query) => {
  const filters = {};

  if (query.area) {
    filters.location = { $regex: query.area, $options: "i" };
  }

  if (query.propertyType) {
    const types = String(query.propertyType)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (types.length) {
      filters.propertyType = { $in: types };
    }
  }

  if (query.bhk) {
    const bhkValues = String(query.bhk)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (bhkValues.length) {
      filters.configuration = { $in: bhkValues };
    }
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.availability === "true") {
    filters.availableUnits = { $gt: 0 };
  }

  if (query.minBudget || query.maxBudget) {
    filters["priceRange.min"] = {};
    if (query.minBudget) {
      filters["priceRange.min"].$gte = Number(query.minBudget);
    }
    if (query.maxBudget) {
      filters["priceRange.min"].$lte = Number(query.maxBudget);
    }
  }

  if (query.minSize || query.maxSize) {
    filters["sizeRange.min"] = {};
    if (query.minSize) {
      filters["sizeRange.min"].$gte = Number(query.minSize);
    }
    if (query.maxSize) {
      filters["sizeRange.min"].$lte = Number(query.maxSize);
    }
  }

  if (query.possession) {
    filters.possessionDate = { $lte: new Date(query.possession) };
  }

  if (query.amenities) {
    const amenities = String(query.amenities)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (amenities.length) {
      filters.amenities = { $all: amenities };
    }
  }

  return filters;
};

export const buildPagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

