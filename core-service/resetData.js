// resetData.js - Delete ALL users, posts, and groups, then reseed
// Usage: node resetData.js
// WARNING: This will DELETE all data in users, posts, groups collections!

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const User = require("./src/models/User");
const Post = require("./src/models/Post");
const Group = require("./src/models/Group");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysBack = 60) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

// Vietnamese names
const vietnameseNames = [
  "Nguyễn Minh", "Phạm Thị Linh", "Trần Đức Khoa", "Lê Hương", "Võ Minh Dương",
  "Nguyễn Hoàng Anh", "Phùng Thị Mai", "Lê Đình Sơn", "Nguyễn Thị Lan", "Phạm Quang Huy",
  "Trần Minh Trang", "Nguyễn Đức Bảo", "Hoàng Thu", "Hồ Đức Nam", "Lê Thị Phương",
  "Trần Ngọc Vinh", "Nguyễn Thảo Hà", "Lê Văn Đức", "Nguyễn Thế Tùng", "Phạm Ngọc Uyên",
  "Trần Thanh Hiếu", "Lê Khánh Nhi", "Đặng Minh Thành", "Nguyễn Ngọc Uyên", "Trần Đình Quang",
  "Hồ Minh Chí", "Nguyễn Diễm Hạnh", "Trần Gia Kiệt", "Nguyễn Thu Hiền", "Phạm Đức Phong",
  "Trần Minh Thảo", "Nguyễn Gia Hoàng", "Phạm Ngọc Quỳnh", "Lê Duy Nghĩa", "Trần Thị Thủy",
  "Nguyễn Nhựt Tân", "Nguyễn Thu Hien", "Võ Đình Lâm", "Nguyễn Thị Hương", "Trần Đình Phúc",
  "Lê Thị Trâm", "Trần Việt Tuấn", "Nguyễn Hoàng Bình", "Trần Minh Giang", "Phạm Thanh Nam",
  "Nguyễn Thị Mỹ", "Trần Văn Hùng", "Nguyễn Thị Hồng", "Nguyễn Văn Sơn", "Trần Khánh",
  "Lê Thị Ngân", "Nguyễn Hoàng Việt", "Phạm Thị Diệp", "Nguyễn Phúc Long", "Nguyễn Vũ Trân",
  "Nguyễn Hải Anh", "Trần Đình Cường", "Bùi Hoàng Sơn", "Đỗ Thu Hà", "Vũ Minh Tuấn",
  "Lưu Đức Anh", "Trịnh Ngọc Hân", "Phan Đình Phong", "Ngô Thị Minh", "Hà Đức Trung",
  "Cao Thị Lan", "Đinh Minh Đức", "Lục Thanh Hà", "Chu Văn Minh", "Bạch Thu Hương",
  "Thạch Minh Tuệ", "Hứa Thị Mai", "Giang Hoàng Nam", "Tạ Thị Lan", "Khuất Văn Anh",
  "Nguyễn Đình Khang", "Phạm Thị Kim", "Trương Gia Bảo", "Võ Thị Hồng", "Đặng Hoàng Long",
  "Lê Ngọc Minh", "Trần Quốc Việt", "Nguyễn Thanh Sơn", "Phạm Đình Khoa", "Hoàng Minh Tuấn",
  "Nguyễn Thị Thanh", "Trần Huy Hoàng", "Lê Thị Hương", "Phạm Quang Minh", "Nguyễn Thịnh Đạt",
  "Võ Đình Trọng", "Nguyễn Thị Phương", "Trần Đức Thắng", "Lê Hoàng Nam", "Phạm Thị Thanh",
  "Nguyễn Đình Thành", "Trần Thu Hà", "Lê Văn Đạt", "Nguyễn Thị Huyền", "Phạm Hoàng Dương",
  "Trần Ngọc Ánh", "Nguyễn Quốc Huy", "Lê Thị Mai", "Trần Đức Hiệp", "Phạm Minh Đức",
  "Nguyễn Thị Thảo", "Trần Quang Hùng", "Lê Thị Ngọc", "Nguyễn Phú Quý", "Trần Hữu Tài",
  "Nguyễn Thị Hạnh", "Trần Văn Toàn", "Lê Ngọc Thanh", "Nguyễn Đình Chiến", "Phạm Thị Nga",
  "Trần Hoàng Sơn", "Nguyễn Thịnh Vương", "Lê Thị Kim", "Trần Gia Huy", "Phạm Ngọc Lan",
  "Nguyễn Đình Thi", "Trần Thị Vân", "Lê Quốc Trung", "Nguyễn Thị Xuyến", "Phạm Hoàng Lâm",
  "Trần Thị Minh", "Nguyễn Tiến Dũng", "Lê Thị Yến", "Trần Minh Đức", "Phạm Đức Trung",
  "Nguyễn Thị Hồng", "Trần Ngọc Mai", "Lê Quang Huy", "Nguyễn Thịnh Hùng", "Phạm Thị Loan",
  "Trần Đức Minh", "Nguyễn Văn Hải", "Lê Thị Hà", "Trần Thanh Tùng", "Phạm Văn Tân",
  "Nguyễn Thịnh Minh", "Trần Ngọc Huy", "Lê Hoàng Dũng", "Nguyễn Thị Hương Giang", "Phạm Đình Thắng",
  "Trần Thị Kim", "Nguyễn Đức Kiên", "Lê Thị Bích", "Trần Hoàng Đạt", "Phạm Văn Lâm",
  "Nguyễn Thịnh Sơn", "Trần Quang Minh", "Lê Đức Anh", "Nguyễn Thị Lan Anh", "Phạm Hoàng Tùng",
  "Trần Thịnh Phong", "Nguyễn Văn Đức", "Lê Thị Hạnh", "Trần Gia Bảo", "Phạm Minh Quang",
  "Nguyễn Đức Duy", "Trần Thị Quỳnh", "Lê Hoàng Phú", "Nguyễn Thị Yến", "Phạm Đức Kiệt",
  "Trần Đức Trung", "Nguyễn Văn Tiến", "Lê Thị Thanh", "Trần Ngọc Bảo", "Phạm Văn Hùng",
];

