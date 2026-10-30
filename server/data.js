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
    { key: "active_cohort", value: "July 2026 Cohort", group: "commerce", label: "Active Cohort" },
    // Payment providers — configure these with your real numbers
    { key: "evc_phone", value: "252610000000", group: "payment", label: "EVC Plus Number" },
    { key: "evc_name", value: "Godol Institute of Business", group: "payment", label: "EVC Plus Account Name" },
    { key: "zaad_phone", value: "252630000000", group: "payment", label: "Zaad Number" },
    { key: "zaad_name", value: "Godol Institute of Business", group: "payment", label: "Zaad Account Name" },
    { key: "sahal_phone", value: "252900000000", group: "payment", label: "Sahal Number" },
    { key: "sahal_name", value: "Godol Institute of Business", group: "payment", label: "Sahal Account Name" },
    { key: "premier_merchant_id", value: "100294819", group: "payment", label: "Premier Wallet Merchant ID" },
    { key: "premier_name", value: "Godol Institute of Business", group: "payment", label: "Premier Wallet Name" },
    { key: "payment_instructions_extra", value: "After transferring, please submit your transaction details below. Enrollment will be activated within 24 hours of payment verification.", group: "payment", label: "Additional Payment Instructions" }
  ],
  stats: {
    totalStudents: 12450,
    totalCourses: 48,
    totalInstructors: 24,
    avgRating: 4.9
  },
  categories: [
    { id: 1, name: "Business Strategy", icon: "trending-up", color: "#f5a614", courseCount: 12 },
    { id: 2, name: "Finance & Accounting", icon: "bar-chart", color: "#2563eb", courseCount: 10 },
    { id: 3, name: "Entrepreneurship", icon: "pen-tool", color: "#10b981", courseCount: 14 },
    { id: 4, name: "Digital Marketing", icon: "monitor-play", color: "#8b5cf6", courseCount: 8 },
    { id: 5, name: "Leadership & HR", icon: "server", color: "#ec4899", courseCount: 9 },
    { id: 6, name: "Live Workshops", icon: "code", color: "#06b6d4", courseCount: 6 }
  ],
  instructors: [
    {
      id: 1,
      name: "Dr. Abdi Hassan",
      title: "Founder & Former Central Bank Director",
      bio: "Former Director of Finance at the Central Bank of Somalia with over 20 years of experience shaping banking and monetary policies in East Africa. Passionate about empowering the next generation of financial leaders.",
      avatar: "/instructor-1.png",
      rating: 4.9,
      reviewCount: 312,
      studentCount: 3420,
      courseCount: 5,
      status: "active",
      email: "abdi.hassan@godolinstitute.so",
      phone: "+252 61 100 0001",
      joinedAt: "2025-01-10T00:00:00Z"
    },
    {
      id: 2,
      name: "Maryam Warsame",
      title: "Academic Dean & Executive Coach",
      bio: "MBA from London Business School. Former management consultant with McKinsey Africa and leadership advisor to top corporate institutions in Nairobi and Mogadishu.",
      avatar: "/instructor-2.png",
      rating: 4.9,
      reviewCount: 245,
      studentCount: 2890,
      courseCount: 4,
      status: "active",
      email: "maryam.warsame@godolinstitute.so",
      phone: "+252 61 100 0002",
      joinedAt: "2025-01-15T00:00:00Z"
    },
    {
      id: 3,
      name: "Faisal Ahmed",
      title: "Head of Entrepreneurship & Angel Investor",
      bio: "Serial entrepreneur who founded 4 thriving businesses across Somalia, Kenya, and Ethiopia. Active angel investor and mentor to tech and logistics startups.",
      avatar: "/instructor-1.png",
      rating: 4.8,
      reviewCount: 198,
      studentCount: 2150,
      courseCount: 4,
      status: "active",
      email: "faisal.ahmed@godolinstitute.so",
      phone: "+252 61 100 0003",
      joinedAt: "2025-02-01T00:00:00Z"
    },
    {
      id: 4,
      name: "Hodan Nur",
      title: "Director of Industry Relations & HR Strategist",
      bio: "Former HR Director at SomTel. Specializes in talent acquisition, organizational culture, and connecting top business graduates with premier employers across East Africa.",
      avatar: "/instructor-2.png",
      rating: 4.9,
      reviewCount: 167,
      studentCount: 1840,
      courseCount: 3,
      status: "active",
      email: "hodan.nur@godolinstitute.so",
      phone: "+252 61 100 0004",
      joinedAt: "2025-02-15T00:00:00Z"
    }
  ],
  courses: [
    {
      id: 1,
      title: "Strategic Business Planning Masterclass",
      slug: "strategic-business-planning-masterclass",
      description: "Master strategic planning, competitive market positioning, and corporate execution frameworks tailored to the realities of the East African enterprise landscape.",
      price: 149,
      level: "Intermediate",
      durationHours: 24,
      lessonCount: 18,
      enrolledCount: 840,
      rating: 4.9,
      featured: true,
      badge: "Bestseller",
      thumbnail: "/course-business.png",
      instructorId: 1,
      instructorName: "Dr. Abdi Hassan",
      categoryId: 1,
      categoryName: "Business Strategy",
      status: "published",
      approvalStatus: "approved",
      createdAt: "2026-01-15T10:00:00Z",
      whatYouLearn: [
        "Develop actionable 3-to-5 year strategic business plans",
        "Perform competitive market analysis in emerging East African economies",
        "Formulate KPIs and organizational performance metrics",
        "Navigate regulatory and cross-border commercial opportunities"
      ],
      requirements: [
        "Basic understanding of business operations",
        "Commitment of 4-6 hours per week"
      ],
      sections: [
        {
          id: 1,
          courseId: 1,
          title: "Introduction to Strategic Leadership",
          orderIndex: 1,
          lessons: [
            { id: 101, sectionId: 1, title: "Course Welcome & Framework Overview", durationMinutes: 12, isFree: true, videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Welcome to Strategic Business Planning. In this lesson, Dr. Abdi outlines the foundational goals of the course." },
            { id: 102, sectionId: 1, title: "Analyzing Emerging Markets in East Africa", durationMinutes: 28, isFree: false, videoUrl: "", content: "Detailed breakdown of macro-economic drivers and consumer trends in the Horn of Africa." },
            { id: 103, sectionId: 1, title: "Identifying Competitive Advantage", durationMinutes: 35, isFree: false, videoUrl: "", content: "How local enterprises carve out defendable moats against global and regional competitors." }
          ]
        },
        {
          id: 2,
          courseId: 1,
          title: "Execution Frameworks & OKRs",
          orderIndex: 2,
          lessons: [
            { id: 104, sectionId: 2, title: "Designing Organizational OKRs", durationMinutes: 30, isFree: false, videoUrl: "", content: "Aligning executive teams with clear, measurable milestone objectives." },
            { id: 105, sectionId: 2, title: "Risk Mitigation and Contingency Planning", durationMinutes: 25, isFree: false, videoUrl: "", content: "Building resilience against currency fluctuations and logistical disruptions." }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "Financial Modeling & Corporate Valuation",
      slug: "financial-modeling-corporate-valuation",
      description: "Build robust 3-statement financial models, forecast cash flows, assess investment feasibility, and understand commercial banking credit evaluation.",
      price: 199,
      level: "Advanced",
      durationHours: 32,
      lessonCount: 22,
      enrolledCount: 620,
      rating: 4.9,
      featured: true,
      badge: "Accredited",
      thumbnail: "/course-design.png",
      instructorId: 1,
      instructorName: "Dr. Abdi Hassan",
      categoryId: 2,
      categoryName: "Finance & Accounting",
      status: "published",
      approvalStatus: "approved",
      createdAt: "2026-02-10T12:00:00Z",
      whatYouLearn: [
        "Build dynamic income statements, balance sheets, and cash flow forecasts in Excel",
        "Perform Discounted Cash Flow (DCF) and comparable company valuations",
        "Understand Islamic banking financial instruments (Murabaha, Musharaka)",
        "Structure investor-ready pitch decks with financial projections"
      ],
      requirements: [
        "Familiarity with basic bookkeeping or accounting",
        "Microsoft Excel or Google Sheets"
      ],
      sections: [
        {
          id: 3,
          courseId: 2,
          title: "Financial Statements Mechanics",
          orderIndex: 1,
          lessons: [
            { id: 201, sectionId: 3, title: "Interlinking the 3 Core Statements", durationMinutes: 22, isFree: true, videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Understanding how net income flows into retained earnings and operating cash flow." },
            { id: 202, sectionId: 3, title: "Working Capital Optimization", durationMinutes: 40, isFree: false, videoUrl: "", content: "Managing inventory cycles, receivables, and payables for maximum liquidity." }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "Entrepreneurship: From Zero to Scaled Enterprise",
      slug: "entrepreneurship-zero-to-scaled-enterprise",
      description: "A comprehensive blueprint to launch, fund, and scale a profitable business in Somalia and East Africa, from business model validation to hiring 50+ employees.",
      price: 99,
      level: "Beginner",
      durationHours: 20,
      lessonCount: 16,
      enrolledCount: 1150,
      rating: 4.8,
      featured: true,
      badge: "Popular",
      thumbnail: "/course-web.png",
      instructorId: 3,
      instructorName: "Faisal Ahmed",
      categoryId: 3,
      categoryName: "Entrepreneurship",
      status: "published",
      approvalStatus: "approved",
      createdAt: "2026-02-28T09:00:00Z",
      whatYouLearn: [
        "Validate business ideas with zero initial marketing budget",
        "Master cash collection and modern mobile payment gateways (EVC, Zaad, Sahal)",
        "Build high-performing local teams and maintain founder culture",
        "Negotiate supplier contracts and scale distribution channels"
      ],
      requirements: [
        "No prior experience required — ideal for current or aspiring founders"
      ],
      sections: [
        {
          id: 4,
          courseId: 3,
          title: "Idea Validation & Market Fit",
          orderIndex: 1,
          lessons: [
            { id: 301, sectionId: 4, title: "Finding Underserved Gaps in Somali Markets", durationMinutes: 18, isFree: true, videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "How Faisal identified multi-million dollar opportunities in logistics and trade." },
            { id: 302, sectionId: 4, title: "Launching Minimum Viable Products", durationMinutes: 25, isFree: false, videoUrl: "", content: "Testing customer willingness to pay before committing heavy capital." }
          ]
        }
      ]
    },
    {
      id: 4,
      title: "Digital Marketing & Brand Building in East Africa",
      slug: "digital-marketing-brand-building",
      description: "Harness social media, influencer partnerships, targeted meta ads, and content marketing to scale consumer brands rapidly in urban East African centers.",
      price: 89,
      level: "Beginner",
      durationHours: 16,
      lessonCount: 14,
      enrolledCount: 940,
      rating: 4.9,
      featured: true,
      badge: "Featured",
      thumbnail: "/course-business.png",
      instructorId: 4,
      instructorName: "Hodan Nur",
      categoryId: 4,
      categoryName: "Digital Marketing",
      status: "published",
      approvalStatus: "approved",
      createdAt: "2026-03-05T14:00:00Z",
      whatYouLearn: [
        "Run high-ROI social media ad campaigns targeted at Somali and diaspora audiences",
        "Leverage TikTok, Facebook, and Instagram reels for viral organic growth",
        "Build WhatsApp marketing funnels that convert prospects into buyers",
        "Track customer acquisition cost (CAC) and customer lifetime value (LTV)"
      ],
      requirements: [
        "Smartphone or computer with internet access"
      ],
      sections: [
        {
          id: 5,
          courseId: 4,
          title: "Audience & Platform Strategy",
          orderIndex: 1,
          lessons: [
            { id: 401, sectionId: 5, title: "The East African Social Media Landscape", durationMinutes: 15, isFree: true, videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Overview of platform usage demographics in Mogadishu, Hargeisa, and Nairobi." }
          ]
        }
      ]
    },
    {
      id: 5,
      title: "Executive Leadership & People Management",
      slug: "executive-leadership-people-management",
      description: "Develop the interpersonal finesse, conflict resolution skills, and visionary leadership required to guide growing corporate organizations.",
      price: 129,
      level: "Intermediate",
      durationHours: 22,
      lessonCount: 15,
      enrolledCount: 510,
      rating: 4.9,
      featured: false,
      badge: "Cohort 2026",
      thumbnail: "/course-design.png",
      instructorId: 2,
      instructorName: "Maryam Warsame",
      categoryId: 5,
      categoryName: "Leadership & HR",
      status: "published",
      approvalStatus: "approved",
      createdAt: "2026-03-20T11:00:00Z",
      whatYouLearn: [
        "Master emotional intelligence and cross-cultural leadership",
        "Design compensation packages and incentive systems that retain talent",
        "Handle high-stakes stakeholder negotiations",
        "Lead organizational restructuring with empathy and clarity"
      ],
      requirements: [
        "Leadership or management experience recommended"
      ],
      sections: [
        {
          id: 6,
          courseId: 5,
          title: "Foundations of High-Performance Culture",
          orderIndex: 1,
          lessons: [
            { id: 501, sectionId: 6, title: "Defining Core Values & Behaviors", durationMinutes: 20, isFree: true, videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "How top CEOs build enduring institutional culture." }
          ]
        }
      ]
    },
    {
      id: 6,
      title: "Islamic Banking & Ethical Commercial Finance",
      slug: "islamic-banking-ethical-commercial-finance",
      description: "An authoritative guide to Shariah-compliant financial transactions, Takaful insurance, Sukuk bonds, and trade financing in modern banking.",
      price: 110,
      level: "Intermediate",
      durationHours: 18,
      lessonCount: 12,
      enrolledCount: 780,
      rating: 5.0,
      featured: false,
      badge: "Specialized",
      thumbnail: "/course-web.png",
      instructorId: 1,
      instructorName: "Dr. Abdi Hassan",
      categoryId: 2,
      categoryName: "Finance & Accounting",
      status: "published",
      approvalStatus: "approved",
      createdAt: "2026-04-01T08:00:00Z",
      whatYouLearn: [
        "Deep dive into Murabaha, Ijara, and Mudaraba contracts",
        "Shariah governance frameworks and supervisory boards",
        "Risk management specific to non-interest banking models",
        "Structuring commercial trade finance for import/export"
      ],
      requirements: [
        "Basic business or finance awareness"
      ],
      sections: [
        {
          id: 7,
          courseId: 6,
          title: "Core Shariah Commercial Principles",
          orderIndex: 1,
          lessons: [
            { id: 601, sectionId: 7, title: "Prohibition of Riba and Gharar in Modern Commerce", durationMinutes: 25, isFree: true, videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Foundational theological and economic principles of ethical Islamic finance." }
          ]
        }
      ]
    }
  ],
  workshops: [
    {
      id: 1,
      title: "Strategic Business Planning Masterclass",
      slug: "strategic-business-planning-masterclass",
      description: "An intensive 2-day hands-on executive session in Mogadishu. Work directly with faculty to draft your company's full strategic plan.",
      location: "Mogadishu, Somalia",
      date: "June 14–15, 2026",
      durationHours: "16 Hours / 2 Days",
      capacity: 30,
      enrolledCount: 12,
      price: 150,
      status: "upcoming",
      featured: true,
      tag: "Limited Seats",
      seats: 18
    },
    {
      id: 2,
      title: "Financial Modeling for Entrepreneurs",
      slug: "financial-modeling-for-entrepreneurs",
      description: "Live workshop focusing on dynamic spreadsheet forecasting, cost accounting, cash-flow projections, and banking credit applications.",
      location: "Mogadishu, Somalia",
      date: "July 5, 2026",
      durationHours: "8 Hours / 1 Day",
      capacity: 35,
      enrolledCount: 10,
      price: 95,
      status: "upcoming",
      featured: true,
      tag: "New",
      seats: 25
    },
    {
      id: 3,
      title: "Leadership & Team Management Workshop",
      slug: "leadership-team-management-workshop",
      description: "Executive workshop designed for department heads, founders, and managing directors navigating high growth and talent retention.",
      location: "Mogadishu, Somalia",
      date: "July 19–20, 2026",
      durationHours: "14 Hours / 2 Days",
      capacity: 25,
      enrolledCount: 5,
      price: 175,
      status: "upcoming",
      featured: true,
      tag: "Popular",
      seats: 20
    }
  ],
  blog: [
    {
      id: 1,
      title: "How Somali Startups are Leveraging Digital Payments in 2026",
      slug: "how-somali-startups-are-leveraging-digital-payments-in-2026",
      excerpt: "From mobile money APIs to cross-border remittances, explore how innovative founders in Mogadishu are rewriting the rules of commerce.",
      content: `The Somali economy has long been recognized as one of the world's most cash-lean societies, with over 80% of urban transactions conducted through mobile money networks such as EVC Plus, Zaad, and Sahal.\n\nHowever, the real revolution occurring in 2026 is at the enterprise and merchant integration layer. Startups are no longer merely accepting peer-to-peer transfers; they are building automated webhook reconciliations, subscription billing models, and integrated escrow mechanisms that give domestic consumers unprecedented purchasing confidence.\n\nIn this deep dive, we explore how 5 leading Somali enterprises restructured their checkout flow, decreased drop-off rates by 42%, and secured institutional funding by demonstrating transparent, real-time transaction ledger clarity.`,
      category: "Business",
      author: "Godol Editorial",
      readTime: "5 min read",
      published: true,
      featured: true,
      publishedAt: "2026-05-15"
    },
    {
      id: 2,
      title: "The Essential Guide to Islamic Banking for East African Entrepreneurs",
      slug: "the-essential-guide-to-islamic-banking-for-east-african-entrepreneurs",
      excerpt: "Understanding Murabaha asset financing, equity partnerships, and how to prepare your books for Shariah-compliant financing.",
      content: `Islamic finance is grounded in ethical equity, risk-sharing, and asset-backed transactions. For growing enterprises in East Africa, partnering with Islamic banks like Amal Bank, Premier Bank, and Salaam African Bank offers significant capital without the predatory risks of interest accumulation.\n\nTo qualify for favorable commercial financing, founders must understand how banks assess inventory asset turnover, how to construct clear Murabaha purchase orders, and the key financial metrics bank credit committees evaluate.`,
      category: "Finance",
      author: "Dr. Abdi Hassan",
      readTime: "7 min read",
      published: true,
      featured: false,
      publishedAt: "2026-06-01"
    },
    {
      id: 3,
      title: "Why Practical Business Education is Outpacing Traditional Degrees",
      slug: "why-practical-business-education-is-outpacing-traditional-degrees",
      excerpt: "Employers across East Africa increasingly value demonstrable business competencies, case studies, and applied execution over theoretical credentials.",
      content: `A university business degree that relies on 20-year-old textbooks written for Western industrial economies no longer prepares young Africans for the rapid realities of contemporary business.\n\nAt Godol Institute, our curriculum is shaped directly by industry practitioners: CEOs who sign payrolls, CFOs who balance multi-currency books, and marketing directors who run real ad budgets. The results speak for themselves: over 88% of our alumni report promotion or revenue expansion within 6 months of graduation.`,
      category: "Strategy",
      author: "Maryam Warsame",
      readTime: "4 min read",
      published: true,
      featured: false,
      publishedAt: "2026-06-18"
    }
  ],
  students: [
    {
      id: 1,
      name: "Mohamed Nasri",
      email: "mohamed@example.com",
      phone: "+252 61 234 5678",
      whatsapp: "25261234567",
      registeredAt: "2026-04-01T10:00:00Z",
      status: "active",
      adminNotes: ""
    }
  ],
  enrollments: [
    {
      id: 1,
      studentName: "Mohamed Nasri",
      studentEmail: "mohamed@example.com",
      studentPhone: "+252 61 234 5678",
      courseId: 1,
      courseTitle: "Strategic Business Planning Masterclass",
      coursePrice: 149,
      paymentId: 1,
      paymentStatus: "verified",
      enrollmentStatus: "approved",
      accessGranted: true,
      accessGrantedAt: "2026-05-10T09:00:00Z",
      progress: 65,
      enrolledAt: "2026-05-10T08:30:00Z",
      approvedAt: "2026-05-10T09:00:00Z",
      approvedBy: "admin@godolinstitute.so"
    },
    {
      id: 2,
      studentName: "Mohamed Nasri",
      studentEmail: "mohamed@example.com",
      studentPhone: "+252 61 234 5678",
      courseId: 3,
      courseTitle: "Entrepreneurship: From Zero to Scaled Enterprise",
      coursePrice: 99,
      paymentId: 2,
      paymentStatus: "verified",
      enrollmentStatus: "completed",
      accessGranted: true,
      accessGrantedAt: "2026-04-01T15:00:00Z",
      progress: 100,
      enrolledAt: "2026-04-01T14:20:00Z",
      approvedAt: "2026-04-01T15:00:00Z",
      approvedBy: "admin@godolinstitute.so"
    }
  ],
  certificates: [
    {
      id: 1,
      studentName: "Mohamed Nasri",
      studentEmail: "mohamed@example.com",
      courseId: 3,
      courseTitle: "Entrepreneurship: From Zero to Scaled Enterprise",
      instructorName: "Faisal Ahmed",
      certificateNumber: "GDL-2026-8491",
      status: "issued",
      issueDate: "2026-05-02"
    }
  ],
  payments: [
    {
      id: 1,
      enrollmentId: 1,
      courseId: 1,
      courseTitle: "Strategic Business Planning Masterclass",
      coursePrice: 149,
      studentName: "Mohamed Nasri",
      studentEmail: "mohamed@example.com",
      studentPhone: "+252 61 234 5678",
      studentWhatsapp: "25261234567",
      provider: "EVC Plus",
      senderPhone: "252615678901",
      transactionRef: "EVC-TX-99482104",
      claimedAmount: 149,
      verifiedAmount: 149,
      currency: "USD",
      status: "verified",
      submittedAt: "2026-05-10T08:32:00Z",
      verifiedAt: "2026-05-10T09:00:00Z",
      verifiedBy: "admin@godolinstitute.so",
      adminNotes: "Verified via Hormuud transaction SMS",
      receiptUrl: null
    },
    {
      id: 2,
      enrollmentId: 2,
      courseId: 3,
      courseTitle: "Entrepreneurship: From Zero to Scaled Enterprise",
      coursePrice: 99,
      studentName: "Mohamed Nasri",
      studentEmail: "mohamed@example.com",
      studentPhone: "+252 61 234 5678",
      studentWhatsapp: "25261234567",
      provider: "Zaad",
      senderPhone: "252635678901",
      transactionRef: "ZD-TX-10029481",
      claimedAmount: 99,
      verifiedAmount: 99,
      currency: "USD",
      status: "verified",
      submittedAt: "2026-04-01T14:25:00Z",
      verifiedAt: "2026-04-01T15:00:00Z",
      verifiedBy: "admin@godolinstitute.so",
      adminNotes: "Confirmed via Telesom Zaad",
      receiptUrl: null
    }
  ],
  audit_logs: [
    {
      id: 1,
      action: "payment_verified",
      adminEmail: "admin@godolinstitute.so",
      targetType: "payment",
      targetId: 1,
      details: "Verified payment EVC-TX-99482104 — $149 for Strategic Business Planning Masterclass",
      timestamp: "2026-05-10T09:00:00Z"
    },
    {
      id: 2,
      action: "enrollment_approved",
      adminEmail: "admin@godolinstitute.so",
      targetType: "enrollment",
      targetId: 1,
      details: "Approved enrollment for Mohamed Nasri in Strategic Business Planning Masterclass",
      timestamp: "2026-05-10T09:00:00Z"
    }
  ],
  notifications: [
    {
      id: 1,
      type: "payment_verified",
      studentEmail: "mohamed@example.com",
      message: "Your payment for Strategic Business Planning Masterclass has been verified. You now have full course access.",
      read: true,
      createdAt: "2026-05-10T09:00:00Z"
    }
  ]
};
