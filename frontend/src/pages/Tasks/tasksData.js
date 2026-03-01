// Mock data - các task đã được giao cho mình từ nhóm / bạn bè
// Mỗi task có thể có đầy đủ chi tiết hoặc để trống các trường không có

export const mockAssignedTasks = [
  {
    id: 1,
    title: "Chuẩn bị slide báo cáo tuần",
    assigner: "Minh Anh",
    source: "group",
    sourceName: "Nhóm ChatWave",
    dueDate: "15/03/2025",
    status: "pending",
    priority: "high",
    // --- Chi tiết ---
    description: {
      what: "Tổng hợp tiến độ tuần, số liệu chính và chuẩn bị file slide trình bày trong cuộc họp team.",
      purpose: "Đồng bộ thông tin với cả nhóm và cấp trên, làm cơ sở ra quyết định cho tuần tới.",
      scopeDo: [
        "Thu thập số liệu từ các nguồn đã thống nhất (Analytics, Support ticket).",
        "Điền template slide có sẵn của team.",
        "Gửi bản nháp cho Minh Anh trước 14/03.",
      ],
      scopeDont: [
        "Không thay đổi format template.",
                        "Không thêm nội dung ngoài phạm vi báo cáo tuần.",
      ],
    },
    expectedResults: [
      "File slide hoàn chỉnh (PDF + bản chỉnh sửa).",
      "Trình bày trong cuộc họp team đúng lịch.",
    ],
    assignee: "Bạn",
    reviewer: "Minh Anh",
    estimatedEffort: "2–3 giờ",
    acceptanceCriteria: [
      { text: "Đủ các mục: Tổng quan, Số liệu, Rủi ro, Kế hoạch tuần sau", checked: true },
      { text: "Số liệu đã được kiểm chéo với nguồn chính thức", checked: false },
      { text: "Gửi file trước 17h ngày 14/03", checked: false },
    ],
    deliverables: [
      { label: "Slide báo cáo tuần 10", link: "/files/bao-cao-tuan-10.pptx" },
      { label: "File PDF export", link: null },
    ],
    references: [
      { label: "Template báo cáo tuần", link: "/docs/template-bao-cao" },
      { label: "Hướng dẫn lấy số liệu", link: "/docs/analytics-guide" },
    ],
    risksNotes: "Nếu thiếu số liệu từ bộ phận khác, ghi rõ trong slide và báo trước cuộc họp.",
  },
  {
    id: 2,
    title: "Review UI trang Home",
    assigner: "Hùng",
    source: "group",
    sourceName: "Nhóm ChatWave",
    dueDate: "10/03/2025",
    status: "in_progress",
    priority: "medium",
    description: {
      what: "Review giao diện trang Home (layout, responsive, accessibility) và ghi lại feedback chi tiết.",
      purpose: "Đảm bảo trải nghiệm người dùng trước khi release, tránh lỗi UI trên production.",
      scopeDo: [
        "Kiểm tra trên desktop và mobile.",
        "Ghi nhận lỗi/bất thường và đề xuất cải thiện.",
        "Đối chiếu với design Figma nếu có.",
      ],
      scopeDont: [
        "Không sửa code trực tiếp trong task này.",
        "Không review logic nghiệp vụ, chỉ tập trung UI/UX.",
      ],
    },
    expectedResults: [
      "Danh sách feedback có mức độ ưu tiên (P0/P1/P2).",
      "Screenshot hoặc clip minh họa cho từng điểm (nếu có).",
    ],
    assignee: "Bạn",
    reviewer: "Hùng",
    estimatedEffort: "1–2 giờ",
    acceptanceCriteria: [
      { text: "Đã test trên ít nhất 2 kích thước màn hình", checked: true },
      { text: "Mỗi feedback có mô tả rõ và mức độ ưu tiên", checked: true },
      { text: "Gửi feedback trong channel #ui-review trước deadline", checked: false },
    ],
    deliverables: [
      { label: "Feedback doc", link: "/docs/home-ui-feedback" },
    ],
    references: [
      { label: "Figma – Trang Home", link: "https://figma.com/..." },
    ],
    risksNotes: "Một số màn hình chưa có trên Figma, ưu tiên review các flow chính.",
  },
  {
    id: 3,
    title: "Gửi tài liệu thiết kế",
    assigner: "Lan",
    source: "friend",
    sourceName: "Lan",
    dueDate: "05/03/2025",
    status: "done",
    priority: "low",
    description: {
      what: "Gửi lại cho Lan bộ tài liệu thiết kế đã chỉnh sửa theo góp ý.",
      purpose: "Lan cần file để bàn giao cho khách hàng.",
      scopeDo: ["Export PDF từ Figma.", "Gửi qua drive hoặc email theo thỏa thuận."],
      scopeDont: ["Không chỉnh nội dung thiết kế thêm."],
    },
    expectedResults: ["Lan nhận đủ file và xác nhận."],
    assignee: "Bạn",
    reviewer: null,
    estimatedEffort: "30 phút",
    acceptanceCriteria: [
      { text: "Gửi đủ các file trong checklist Lan gửi", checked: true },
      { text: "Định dạng PDF, đúng tên file", checked: true },
    ],
    deliverables: [
      { label: "Link drive chứa PDF", link: null },
    ],
    references: [],
    risksNotes: null,
  },
  {
    id: 4,
    title: "Họp brainstorm ý tưởng",
    assigner: "Admin",
    source: "group",
    sourceName: "Nhóm Marketing",
    dueDate: "12/03/2025",
    status: "pending",
    priority: "high",
    description: {
      what: "Tham gia buổi họp brainstorm ý tưởng chiến dịch Q2, chuẩn bị vài ý tưởng nền trước.",
      purpose: "Tạo input đa dạng cho chiến dịch, kết nối góc nhìn product với marketing.",
      scopeDo: [
        "Chuẩn bị 2–3 ý tưởng (có thể phác thảo ngắn).",
        "Tham gia đầy đủ buổi họp, ghi chú action items.",
      ],
      scopeDont: [
        "Không cam kết timeline/ngân sách khi chưa được phê duyệt.",
      ],
    },
    expectedResults: [
      "Góp phần vào danh sách ý tưởng được ghi nhận.",
      "Bản ghi chú action items gửi lại cho Admin.",
    ],
    assignee: null,
    reviewer: null,
    estimatedEffort: "Khoảng 2 giờ (bao gồm họp)",
    acceptanceCriteria: [
      { text: "Có ít nhất 2 ý tưởng gửi trước hoặc trình bày trong họp", checked: false },
      { text: "Gửi ghi chú action items trong vòng 1 ngày sau họp", checked: false },
    ],
    deliverables: [],
    references: [
      { label: "Brief chiến dịch Q2", link: "/docs/campaign-q2-brief" },
    ],
    risksNotes: "Lịch họp có thể dời nếu thiếu phòng; Admin sẽ thông báo trước 1 ngày.",
  },
  {
    id: 5,
    title: "Gửi feedback về proposal",
    assigner: "Tuấn",
    source: "friend",
    sourceName: "Tuấn",
    dueDate: "08/03/2025",
    status: "pending",
    priority: "medium",
    description: {
      what: "Đọc proposal của Tuấn và gửi feedback mang tính xây dựng (nội dung, cấu trúc, cách trình bày).",
      purpose: "Giúp Tuấn hoàn thiện proposal trước khi gửi khách.",
      scopeDo: [
        "Đọc kỹ proposal.",
        "Ghi lại điểm mạnh, điểm cần cải thiện và gợi ý cụ thể.",
      ],
      scopeDont: [
        "Không viết hộ hoặc sửa trực tiếp văn bản (chỉ gợi ý).",
      ],
    },
    expectedResults: ["Tuấn nhận được feedback dạng bullet/list, rõ ràng và có thể hành động."],
    assignee: "Bạn",
    reviewer: null,
    estimatedEffort: "1 giờ",
    acceptanceCriteria: [
      { text: "Feedback gửi qua email/chat trước 08/03", checked: false },
      { text: "Có ít nhất 3 điểm cụ thể (khen hoặc góp ý)", checked: false },
    ],
    deliverables: [
      { label: "Feedback (email/chat)", link: null },
    ],
    references: [],
    risksNotes: "Tuấn cần gửi proposal trước 06/03 để có đủ thời gian đọc.",
  },
];