const sampleTexts = [
  "Vừa hoàn thành dự án mới với React Native! #ReactNative #MobileDev",
  "Chia sẻ tip về clean code cho frontend developers #CleanCode #Frontend",
  "Hôm nay khám phá thêm về TypeScript generics #TypeScript #WebDev",
  "AI đang thay đổi cách chúng ta lập trình #AI #Programming",
  "Setup ESLint và Prettier cho dự án Node.js #DevOps #NodeJS",
  "Thiết kế UI cần chú ý điều gì để thu hút người dùng? #UIDesign #UXDesign",
  "Docker compose là gì và tại sao nên dùng? #Docker #DevOps",
  "Tìm hiểu về microservices architecture #Backend #Architecture",
  "State management trong React: Redux vs Zustand #ReactJS #JavaScript",
  "CSS Grid hay Flexbox - Khi nào nên dùng cái nào? #CSS #WebDesign",
  "Code review là gì và tại sao nó quan trọng? #Programming #DevOps",
  "Bí quyết học lập trình hiệu quả cho người mới #LearnToCode #Programming",
  "Xu hướng web development 2026 có gì mới? #WebDev #Tech",
  "PostgreSQL vs MongoDB - Nên chọn cái nào? #Database #Backend",
  "Kubernetes for beginners - Hướng dẫn từ A đến Z #Kubernetes #DevOps",
  "Performance optimization cho React app #ReactJS #WebDev",
  "Authentication flow: JWT vs Session #Backend #Security",
  "Figma tips cho UI/UX designers #UIDesign #Figma",
  "Tại sao testing quan trọng trong development? #Testing #Programming",
  "Cloud computing với AWS cho người mới bắt đầu #AWS #CloudComputing",
  "Responsive design không khó như bạn nghĩ #WebDesign #CSS",
  "Git workflow tốt nhất cho team development #Git #DevOps",
  "GraphQL vs REST API - So sánh chi tiết #Backend #API",
  "Machine learning cơ bản với Python #Python #MachineLearning",
  "CI/CD pipeline cho dự án của bạn #DevOps #CI",
  "Web accessibility - Thiết kế cho mọi người #WebDesign #Accessibility",
  "Next.js 15 có gì mới? #NextJS #ReactJS",
  "Security best practices cho web app #Security #WebDev",
  "Data structures và algorithms cho interview #Programming #Algorithms",
  "Deploy app lên Vercel nhanh chóng #WebDev #DevOps",
  "MERN stack vs MEAN stack - Chọn cái nào? #WebDev #JavaScript",
  "UI components library tốt nhất 2026 #UIDesign #ReactJS",
  "Code splitting và lazy loading trong React #ReactJS #Performance",
  "API design principles cho developer #API #Backend",
  "WebSocket cho real-time application #WebSocket #NodeJS",
  "MongoDB aggregation pipeline tutorial #MongoDB #Database",
  "CSS animation effects đẹp mắt #CSS #WebDesign",
  "React hooks tips và tricks #ReactJS #Hooks",
  "Version control với Git - Advanced tips #Git #DevOps",
  "Unit testing với Jest cho JavaScript #Testing #JavaScript",
];

