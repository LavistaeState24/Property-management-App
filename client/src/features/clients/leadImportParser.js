const headerMap = {
  clientname: "clientName",
  client: "clientName",
  name: "clientName",
  leadname: "clientName",
  phone: "phone",
  mobile: "phone",
  phonenumber: "phone",
  clientphone: "phone",
  clientphonenumber: "phone",
  email: "email",
  clientemail: "email",
  budget: "budget",
  requirementtype: "requirementType",
  requirement: "requirementType",
  areapreference: "areaPreference",
  area: "areaPreference",
  preferredarea: "areaPreference",
  source: "source",
  leadsource: "source",
  assignedstaff: "assignedStaff",
  assignedto: "assignedStaff",
  staff: "assignedStaff",
};

const normalizeHeader = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const mapRow = (row, index) =>
  Object.entries(row).reduce(
    (mappedRow, [key, value]) => {
      const mappedKey = headerMap[normalizeHeader(key)];

      if (mappedKey) {
        mappedRow[mappedKey] = value === null || value === undefined ? "" : String(value).trim();
      }

      return mappedRow;
    },
    { rowNumber: index + 2 },
  );

export const parseLeadImportFile = async (file) => {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map(mapRow);

  return rows.filter((row) =>
    ["clientName", "phone", "email", "budget", "requirementType", "areaPreference", "source", "assignedStaff"].some((field) => row[field]),
  );
};
