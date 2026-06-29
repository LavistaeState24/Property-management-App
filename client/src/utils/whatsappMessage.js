const SECTION_DIVIDER = "────────";
const MAX_SHARED_IMAGE_LINKS = 12;

const formatField = (label, value, { boldValue = false } = {}) => {
  if (!value) {
    return null;
  }

  return `${label}: ${boldValue ? `*${value}*` : value}`;
};

const buildSection = (title, lines = []) => {
  const filteredLines = lines.filter(Boolean);

  if (!filteredLines.length) {
    return [];
  }

  return [
  "",
  `*${title}*`,
  SECTION_DIVIDER,
  "",
  ...filteredLines,
  "",
];
};

const buildImageLines = (images = []) =>
  images
    .filter(Boolean)
    .slice(0, MAX_SHARED_IMAGE_LINKS)
    .map((imageUrl, index) => `Image ${index + 1}: ${imageUrl}`);

export const formatWhatsAppPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

export const buildClientSafeShareMessage = (projects = [], contact = {}) => {
  const lines = ["*Lavista Estate*", "Premium Property Shortlist", ""];

  projects.forEach((project, index) => {
    const amenitiesValue = project.amenities?.length ? project.amenities.join(", ") : null;

    const overviewLines = [
      formatField("Property", project.publicAlias, { boldValue: true }),
      formatField("Location", project.area || project.location),
      formatField("Configuration", project.configuration, { boldValue: true }),
      formatField("Size", project.size),
      formatField("Price", project.priceRange, { boldValue: true }),
      formatField("Status", project.possession),
      formatField("Amenities", amenitiesValue),
    ];

    const mediaLines = [
      formatField("Brochure", project.brochureUrl),
      formatField("House Video", project.sampleVideoUrl),
      ...buildImageLines(project.photos),
    ];

    lines.push(
      `*OPTION ${index + 1}*`,
      "",
      ...buildSection("PROPERTY DETAILS", overviewLines),
      ...buildSection("MEDIA", mediaLines),
    );
  });

  lines.push(
    ...buildSection("CONTACT", [
      contact.name ? `*${contact.name}*` : null,
      contact.phone || null,
    ]),
    "Lavista Estate | WhatsApp for Site Visit & Latest Availability",
    "Reply here for a site visit or the latest availability.",
  );

  return lines.filter(Boolean).join("\n");
};

export const buildLeadPropertyShareMessage = (property = {}) => {
  const amenitiesValue = property.amenities?.length ? property.amenities.join(", ") : null;

  const imageLines = property.propertyImages
    ?.filter(Boolean)
    .slice(0, 12)
    .map((imageUrl, index) => `  ${index + 1}. ${imageUrl}`);

  const lines = [
    "*Premium Property Details by Lavista Estate*",

    formatField("• *Property*", property.premiseName),
    formatField("• *Area*", property.area),
    formatField("• *Property Type*", property.propertyType),
    formatField("• *Purpose*", property.purpose),
    formatField("• *Configuration*", property.configuration),
    formatField("• *Size*", property.size),
    formatField(`• *${property.priceLabel || "Price"}*`, property.price),
    formatField("• *Furnishing Status*", property.furnishingStatus),
    formatField("• *Availability*", property.availability),
    formatField("• *Basic Amenities*", amenitiesValue),
    formatField("• *House Video*", property.houseVideo),

    imageLines?.length ? "• *Property Images:*" : null,
    ...(imageLines || []),

    "*For more details, contact:*",
    property.contact?.name ? `*${property.contact.name}*` : null,
    property.contact?.phone || null,

    "Lavista Estate | WhatsApp for site visit and latest availability",
  ];

  return lines.filter(Boolean).join("\n");
};