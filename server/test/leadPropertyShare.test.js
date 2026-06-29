import assert from "node:assert/strict";

import { buildLeadPropertySharePayload } from "../src/services/clientService.js";

const client = {
  _id: "lead-123",
  ownerName: "Private Owner",
  address: "123 Exact Property Address",
  premiseName: "Palm Residency",
  premiseArea: "Satellite",
  propertyType: "3BHK",
  purpose: "Buy",
  propertySize: "1450 sq ft",
  ownerPrice: 12000000,
  propertyCondition: "Semi Furnished",
  propertyStatus: "Available",
  sourceOfProperty: "Broker",
  internalNotes: "Do not disclose",
  notes: "Internal discussion summary",
  propertyImages: Array.from({ length: 16 }, (_, index) => `https://lavista-media.s3.ap-south-1.amazonaws.com/leads/photo-${index + 1}.jpg`),
  houseVideo: "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/house-tour.mp4",
};

const user = {
  name: "Lavista Advisor",
  phone: "9876543210",
};

const testCases = [
  [
    "Lead property share payload exposes only approved public fields",
    () => {
      const payload = buildLeadPropertySharePayload(client, user, "http://localhost:5000");

      assert.equal(payload.premiseName, "Palm Residency");
      assert.equal(payload.area, "Satellite");
      assert.equal(payload.propertyType, "3BHK");
      assert.equal(payload.purpose, "Sale");
      assert.equal(payload.configuration, "3BHK");
      assert.equal(payload.size, "1450 sq ft");
      assert.equal(payload.priceLabel, "Price");
      assert.equal(payload.price, "Rs1,20,00,000");
      assert.equal(payload.furnishingStatus, "Semi Furnished");
      assert.equal(payload.availability, "Available");
      assert.equal(payload.houseVideo, "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/house-tour.mp4");
      assert.deepEqual(payload.contact, {
        name: "Lavista Advisor",
        phone: "9876543210",
      });
    },
  ],
  [
    "Lead property share payload never includes confidential lead fields",
    () => {
      const payload = buildLeadPropertySharePayload(client, user, "http://localhost:5000");

      assert.equal(payload.ownerName, undefined);
      assert.equal(payload.address, undefined);
      assert.equal(payload.sourceOfProperty, undefined);
      assert.equal(payload.internalNotes, undefined);
      assert.equal(payload.notes, undefined);
    },
  ],
  [
    "Lead property share payload caps image URLs at fifteen",
    () => {
      const payload = buildLeadPropertySharePayload(client, user, "http://localhost:5000");
      assert.equal(payload.propertyImages.length, 15);
      assert.equal(payload.propertyImages[0], "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/photo-1.jpg");
      assert.equal(payload.propertyImages[14], "https://lavista-media.s3.ap-south-1.amazonaws.com/leads/photo-15.jpg");
    },
  ],
];

testCases.forEach(([label, run]) => {
  run();
  console.log(`ok - ${label}`);
});
