// updateTestUsers.js - Update test users with Vietnamese names
// Usage: node updateTestUsers.js

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const User = require("./src/models/User");

// Vietnamese first names and last names
const lastNames = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Trương", "Bùi", "Đặng",
  "Ngô", "Dương", "Đỗ", "Lương", "Hồ", "Đinh", "Thái", "Võ", "Vũ", "Trịnh"
];

const middleNames = [
  "Văn", "Thị", "Đức", "Minh", "Hoàng", "Gia", "Ngọc", "Thu", "Hải", "Thanh",
  "Phúc", "Khánh", "Hưng", "Tuấn", "Hữu", "Thế", "Bảo", "Quang", "Phong", "Long"
];

const firstNames = [
  // Male
  "Minh", "Anh", "Khoa", "Hùng", "Sơn", "Nam", "Bảo", "Phong", "Long", "Hiếu",
  "Thành", "Tùng", "Việt", "Cường", "Dũng", "Phúc", "Trung", "Đạt", "Lâm", "Quang",
  // Female
  "Linh", "Hương", "Mai", "Lan", "Trang", "Hà", "Nhi", "Thảo", "Huyền", "Thúy",
  "Quỳnh", "Hân", "Ngân", "Yến", "Phương", "Diễm", "Thanh", "Hạnh", "Kim", "Oanh"
];

function generateVietnameseName(index) {
  const lastName = lastNames[index % lastNames.length];
  const middleName = middleNames[(index * 3) % middleNames.length];
  const firstName = firstNames[(index * 7) % firstNames.length];
  return `${lastName} ${middleName} ${firstName}`;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  // Get all users with generic names
  const testUsers = await User.find({
    username: { $regex: /^User \d+$/ }
  }).sort({ email: 1 });

  console.log(`Found ${testUsers.length} test users to update...\n`);
  
  let updated = 0;
  
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const newName = generateVietnameseName(i);
    user.username = newName;
    await user.save();
    console.log(`✓ ${user.email} → ${newName}`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} users!`);
  await mongoose.disconnect();
}

main().catch(console.error);