const allHashtags = [
  "#ReactJS", "#VueJS", "#Angular", "#NodeJS", "#TypeScript", "#JavaScript",
  "#WebDev", "#Frontend", "#Backend", "#MobileDev", "#ReactNative", "#Flutter",
  "#UIDesign", "#UXDesign", "#ProductDesign", "#CleanCode", "#DevOps",
  "#Docker", "#Kubernetes", "#CloudComputing", "#AWS", "#MongoDB", "#PostgreSQL",
  "#CodingLife", "#Developer", "#Programming", "#TechCommunity", "#LearnToCode",
  "#TechTips", "#WebDesign", "#AppDesign", "#Python", "#AI", "#MachineLearning",
  "#Security", "#Testing", "#Git", "#API", "#Microservices", "#Docker",
  "#Startup", "#RemoteWork", "#Career", "#TechNews", "#Web3", "#Blockchain",
];

const feelings = [
  "😊 Vui", "🔥 Nhiệt huyết", "💡 Sáng tạo", "🤔 Đang suy nghĩ",
  "📚 Đang học hỏi", "💪 Kiên trì", "🎯 Tập trung", "😎 Tự tin",
  "🚀 Đang boost", "✨ Hứng khởi", "🎉 Phấn khích", "😴 Mệt mỏi",
];

const groups = [
  { name: "React Developers Vietnam", description: "Cộng đồng React Developers Việt Nam - Chia sẻ kiến thức, kinh nghiệm và xu hướng mới nhất về React." },
  { name: "Design Community", description: "Nơi gặp gỡ của các UI/UX Designer - Thảo luận về design trends, tools và portfolio." },
  { name: "Mobile Dev Hub", description: "Cộng đồng phát triển ứng dụng di động - React Native, Flutter, Swift, Kotlin và hơn thế nữa." },
  { name: "Backend Architects", description: "Group riêng cho các Backend Developers - System design, microservices, DevOps và cloud architecture." },
  { name: "AI & Machine Learning Vietnam", description: "Cộng đồng AI và ML tại Việt Nam - Chia sẻ kiến thức và xu hướng mới nhất về trí tuệ nhân tạo." },
  { name: "Python Developers VN", description: "Nhóm dành cho lập trình viên Python - Từ beginners đến experts." },
  { name: "DevOps Vietnam", description: "DevOps best practices, CI/CD, Docker, Kubernetes và hơn thế nữa." },
  { name: "Data Science Community", description: "Data analysis, visualization và machine learning với Python và R." },
  { name: "iOS Development", description: "Swift, SwiftUI và tất cả về phát triển ứng dụng iOS/macOS." },
  { name: "Startup Founders Vietnam", description: "Kết nối các founders Việt Nam - Chia sẻ kinh nghiệm khởi nghiệp." },
  { name: "Cloud Architects", description: "AWS, GCP, Azure - Kiến trúc hệ thống cloud và best practices." },
  { name: "Open Source Projects", description: "Nơi chia sẻ và phát triển các dự án open source Việt Nam." },
  { name: "Game Development", description: "Unity, Unreal Engine và phát triển game tại Việt Nam." },
  { name: "Cyber Security Hub", description: "An ninh mạng, ethical hacking và bảo mật ứng dụng." },
];

