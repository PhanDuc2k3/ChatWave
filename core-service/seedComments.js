// seedComments.js - Add real comments to posts based on their comment count
// Usage: node seedComments.js
// Does NOT delete existing data - only adds/updates comments

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const Post = require("./src/models/Post");
const User = require("./src/models/User");

// Sample comment templates by topic
const commentTemplates = {
  general: [
    "Bài viết rất hay và bổ ích!",
    "Cảm ơn bạn đã chia sẻ nhé!",
    "Đây là kiến thức mình đang tìm kiếm!",
    "Bookmark để đọc lại sau!",
    "Chia sẻ cho mọi người cùng biết nào!",
    "Bài viết chất lượng quá!",
    "Mình đã học được nhiều từ bài này!",
    "Thông tin rất hữu ích!",
    "Keep up the good work!",
    "Đúng thứ mình cần!",
  ],
  tech: [
    "Code clean quá!",
    "Giải thích dễ hiểu quá!",
    "Có demo không bạn ơi?",
    "Mình sẽ thử ngay!",
    "Tip hay quá!",
    "Mình gặp vấn đề tương tự!",
    "Giải pháp này perfect!",
    "Bạn có thể giải thích thêm không?",
    "Thanks for sharing!",
    "Đã implement thành công!",
  ],
  design: [
    "Design đẹp quá!",
    "Màu sắc hài hòa!",
    "Inspiration tuyệt vời!",
    "UI/UX rất user-friendly!",
    "Typography đẹp!",
    "Mình có thể học hỏi được nhiều!",
    "Concept này rất sáng tạo!",
    "Clean design!",
    "Dễ thương quá!",
    "Mình cũng thích style này!",
  ],
  learning: [
    "Mình mới học, bài này giúp ích nhiều!",
    "Có khóa học nào liên quan không?",
    "Tài liệu tham khảo ở đâu vậy?",
    "Mình muốn học theo!",
    "Bạn học ở đâu vậy?",
    "Series này rất chất lượng!",
    "Phần tiếp theo khi nào?",
    "Nguồn tham khảo hay!",
    "Mình đã áp dụng thành công!",
    "Beginner-friendly quá!",
  ],
  question: [
    "Bạn ơi, cho mình hỏi...",
    "Mình thắc mắc chỗ này...",
    "Có cách nào khác không?",
    "Mình gặp lỗi này, giúp mình với!",
    "Tại sao lại làm vậy bạn?",
    "Có best practice nào không?",
    "Performance ra sao vậy?",
    "So sánh với cách khác thì sao?",
    "Có video hướng dẫn không?",
    "Source code ở đâu vậy?",
  ],
  agreement: [
    "Đồng ý với bạn!",
    "Chính xác như bạn nói!",
    "100% agree!",
    "Mình cũng nghĩ vậy!",
    "Đúng là như vậy!",
    "Hoàn toàn đồng ý!",
    "Điều này rất đúng!",
    "Mình đã trải nghiệm giống bạn!",
    "Đây là sự thật!",
    "Perfect!",
  ],
  appreciation: [
    "Tuyệt vời!",
    "Awesome!",
    "Great job!",
    "Siêu hay!",
    "Wow!",
    "Amazing!",
    "Chất lượng!",
    "Pro quá!",
    "Đỉnh của chóp!",
    "Best post ever!",
  ],
};

const commentTypes = Object.keys(commentTemplates);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPastDate(daysBack = 7) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

function generateComment(author) {
  const type = randomElement(commentTypes);
  const text = randomElement(commentTemplates[type]);
  
  return {
    author: author.username,
    authorAvatar: author.avatar,
    text: text,
    createdAt: randomPastDate(7),
  };
}

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  console.log("\n[1/2] Getting all users...");
  const users = await User.find({}).lean();
  
  if (users.length === 0) {
    console.log("ERROR: No users found! Run seed.js first.");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Found ${users.length} users`);

  console.log("\n[2/2] Finding posts with comment counts > 0...");
  const posts = await Post.find({
    comments: { $gt: 0 }
  }).lean();

  console.log(`Found ${posts.length} posts with comments`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    const commentCount = post.comments || 0;
    const existingCount = post.commentList?.length || 0;
    
    // Skip if commentList already has the correct number of comments
    if (existingCount === commentCount) {
      skippedCount++;
      continue;
    }

    // Generate comments to match the count
    const newComments = [];
    for (let i = 0; i < commentCount; i++) {
      const author = randomElement(users);
      newComments.push(generateComment(author));
    }

    // Sort by date (oldest first)
    newComments.sort((a, b) => a.createdAt - b.createdAt);

    // Update the post
    await Post.updateOne(
      { _id: post._id },
      { $set: { commentList: newComments } }
    );

    updatedCount++;
    console.log(`Updated post ${post._id}: ${commentCount} comments (was ${existingCount})`);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Done!`);
  console.log(`   - Posts updated: ${updatedCount}`);
  console.log(`   - Posts skipped (already correct): ${skippedCount}`);
  console.log("=".repeat(50));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
