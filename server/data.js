export const initialData = {
  settings: [
    { key: "site_name", value: "Godol Institute of Business", group: "general", label: "Institution Name" },
    { key: "site_tagline", value: "Shaping East Africa's Business Leaders", group: "general", label: "Tagline" },
    { key: "enrollment_open", value: "true", group: "general", label: "Enrollment Open Status" },
    { key: "contact_email", value: "info@godolinstitute.so", group: "contact", label: "Contact Email" },
    { key: "contact_phone", value: "+252 61 000 0000", group: "contact", label: "Contact Phone" },
    { key: "contact_address", value: "Makka Al-Mukarama Road, Mogadishu, Somalia", group: "contact", label: "Campus Address" },
    { key: "whatsapp_number", value: "252610000000", group: "contact", label: "WhatsApp Support" },
    { key: "facebook_url", value: "https://facebook.com/godolinstitute", group: "social", label: "Facebook" },
    { key: "linkedin_url", value: "https://linkedin.com/company/godolinstitute", group: "social", label: "LinkedIn" },
    { key: "twitter_url", value: "https://twitter.com/godolinstitute", group: "social", label: "Twitter / X" },
    { key: "currency", value: "USD", group: "commerce", label: "Primary Currency" },
    { key: "active_cohort", value: "Current Cohort", group: "commerce", label: "Active Cohort" },
    { key: "evc_phone", value: "252610000000", group: "payment", label: "EVC Plus Number" },
    { key: "evc_name", value: "Godol Institute of Business", group: "payment", label: "EVC Plus Account Name" },
    { key: "zaad_phone", value: "252630000000", group: "payment", label: "Zaad Number" },
    { key: "zaad_name", value: "Godol Institute of Business", group: "payment", label: "Zaad Account Name" },
    { key: "sahal_phone", value: "252900000000", group: "payment", label: "Sahal Number" },
    { key: "sahal_name", value: "Godol Institute of Business", group: "payment", label: "Sahal Account Name" },
    { key: "premier_merchant_id", value: "100294819", group: "payment", label: "Premier Wallet Merchant ID" },
    { key: "premier_name", value: "Godol Institute of Business", group: "payment", label: "Premier Wallet Name" },
    { key: "payment_instructions_extra", value: "After transferring, please submit your transaction details below. Enrollment will be activated upon admin verification.", group: "payment", label: "Additional Payment Instructions" }
  ],
  stats: {
    totalStudents: 0,
    totalCourses: 0,
    totalInstructors: 0,
    avgRating: 5.0
  },
  categories: [
    { id: 1, name: "Business Strategy", icon: "trending-up", color: "#f5a614", courseCount: 0 },
    { id: 2, name: "Finance & Accounting", icon: "bar-chart", color: "#2563eb", courseCount: 0 },
    { id: 3, name: "Entrepreneurship", icon: "pen-tool", color: "#10b981", courseCount: 0 },
    { id: 4, name: "Digital Marketing", icon: "monitor-play", color: "#8b5cf6", courseCount: 0 },
    { id: 5, name: "Leadership & HR", icon: "server", color: "#ec4899", courseCount: 0 },
    { id: 6, name: "Live Workshops", icon: "code", color: "#06b6d4", courseCount: 0 }
  ],
  instructors: [],
  courses: [],
  workshops: [],
  blog: [],
  students: [],
  enrollments: [],
  certificates: [],
  payments: [],
  audit_logs: [],
  notifications: []
};