function getRandomHashtags(count = 3) {
  const shuffled = [...allHashtags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomElements(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  // ========== DELETE ALL DATA ==========
  console.log("\n🗑️  Deleting all users, posts, and groups...");
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Group.deleteMany({}),
  ]);
  console.log("✓ Deleted all data!");

  // ========== CREATE USERS ==========
  console.log("\n👥 Creating 100 users with Vietnamese names...");
  const passwordHash = await bcrypt.hash("123123", 8);
  const users = [];
  
  for (let i = 0; i < 100; i++) {
    const name = vietnameseNames[i % vietnameseNames.length];
    users.push({
      email: `user${i + 1}@chatwave.com`,
      username: name + (i >= vietnameseNames.length ? ` ${Math.floor(i / vietnameseNames.length) + 1}` : ""),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
      bio: "Thành viên ChatWave",
      passwordHash,
      phone: null,
    });
  }
  
  const createdUsers = await User.insertMany(users);
  console.log(`✓ Created ${createdUsers.length} users!`);

  // ========== CREATE GROUPS ==========
  console.log("\n📁 Creating groups...");
  for (const g of groups) {
    const owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const memberCount = randomInt(3, 8);
    const members = [
      { userId: owner._id.toString(), displayName: owner.username, role: "leader" },
      ...getRandomElements(createdUsers.filter(u => u._id.toString() !== owner._id.toString()), memberCount).map(u => ({
        userId: u._id.toString(),
        displayName: u.username,
        role: "member"
      }))
    ];
    
    await Group.create({
      name: g.name,
      description: g.description,
      ownerId: owner._id.toString(),
      visibility: "public",
      members,
    });
    console.log(`✓ Created group: "${g.name}"`);
  }

  // ========== CREATE POSTS ==========
  console.log("\n📝 Creating 100 posts...");
  const posts = [];
  
  for (let i = 0; i < 100; i++) {
    const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const text = sampleTexts[i % sampleTexts.length];
    const hashtags = getRandomHashtags(randomInt(2, 5));
    const hasImage = Math.random() > 0.6;
    const hasFeeling = Math.random() > 0.5;
    
    // Random likedBy
    const likeCount = randomInt(5, 80);
    const likedBy = getRandomElements(createdUsers, likeCount).map(u => u._id.toString());
    
    posts.push({
      authorId: author._id.toString(),
      authorName: author.username,
      authorSubtitle: author.bio,
      authorAvatar: author.avatar,
      text: text,
      imageUrl: hasImage ? `https://picsum.photos/seed/${Date.now() + i}/800/600` : null,
      feeling: hasFeeling ? feelings[Math.floor(Math.random() * feelings.length)] : null,
      likes: likeCount,
      comments: randomInt(0, 20),
      shares: randomInt(0, 10),
      likedBy,
      commentList: [],
      hashtags,
      createdAt: randomPastDate(60),
    });
  }
  
  await Post.insertMany(posts);
  console.log(`✓ Created ${posts.length} posts!`);

  console.log("\n✅ Done! Database has been reset with Vietnamese names.");
  console.log("Refresh your frontend to see the new data!");
  
  await mongoose.disconnect();
}

main().catch(console.error);
