// seedMore.js - Add 100 more posts and 10 more groups
// Usage: node seedMore.js
// Does NOT delete existing data - only adds new

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

function randomPastDate(daysBack = 30) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

// Sample content for posts
const sampleTexts = [
  "Vừa hoàn thành dự án mới với React Native! #ReactNative #MobileDev",
  "Chia sẽ tip về clean code cho frontend developers #CleanCode #Frontend",
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
];

const feelings = [
  "😊 Vui", "🔥 Nhiệt huyết", "💡 Sáng tạo", "🤔 Đang suy nghĩ",
  "📚 Đang học hỏi", "💪 Kiên trì", "🎯 Tập trung", "😎 Tự tin",
];

const moreGroups = [
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

  // ========== GET EXISTING USERS ==========
  console.log("\n[1/3] Getting existing users...");
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} existing users`);
  
  if (users.length === 0) {
    console.log("ERROR: No users found! Run seed.js first.");
    await mongoose.disconnect();
    return;
  }

  // ========== ADD MORE GROUPS ==========
  console.log("\n[2/3] Adding more groups...");
  
  for (const groupData of moreGroups) {
    const existing = await Group.findOne({ name: groupData.name });
    if (existing) {
      console.log(`Group "${groupData.name}" already exists, skipping...`);
      continue;
    }

    // Random owner from existing users
    const owner = users[Math.floor(Math.random() * users.length)];
    
    // Random 2-4 members
    const memberCount = randomInt(2, 4);
    const selectedUsers = getRandomElements(users.filter(u => u._id.toString() !== owner._id.toString()), memberCount);
    
    const members = [
      { userId: owner._id.toString(), displayName: owner.username, role: "leader" },
      ...selectedUsers.map(u => ({ userId: u._id.toString(), displayName: u.username, role: "member" }))
    ];

    await Group.create({
      name: groupData.name,
      description: groupData.description,
      ownerId: owner._id.toString(),
      visibility: "public",
      members,
    });

    console.log(`Created group: "${groupData.name}" with ${members.length} members`);
  }

  // ========== ADD MORE POSTS ==========
  console.log("\n[3/3] Adding 100 new posts...");
  
  const newPosts = [];
  const postCount = 100;
  
  for (let i = 0; i < postCount; i++) {
    const author = users[Math.floor(Math.random() * users.length)];
    const text = sampleTexts[i % sampleTexts.length];
    const hashtags = getRandomHashtags(randomInt(2, 5));
    const hasImage = Math.random() > 0.6;
    const hasFeeling = Math.random() > 0.5;
    
    const post = {
      authorId: author._id.toString(),
      authorName: author.username,
      authorSubtitle: author.bio || "Thành viên ChatWave",
      authorAvatar: author.avatar,
      text: text,
      imageUrl: hasImage ? `https://picsum.photos/seed/${Date.now() + i}/800/600` : null,
      feeling: hasFeeling ? feelings[Math.floor(Math.random() * feelings.length)] : null,
      likes: randomInt(5, 100),
      comments: randomInt(0, 30),
      shares: randomInt(0, 10),
      likedBy: [],
      commentList: [],
      hashtags: hashtags,
      createdAt: randomPastDate(60),
    };

    newPosts.push(post);
  }

  // Insert posts
  await Post.insertMany(newPosts);
  console.log(`Created ${newPosts.length} new posts!`);

  console.log("\n✅ Done! Data has been added without removing existing data.");
  console.log("Refresh your frontend to see the new posts (randomized order).");
  
  await mongoose.disconnect();
}

main().catch(console.error);
