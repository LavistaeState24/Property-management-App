const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePropertyTypeToken = (value) => {
  const normalized = String(value || "").trim();

  switch (normalized.toLowerCase()) {
    case "1 bhk":
    case "1bhk":
      return "1BHK";
    case "2 bhk":
    case "2bhk":
      return "2BHK";
    case "3 bhk":
    case "3bhk":
      return "3BHK";
    case "4 bhk":
    case "4bhk":
      return "4BHK";
    case "plot":
      return "Plot";
    default:
      return normalized;
  }
};

const expandPropertyTypeCategory = (value) => {
  const normalized = normalizePropertyTypeToken(value);

  switch (normalized.toLowerCase()) {
    case "apartment":
      return ["1BHK", "2BHK", "3BHK", "4BHK", "1 BHK", "2 BHK", "3 BHK", "4 BHK"];
    case "villa":
      return ["Duplex", "villa"];
    case "plot":
      return ["Plot", "plot"];
    case "commercial":
      return ["office", "showroom", "Commercial"];
    default:
      return [normalized];
  }
};

export const buildProjectFilters = (query) => {
  const filters = {};

  if (query.area) {
    const areaRegex = { $regex: escapeRegex(query.area), $options: "i" };
    filters.$or = [{ area: areaRegex }, { location: areaRegex }];
  }

  if (query.propertyType) {
    const types = String(query.propertyType)
      .split(",")
      .map((item) => item.trim())
      .flatMap(expandPropertyTypeCategory)
      .filter(Boolean);
    if (types.length) {
      filters.propertyType = { $in: types };
    }
  }

  if (query.bhk) {
    const bhkValues = String(query.bhk)
      .split(",")
      .map((item) => item.trim())
      .map(normalizePropertyTypeToken)
      .filter(Boolean);
    if (bhkValues.length) {
      const bhkPattern = bhkValues.map((item) => escapeRegex(item).replace("BHK", "\\s*BHK")).join("|");
      filters.$and = [
        ...(filters.$and || []),
        {
          $or: [
            { configuration: { $regex: bhkPattern, $options: "i" } },
            { propertyType: { $in: bhkValues } },
          ],
        },
      ];
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
