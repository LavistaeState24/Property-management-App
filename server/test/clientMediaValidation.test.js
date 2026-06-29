import assert from "node:assert/strict";

import { validateClientInput } from "../src/validators/clientValidator.js";

const buildBasePayload = () => ({
  ownerName: "Aman Patel",
  address: "123 Sample Street, Ahmedabad",
  premiseName: "Palm Residency",
  premiseArea: "Satellite",
  sourceOfProperty: "Owner",
  propertyType: "3BHK",
  ownerPrice: 12000000,
  propertyCondition: "Furnished",
  propertyAge: "4 years",
  propertySize: "1450 sq ft",
  propertyImages: [],
  houseVideo: "",
  clientPhoneNumber: "9876543210",
  email: "lead@example.com",
  internalNotes: "Internal note",
  propertyStatus: "Available",
  dateOfAddingProperty: "2026-06-29",
  assignedStaff: null,
  leadStatus: "New Lead",
  interestLevel: "Warm",
  source: "Website",
  purpose: "Buy",
  budgetMin: 10000000,
  budgetMax: 13000000,
  requirementType: "3BHK",
  areaPreference: "Satellite",
  notes: "Client likes east-facing homes",
  lastCallStatus: "Intro call pending",
  nextFollowUpDate: "",
});

const s3ImageUrls = Array.from({ length: 15 }, (_, index) => `https://lavista-media.s3.ap-south-1.amazonaws.com/leads/image-${index + 1}.jpg`);

const testCases = [
  [
    "Lead without images passes validation",
    () => {
      const result = validateClientInput(buildBasePayload());
      assert.deepEqual(result.propertyImages, []);
      assert.equal(result.houseVideo, null);
    },
  ],
  [
    "Lead with one image passes validation",
    () => {
      const result = validateClientInput({
        ...buildBasePayload(),
        propertyImages: [s3ImageUrls[0]],
      });
      assert.deepEqual(result.propertyImages, [s3ImageUrls[0]]);
    },
  ],
  [
    "Lead with fifteen images passes validation",
    () => {
      const result = validateClientInput({
        ...buildBasePayload(),
        propertyImages: s3ImageUrls,
      });
      assert.equal(result.propertyImages.length, 15);
    },
  ],
  [
    "More than fifteen images is blocked",
    () => {
      assert.throws(
        () =>
          validateClientInput({
            ...buildBasePayload(),
            propertyImages: [...s3ImageUrls, "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/image-16.jpg"],
          }),
        (error) => error?.errors?.propertyImages === "Property images cannot exceed 15 items"
      );
    },
  ],
  [
    "Optional house video accepts supported hosts",
    () => {
      const youtubeResult = validateClientInput({
        ...buildBasePayload(),
        houseVideo: "https://www.youtube.com/watch?v=abcd1234",
      });
      const s3Result = validateClientInput({
        ...buildBasePayload(),
        houseVideo: "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/house-tour.mp4",
      });

      assert.equal(youtubeResult.houseVideo, "https://www.youtube.com/watch?v=abcd1234");
      assert.equal(s3Result.houseVideo, "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/house-tour.mp4");
    },
  ],
  [
    "Unsupported house video hosts are blocked",
    () => {
      assert.throws(
        () =>
          validateClientInput({
            ...buildBasePayload(),
            houseVideo: "https://example.com/video.mp4",
          }),
        (error) =>
          error?.errors?.houseVideo === "House video URL must be an Instagram, YouTube, Vimeo, or Amazon S3 URL"
      );
    },
  ],
];

testCases.forEach(([label, run]) => {
  run();
  console.log(`ok - ${label}`);
});
