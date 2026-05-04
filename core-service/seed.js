// seed.js
// Usage: node seed.js
// Env: MONGO_URI (optional, default mongodb://localhost:27017/chatwave_loadtest)
// This script only ADDS test data, never deletes existing data

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/chatwave_loadtest";

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

const seedUsersData = [
  {
    email: "minh.nguyen@chatwave.com",
    username: "Nguyễn Minh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh",
    bio: "Frontend Developer | React & Vue enthusiast",
  },
  {
    email: "linh.pham@chatwave.com",
    username: "Phạm Thị Linh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=linh",
    bio: "UI/UX Designer | Creative Soul",
  },
  {
    email: "khoa.tran@chatwave.com",
    username: "Trần Đức Khoa",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khoa",
    bio: "Backend Developer | Node.js & Go",
  },
  {
    email: "huong.le@chatwave.com",
    username: "Lê Hương",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huong",
    bio: "Content Creator | Digital Marketing",
  },
  {
    email: "duong.vo@chatwave.com",
    username: "Võ Minh Dương",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=duong",
    bio: "Mobile Developer | React Native",
  },
  {
    email: "anh.nguyen@chatwave.com",
    username: "Nguyễn Hoàng Anh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anh",
    bio: "DevOps Engineer | AWS Certified",
  },
  {
    email: "mai.phung@chatwave.com",
    username: "Phùng Thị Mai",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mai",
    bio: "Data Scientist | Python & ML",
  },
  {
    email: "son.le@chatwave.com",
    username: "Lê Đình Sơn",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=son",
    bio: "Full-stack Developer | JavaScript",
  },
  {
    email: "lan.nguyen@chatwave.com",
    username: "Nguyễn Thị Lan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lan",
    bio: "Product Manager | Tech Enthusiast",
  },
  {
    email: "huy.pham@chatwave.com",
    username: "Phạm Quang Huy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huy",
    bio: "iOS Developer | Swift Enthusiast",
  },
  {
    email: "trang.tran@chatwave.com",
    username: "Trần Minh Trang",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=trang",
    bio: "Frontend Developer | Vue.js",
  },
  {
    email: "bao.nguyen@chatwave.com",
    username: "Nguyễn Đức Bảo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bao",
    bio: "Game Developer | Unity & Unreal",
  },
  {
    email: "thu.hoang@chatwave.com",
    username: "Hoàng Thu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thu",
    bio: "Tech Writer | AI & Cloud",
  },
  {
    email: "nam.ho@chatwave.com",
    username: "Hồ Đức Nam",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nam",
    bio: "Security Engineer | Ethical Hacking",
  },
  {
    email: "phuong.le@chatwave.com",
    username: "Lê Thị Phương",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=phuong",
    bio: "UX Researcher | User-Centered Design",
  },
  {
    email: "vinh.tran@chatwave.com",
    username: "Trần Ngọc Vinh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vinh",
    bio: "Cloud Architect | Azure & GCP",
  },
  {
    email: "ha.nguyen@chatwave.com",
    username: "Nguyễn Thảo Hà",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ha",
    bio: "QA Engineer | Automation Testing",
  },
  {
    email: "duclv@chatwave.com",
    username: "Lê Văn Đức",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=duclv",
    bio: "Tech Lead | Java Spring Boot",
  },
  {
    email: "tung.nguyen@chatwave.com",
    username: "Nguyễn Thế Tùng",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tung",
    bio: "Blockchain Developer | Web3",
  },
  {
    email: "uyen.pham@chatwave.com",
    username: "Phạm Ngọc Uyên",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=uyen",
    bio: "Startup Founder | Product Design",
  },
  {
    email: "hieu.tran@chatwave.com",
    username: "Trần Thanh Hiếu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hieu",
    bio: "ML Engineer | Computer Vision",
  },
  {
    email: "nhi.le@chatwave.com",
    username: "Lê Khánh Nhi",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nhi",
    bio: "Frontend Developer | React",
  },
  {
    email: "thanh.dang@chatwave.com",
    username: "Đặng Minh Thành",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thanh",
    bio: "Backend Developer | Rust & Go",
  },
  {
    email: "uyen.nguyen@chatwave.com",
    username: "Nguyễn Ngọc Uyên",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=uyen2",
    bio: "Product Designer | Figma Expert",
  },
  {
    email: "quang.tran@chatwave.com",
    username: "Trần Đình Quang",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=quang",
    bio: "Infrastructure Engineer | Kubernetes",
  },
  {
    email: "minhchi.ho@chatwave.com",
    username: "Hồ Minh Chí",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=minhchi",
    bio: "AR/VR Developer | Unity",
  },
  {
    email: "hanh.nguyen@chatwave.com",
    username: "Nguyễn Diễm Hạnh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hanh",
    bio: "Scrum Master | Agile Coach",
  },
  {
    email: "kiet.tran@chatwave.com",
    username: "Trần Gia Kiệt",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kiet",
    bio: "Frontend Developer | Next.js",
  },
  {
    email: "thuhien.nguyen@chatwave.com",
    username: "Nguyễn Thu Hiền",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thuhien",
    bio: "Data Analyst | Power BI",
  },
  {
    email: "phong.pham@chatwave.com",
    username: "Phạm Đức Phong",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=phong",
    bio: "Backend Developer | Microservices",
  },
  {
    email: "thao.tran@chatwave.com",
    username: "Trần Minh Thảo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thao",
    bio: "UX Writer | Microcopy Expert",
  },
  {
    email: "hoang.nguyen@chatwave.com",
    username: "Nguyễn Gia Hoàng",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hoang",
    bio: "Flutter Developer | Cross-platform",
  },
  {
    email: "quynh.pham@chatwave.com",
    username: "Phạm Ngọc Quỳnh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=quynh",
    bio: "AI Researcher | NLP Specialist",
  },
  {
    email: "duynghia.le@chatwave.com",
    username: "Lê Duy Nghĩa",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=duynghia",
    bio: "DevSecOps | Security Automation",
  },
  {
    email: "thuy.tran@chatwave.com",
    username: "Trần Thị Thủy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thuy",
    bio: "UI Designer | Design Systems",
  },
  {
    email: "nhut.nguyen@chatwave.com",
    username: "Nguyễn Nhựt Tân",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nhut",
    bio: "Software Architect | System Design",
  },
  {
    email: "hien.nguyen@chatwave.com",
    username: "Nguyễn Thu Hien",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hien",
    bio: "Frontend Developer | Angular",
  },
  {
    email: "lam.vo@chatwave.com",
    username: "Võ Đình Lâm",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lam",
    bio: "Backend Developer | Elixir",
  },
  {
    email: "huong.nguyen@chatwave.com",
    username: "Nguyễn Thị Hương",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huong2",
    bio: "Project Manager | Tech Industry",
  },
  {
    email: "phuc.tran@chatwave.com",
    username: "Trần Đình Phúc",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=phuc",
    bio: "iOS Developer | SwiftUI",
  },
  {
    email: "tram.le@chatwave.com",
    username: "Lê Thị Trâm",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tram",
    bio: "Business Analyst | Tech Consulting",
  },
  {
    email: "viettuan.tran@chatwave.com",
    username: "Trần Việt Tuấn",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=viettuan",
    bio: "Full-stack Developer | MERN Stack",
  },
  {
    email: "binh.nguyen@chatwave.com",
    username: "Nguyễn Hoàng Bình",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=binh",
    bio: "Database Administrator | PostgreSQL",
  },
  {
    email: "giang.tran@chatwave.com",
    username: "Trần Minh Giang",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=giang",
    bio: "CTO | Tech Leader",
  },
  {
    email: "thanhnam.pham@chatwave.com",
    username: "Phạm Thanh Nam",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thanhnam",
    bio: "DevOps Engineer | CI/CD Pipelines",
  },
  {
    email: "my.nguyen@chatwave.com",
    username: "Nguyễn Thị Mỹ",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=my",
    bio: "UX Designer | Mobile Design",
  },
  {
    email: "hung.tran@chatwave.com",
    username: "Trần Văn Hùng",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hung",
    bio: "Java Developer | Enterprise Apps",
  },
  {
    email: "hong.nguyen@chatwave.com",
    username: "Nguyễn Thị Hồng",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hong",
    bio: "Tech Recruiter | Hiring Tech Talents",
  },
  {
    email: "son.nguyen@chatwave.com",
    username: "Nguyễn Văn Sơn",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=son2",
    bio: "Embedded Developer | IoT",
  },
  {
    email: "khanh.tran@chatwave.com",
    username: "Trần Khánh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khanh",
    bio: "Python Developer | Django",
  },
  {
    email: "ngan.le@chatwave.com",
    username: "Lê Thị Ngân",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ngan",
    bio: "Frontend Developer | Svelte",
  },
  {
    email: "viet.nguyen@chatwave.com",
    username: "Nguyễn Hoàng Việt",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=viet",
    bio: "Tech Blogger | Developer Advocate",
  },
  {
    email: "diep.pham@chatwave.com",
    username: "Phạm Thị Diệp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diep",
    bio: "UX Designer | Interaction Design",
  },
  {
    email: "long.nguyen@chatwave.com",
    username: "Nguyễn Phúc Long",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=long",
    bio: "Backend Developer | GraphQL",
  },
  {
    email: "vutran.nguyen@chatwave.com",
    username: "Nguyễn Vũ Trân",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vutran",
    bio: "Frontend Developer | Tailwind CSS",
  },
  {
    email: "haianh.nguyen@chatwave.com",
    username: "Nguyễn Hải Anh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=haianh",
    bio: "Tech Enthusiast | Open Source",
  },
  {
    email: "cuong.tran@chatwave.com",
    username: "Trần Đình Cường",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cuong",
    bio: "DevOps Engineer | Terraform",
  },
];

