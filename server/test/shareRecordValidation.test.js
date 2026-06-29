import assert from "node:assert/strict";

import { validateShareRecordCreateInput } from "../src/validators/shareRecordValidator.js";

const projectPayload = {
  clientName: "Amit Shah",
  clientPhone: "9876543210",
  projectId: "507f1f77bcf86cd799439011",
  projectPublicAlias: "PRJ-101",
  sharedFields: {
    area: "Satellite",
    configuration: "3BHK",
    size: "1450 sq ft",
    priceRange: "Rs1.2 Cr",
    amenities: ["Club House", "Gym"],
    sampleVideoUrl: "https://example.com/video.mp4",
    photos: ["https://example.com/photo-1.jpg"],
  },
  shareChannel: "WhatsApp",
  whatsappMessage: "Sample WhatsApp message for project sharing",
};

const leadPropertyPayload = {
  shareTargetType: "lead-property",
  clientName: "Neha Patel",
  clientPhone: "9876543210",
  leadPropertyId: "507f191e810c19729de860ea",
  sharedTitle: "Palm Residency",
  sharedFields: {
    area: "Satellite",
    propertyType: "3BHK",
    purpose: "Sale",
    configuration: "3BHK",
    size: "1450 sq ft",
    priceRange: "Rs1.2 Cr",
    possession: "Available",
    furnishingStatus: "Semi Furnished",
    propertyStatus: "Available",
    description: "Premium resale apartment",
    amenities: ["Club House", "Gym"],
    sampleVideoUrl: "https://example.com/video.mp4",
    photos: ["https://example.com/photo-1.jpg"],
  },
  shareChannel: "WhatsApp",
  whatsappMessage: "Sample WhatsApp message for lead property sharing",
};

const testCases = [
  [
    "Project share record validation still accepts the existing project payload",
    () => {
      const result = validateShareRecordCreateInput(projectPayload);

      assert.equal(result.shareTargetType, "project");
      assert.equal(result.projectId, projectPayload.projectId);
      assert.equal(result.projectPublicAlias, projectPayload.projectPublicAlias);
      assert.equal(result.leadPropertyId, undefined);
      assert.equal(result.sharedTitle, undefined);
    },
  ],
  [
    "Lead property share record validation accepts the new lead-property payload",
    () => {
      const result = validateShareRecordCreateInput(leadPropertyPayload);

      assert.equal(result.shareTargetType, "lead-property");
      assert.equal(result.leadPropertyId, leadPropertyPayload.leadPropertyId);
      assert.equal(result.sharedTitle, leadPropertyPayload.sharedTitle);
      assert.equal(result.projectId, undefined);
      assert.equal(result.projectPublicAlias, undefined);
      assert.equal(result.sharedFields.propertyType, "3BHK");
      assert.equal(result.sharedFields.purpose, "Sale");
      assert.equal(result.sharedFields.furnishingStatus, "Semi Furnished");
      assert.equal(result.sharedFields.sampleVideoUrl, "https://example.com/video.mp4");
      assert.deepEqual(result.sharedFields.photos, ["https://example.com/photo-1.jpg"]);
    },
  ],
];

testCases.forEach(([label, run]) => {
  run();
  console.log(`ok - ${label}`);
});
