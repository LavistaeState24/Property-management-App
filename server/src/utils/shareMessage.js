const formatShareLine = (label, value) => (value ? `${label}: ${value}` : null);

export const buildClientSafeShareMessage = (safeProjects = [], contact = {}) => {
  const lines = ["*Lavista Estate*", "Premium Property Details", ""];

  safeProjects.forEach((project, index) => {
    const amenitiesValue = project.amenities?.length ? project.amenities.join(", ") : null;
    const photos = project.photos?.length ? project.photos.slice(0, 6) : [];

    if (safeProjects.length > 1) {
      lines.push(`*PROPERTY ${index + 1}*`);
      lines.push("────────");
    } else {
      lines.push("*PROPERTY DETAILS*");
      lines.push("────────");
    }

    lines.push(
      ...[
        formatShareLine("Location", project.area),
        formatShareLine("Configuration", project.configuration),
        formatShareLine("Size", project.size),
        formatShareLine("Price Range", project.priceRange),
        formatShareLine("Possession", project.possession),
        formatShareLine("Amenities", amenitiesValue),
      ].filter(Boolean),
    );

    if (project.brochureUrl || project.sampleVideoUrl || photos.length) {
      lines.push("", "*MEDIA*", "────────");

      if (project.brochureUrl) {
        lines.push(`Brochure: ${project.brochureUrl}`);
      }

      if (project.sampleVideoUrl) {
        lines.push(`Sample House Video: ${project.sampleVideoUrl}`);
      }

      if (photos.length) {
        lines.push("Property Photos:");
        photos.forEach((photo, photoIndex) => {
          lines.push(`Image ${photoIndex + 1}: ${photo}`);
        });
      }
    }

    lines.push("");
  });

  lines.push("*CONTACT*");
  lines.push("────────");

  if (contact.name) {
    lines.push(`*${contact.name}*`);
  }

  if (contact.phone) {
    lines.push(`+91 ${contact.phone}`);
  }

  lines.push(
    "",
    "Lavista Estate | WhatsApp for Site Visit & Latest Availability",
    "Reply here for a site visit or the latest availability.",
  );

  return lines.filter(Boolean).join("\n");
};