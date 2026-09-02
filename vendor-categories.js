// Vendor category definitions -- a fixed document checklist per category.
// Shared by the staff-side Vendors module (vendors.js) and the public
// vendor registration/upload page (vendor-registration.js) so both always
// agree on exactly what's required for a given vendor type.

export const VENDOR_CATEGORIES = {
  food: {
    label: 'Food Vendor',
    icon: '🍔',
    documents: [
      { key: 'cert_acceptability', label: 'Certificate of Acceptability (Health)', required: true },
      { key: 'public_liability_insurance', label: 'Public Liability Insurance', required: true },
      { key: 'id_copy', label: 'ID Copy of Vendor/Owner', required: true },
      { key: 'food_handling_cert', label: 'Food Handling Certificate', required: false }
    ]
  },
  security: {
    label: 'Security',
    icon: '🛡️',
    documents: [
      { key: 'psira_registration', label: 'PSIRA Registration Certificate', required: true },
      { key: 'public_liability_insurance', label: 'Public Liability Insurance', required: true },
      { key: 'guard_staff_list', label: 'Guard Staff List / Registration Proof', required: true },
      { key: 'saps_clearance', label: 'SAPS Clearance Certificate', required: false }
    ]
  },
  medical: {
    label: 'Medical / EMS',
    icon: '🚑',
    documents: [
      { key: 'hpcsa_ambulance_license', label: 'HPCSA Registration / Ambulance Operating License', required: true },
      { key: 'public_liability_insurance', label: 'Public Liability Insurance', required: true },
      { key: 'staff_qualifications', label: 'Staff Qualifications (Paramedic Certificates)', required: true },
      { key: 'vehicle_roadworthy', label: 'Vehicle Roadworthy Certificate', required: false }
    ]
  },
  other: {
    label: 'Other Service Provider',
    icon: '🏷️',
    documents: [
      { key: 'public_liability_insurance', label: 'Public Liability Insurance', required: true },
      { key: 'id_copy', label: 'ID Copy of Vendor/Owner', required: true },
      { key: 'company_registration', label: 'Company Registration (CIPC)', required: false },
      { key: 'sla_contract', label: 'SLA / Contract', required: false }
    ]
  }
};

export function getCategoryMeta(category) {
  return VENDOR_CATEGORIES[category] || VENDOR_CATEGORIES.other;
}

export function getCategoryLabel(category) {
  return getCategoryMeta(category).label;
}

export function getCategoryIcon(category) {
  return getCategoryMeta(category).icon;
}

// All required document keys for a category (used to decide whether a
// vendor's checklist is fully complete).
export function getRequiredDocumentKeys(category) {
  return getCategoryMeta(category).documents.filter(d => d.required).map(d => d.key);
}
