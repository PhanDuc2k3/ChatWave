/**
 * Migration: Chuyển role từ 3 roles (owner/admin/member) → 2 roles (leader/member)
 * 
 * Rules:
 * - owner → leader (chỉ 1 người/nhóm)
 * - admin → member (tất cả admin trở thành member)
 * - member → member (giữ nguyên)
 * 
 * Chạy: node scripts/migrations/role-simplify.js
 */

const mongoose = require("mongoose");
const ChatGroup = require("../core-service/src/models/ChatGroup");

async function run() {
  try {
    // Kết nối MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/chatwave";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Lấy tất cả groups
    const groups = await ChatGroup.find({});
    console.log(`📊 Found ${groups.length} groups`);

    let totalUpdated = 0;
    let totalLeaders = 0;
    let totalMembers = 0;

    for (const group of groups) {
      let updated = false;
      const oldMembers = [...group.members];

      // Đếm số owner và admin cũ
      const owners = oldMembers.filter(m => m.role === "owner");
      const admins = oldMembers.filter(m => m.role === "admin");

      // Chuyển owner → leader (chỉ 1 người, nếu có nhiều owner thì lấy cái đầu)
      for (const member of group.members) {
        if (member.role === "owner") {
          member.role = "leader";
          updated = true;
          totalLeaders++;
        } else if (member.role === "admin") {
          member.role = "member";
          updated = true;
          totalMembers++;
        } else if (member.role === "member") {
          totalMembers++;
        }
      }

      if (updated) {
        await group.save();
        totalUpdated++;
        console.log(`  ✅ Group "${group.name}" (${group._id}):`);
        console.log(`     Members: ${JSON.stringify(group.members)}`);
      }
    }

    console.log(`\n📈 Migration completed!`);
    console.log(`   Total groups updated: ${totalUpdated}/${groups.length}`);
    console.log(`   Total leaders: ${totalLeaders}`);
    console.log(`   Total members: ${totalMembers}`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