const seedGroupsData = [
  {
    name: "React Developers Vietnam",
    description: "Cộng đồng React Developers Việt Nam - Chia sẻ kiến thức, kinh nghiệm và xu hướng mới nhất về React.",
    visibility: "public",
    memberEmails: ["minh.nguyen@chatwave.com", "khoa.tran@chatwave.com", "huong.le@chatwave.com"],
  },
  {
    name: "Design Community",
    description: "Nơi gặp gỡ của các UI/UX Designer - Thảo luận về design trends, tools và portfolio.",
    visibility: "public",
    memberEmails: ["linh.pham@chatwave.com", "huong.le@chatwave.com"],
  },
  {
    name: "Mobile Dev Hub",
    description: "Cộng đồng phát triển ứng dụng di động - React Native, Flutter, Swift, Kotlin và hơn thế nữa.",
    visibility: "public",
    memberEmails: ["duong.vo@chatwave.com", "minh.nguyen@chatwave.com"],
  },
  {
    name: "Backend Architects",
    description: "Group riêng cho các Backend Developers - System design, microservices, DevOps và cloud architecture.",
    visibility: "private",
    memberEmails: ["khoa.tran@chatwave.com"],
  },
];

const seedHashtags = [
  "#ReactJS", "#VueJS", "#Angular", "#NodeJS", "#TypeScript", "#JavaScript",
  "#WebDev", "#Frontend", "#Backend", "#MobileDev", "#ReactNative", "#Flutter",
  "#UIDesign", "#UXDesign", "#ProductDesign", "#CleanCode", "#DevOps",
  "#Docker", "#Kubernetes", "#CloudComputing", "#AWS", "#MongoDB", "#PostgreSQL",
  "#CodingLife", "#Developer", "#Programming", "#TechCommunity", "#LearnToCode",
  "#TechTips", "#WebDesign", "#AppDesign"
];

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 20,
  });

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 8);
  const passwordHash = await bcrypt.hash("123123", saltRounds);

  // ========== USERS ==========
  console.log("\n[1/4] Checking for seed users...");
  const existingUsers = await User.find({
    email: { $in: seedUsersData.map((u) => u.email) },
  }).lean();

  const existingEmails = existingUsers.map((u) => u.email);
  const missingUsersData = seedUsersData.filter(
    (u) => !existingEmails.includes(u.email)
  );

  if (missingUsersData.length > 0) {
    console.log(`Creating ${missingUsersData.length} missing seed users...`);
    const newUsers = await User.insertMany(
      missingUsersData.map((u) => ({
        ...u,
        phone: null,
        passwordHash,
      }))
    );
    console.log(`Created ${newUsers.length} seed users`);
  } else {
    console.log("All seed users already exist, skipping...");
  }

  // Get all seed users
  const allSeedUsers = await User.find({
    email: { $in: seedUsersData.map((u) => u.email) },
  }).lean();

  // ========== GROUPS ==========
  console.log("\n[2/4] Checking for seed groups...");
  const existingGroups = await Group.find({
    name: { $in: seedGroupsData.map((g) => g.name) },
  }).lean();

  const existingGroupNames = existingGroups.map((g) => g.name);

  for (const groupData of seedGroupsData) {
    if (existingGroupNames.includes(groupData.name)) {
      console.log(`Group "${groupData.name}" already exists, skipping...`);
      continue;
    }

    // Find owner (first member in the list)
    const ownerEmail = groupData.memberEmails[0];
    const owner = allSeedUsers.find((u) => u.email === ownerEmail);

    if (!owner) {
      console.log(`Owner not found for group "${groupData.name}", skipping...`);
      continue;
    }

    // Build members array
    const members = groupData.memberEmails.map((email, index) => {
      const user = allSeedUsers.find((u) => u.email === email);
      return {
        userId: user._id.toString(),
        displayName: user.username,
        role: index === 0 ? "leader" : "member",
      };
    });

    await Group.create({
      name: groupData.name,
      description: groupData.description,
      ownerId: owner._id.toString(),
      visibility: groupData.visibility,
      members,
    });

    console.log(`Created group: "${groupData.name}" with ${members.length} members`);
  }

  // Get all seed groups
  const allSeedGroups = await Group.find({
    name: { $in: seedGroupsData.map((g) => g.name) },
  }).lean();

  // ========== POSTS ==========
  console.log("\n[3/4] Checking for seed posts...");
  const userIds = allSeedUsers.map((u) => u._id.toString());
  const existingPostCount = await Post.countDocuments({
    authorId: { $in: userIds },
  });

  if (existingPostCount > 0) {
    console.log(`Found ${existingPostCount} existing seed posts, skipping...`);
  } else {
    // Helper to get random hashtags
    const getRandomHashtags = (count = 2) => {
      const shuffled = [...seedHashtags].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    const seedPosts = [
      // Minh Nguyễn's posts
      {
        authorId: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?._id,
        authorName: "Minh Nguyễn",
        authorSubtitle: "Frontend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?.avatar,
        text: "Vừa hoàn thành dự án React mới! Một trải nghiệm tuyệt vời với hooks và context API. #ReactJS #Frontend",
        feeling: "😊 Vui",
        likes: randomInt(15, 50),
        comments: randomInt(3, 12),
        shares: randomInt(1, 5),
        hashtags: ["#ReactJS", "#Frontend", "#WebDev"],
        createdAt: randomPastDate(5),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?._id,
        authorName: "Minh Nguyễn",
        authorSubtitle: "Frontend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?.avatar,
        text: "Check out bộ sưu tập gradient backgrounds cho project tiếp theo! Rất cool! #WebDesign #UIDesign",
        imageUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
        likes: randomInt(20, 60),
        comments: randomInt(5, 15),
        shares: randomInt(2, 8),
        hashtags: ["#WebDesign", "#UIDesign", "#CSS"],
        createdAt: randomPastDate(3),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?._id,
        authorName: "Minh Nguyễn",
        authorSubtitle: "Frontend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?.avatar,
        text: "Code clean là code happy! Luôn nhớ clean code principles nhé mọi người. #CleanCode #Programming",
        imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
        likes: randomInt(25, 70),
        comments: randomInt(8, 20),
        shares: randomInt(3, 10),
        hashtags: ["#CleanCode", "#Programming", "#BestPractices"],
        createdAt: randomPastDate(1),
      },
      // Linh Phạm's posts
      {
        authorId: allSeedUsers.find((u) => u.email === "linh.pham@chatwave.com")?._id,
        authorName: "Linh Phạm",
        authorSubtitle: "UI/UX Designer",
        authorAvatar: allSeedUsers.find((u) => u.email === "linh.pham@chatwave.com")?.avatar,
        text: "Thiết kế không chỉ là làm đẹp, mà là giải quyết vấn đề một cách thẩm mỹ. #UIDesign #UXDesign",
        feeling: "💡 Sáng tạo",
        likes: randomInt(30, 80),
        comments: randomInt(10, 25),
        shares: randomInt(5, 15),
        hashtags: ["#UIDesign", "#UXDesign", "#ProductDesign"],
        createdAt: randomPastDate(4),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "linh.pham@chatwave.com")?._id,
        authorName: "Linh Phạm",
        authorSubtitle: "UI/UX Designer",
        authorAvatar: allSeedUsers.find((u) => u.email === "linh.pham@chatwave.com")?.avatar,
        text: "Moodboard cho dự án branding mới - pastel tones với hints của coral! #Design #Branding",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        likes: randomInt(40, 100),
        comments: randomInt(12, 30),
        shares: randomInt(8, 20),
        hashtags: ["#Design", "#Branding", "#Moodboard"],
        createdAt: randomPastDate(2),
      },
      // Khoa Trần's posts
      {
        authorId: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?._id,
        authorName: "Khoa Trần",
        authorSubtitle: "Backend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?.avatar,
        text: "Đang deep dive vào Go lang cho microservices. Performance thật sự ấn tượng! #Golang #Backend",
        feeling: "🔥 Hứng thú",
        likes: randomInt(18, 45),
        comments: randomInt(4, 15),
        shares: randomInt(2, 6),
        hashtags: ["#Golang", "#Backend", "#Microservices"],
        createdAt: randomPastDate(4),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?._id,
        authorName: "Khoa Trần",
        authorSubtitle: "Backend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?.avatar,
        text: "Server architecture mới - từ monolith sang microservices architecture. Ai có kinh nghiệm chia sẻ với? #Architecture",
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
        likes: randomInt(35, 90),
        comments: randomInt(8, 22),
        shares: randomInt(5, 12),
        hashtags: ["#Architecture", "#Microservices", "#DevOps"],
        createdAt: randomPastDate(2),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?._id,
        authorName: "Khoa Trần",
        authorSubtitle: "Backend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?.avatar,
        text: "Docker + Kubernetes = Dream team cho deployment. Highly recommend everyone try it! #Docker #Kubernetes",
        imageUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80",
        likes: randomInt(28, 75),
        comments: randomInt(6, 18),
        shares: randomInt(4, 10),
        hashtags: ["#Docker", "#Kubernetes", "#DevOps"],
        createdAt: randomPastDate(1),
      },
      // Hường Lê's posts
      {
        authorId: allSeedUsers.find((u) => u.email === "huong.le@chatwave.com")?._id,
        authorName: "Hường Lê",
        authorSubtitle: "Content Creator",
        authorAvatar: allSeedUsers.find((u) => u.email === "huong.le@chatwave.com")?.avatar,
        text: "Content is king! Chia sẻ vài tips để viết caption thu hút cho social media. #ContentMarketing #SocialMedia",
        feeling: "✨ Nhiệt tình",
        likes: randomInt(50, 120),
        comments: randomInt(15, 40),
        shares: randomInt(10, 25),
        hashtags: ["#ContentMarketing", "#SocialMedia", "#DigitalMarketing"],
        createdAt: randomPastDate(5),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "huong.le@chatwave.com")?._id,
        authorName: "Hường Lê",
        authorSubtitle: "Content Creator",
        authorAvatar: allSeedUsers.find((u) => u.email === "huong.le@chatwave.com")?.avatar,
        text: "Workspace setup cho content creator - aesthetics meets productivity! Check my setup! #Workspace #Productivity",
        imageUrl: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80",
        likes: randomInt(60, 150),
        comments: randomInt(20, 50),
        shares: randomInt(12, 30),
        hashtags: ["#Workspace", "#Productivity", "#Creator"],
        createdAt: randomPastDate(3),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "huong.le@chatwave.com")?._id,
        authorName: "Hường Lê",
        authorSubtitle: "Content Creator",
        authorAvatar: allSeedUsers.find((u) => u.email === "huong.le@chatwave.com")?.avatar,
        text: "Camera setup cho beginner vloggers - equipment không cần đắt nhưng phải đúng! #Vlog #YouTube",
        imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
        likes: randomInt(45, 110),
        comments: randomInt(12, 35),
        shares: randomInt(8, 20),
        hashtags: ["#Vlog", "#YouTube", "#ContentCreator"],
        createdAt: randomPastDate(1),
      },
      // Dương Võ's posts
      {
        authorId: allSeedUsers.find((u) => u.email === "duong.vo@chatwave.com")?._id,
        authorName: "Dương Võ",
        authorSubtitle: "Mobile Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "duong.vo@chatwave.com")?.avatar,
        text: "React Native vs Flutter - cuộc chiến không hồi kết. Team RN here! Các bạn thích cái nào? #ReactNative #Flutter",
        feeling: "🤔 Suy nghĩ",
        likes: randomInt(22, 55),
        comments: randomInt(8, 20),
        shares: randomInt(3, 10),
        hashtags: ["#ReactNative", "#Flutter", "#MobileDev"],
        createdAt: randomPastDate(4),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "duong.vo@chatwave.com")?._id,
        authorName: "Dương Võ",
        authorSubtitle: "Mobile Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "duong.vo@chatwave.com")?.avatar,
        text: "Mobile app UI design trends 2024 - rounded corners và glassmorphism đang lên ngôi! #MobileDesign #UIUX",
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        likes: randomInt(38, 95),
        comments: randomInt(10, 28),
        shares: randomInt(6, 15),
        hashtags: ["#MobileDesign", "#UIUX", "#AppDesign"],
        createdAt: randomPastDate(2),
      },
      // Post in a group
      {
        authorId: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?._id,
        authorName: "Minh Nguyễn",
        authorSubtitle: "Frontend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "minh.nguyen@chatwave.com")?.avatar,
        text: "Chia sẻ tài liệu học React mới nhất 2024 cho ae trong nhóm! #ReactJS #Learning #Resources",
        feeling: "📚 Học hỏi",
        likes: randomInt(30, 60),
        comments: randomInt(5, 15),
        shares: randomInt(2, 8),
        hashtags: ["#ReactJS", "#Learning", "#Resources"],
        groupId: allSeedGroups.find((g) => g.name === "React Developers Vietnam")?._id,
        createdAt: randomPastDate(2),
      },
      {
        authorId: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?._id,
        authorName: "Khoa Trần",
        authorSubtitle: "Backend Developer",
        authorAvatar: allSeedUsers.find((u) => u.email === "khoa.tran@chatwave.com")?.avatar,
        text: "Series bài viết về Docker cho người mới bắt đầu - Phần 1: Basic Commands #Docker #Tutorial #DevOps",
        imageUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80",
        likes: randomInt(25, 50),
        comments: randomInt(3, 10),
        shares: randomInt(1, 5),
        hashtags: ["#Docker", "#Tutorial", "#DevOps"],
        groupId: allSeedGroups.find((g) => g.name === "Backend Architects")?._id,
        createdAt: randomPastDate(1),
      },
    ].filter((post) => post.authorId);

    if (seedPosts.length > 0) {
      await Post.insertMany(seedPosts, { ordered: false });
      console.log(`Inserted ${seedPosts.length} seed posts`);
    }
  }

  // ========== DONE ==========
  console.log("\n✅ Done! Seed data added successfully.");
  console.log("\n📊 Summary:");
  console.log(`   - ${allSeedUsers.length} seed users`);
  console.log(`   - ${allSeedGroups.length} seed groups`);
  console.log("\n🔐 Test accounts (password: 123123):");
  console.log("   - minh.nguyen@chatwave.com");
  console.log("   - linh.pham@chatwave.com");
  console.log("   - khoa.tran@chatwave.com");
  console.log("   - huong.le@chatwave.com");
  console.log("   - duong.vo@chatwave.com");
  console.log("\n👥 Seed groups:");
  allSeedGroups.forEach((g) => {
    console.log(`   - ${g.name} (${g.members.length} members)`);
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
