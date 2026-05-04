// Fix comments for existing posts
// Run: node fixComments.js

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const Post = require("./src/models/Post");

const sampleComments = [
  { author: "Minh Nguyễn", text: "Bài viết hay quá!", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh" },
  { author: "Linh Phạm", text: "Cảm ơn bạn đã chia sẻ", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=linh" },
  { author: "Khoa Trần", text: "Rất hữu ích!", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khoa" },
  { author: "Hường Lê", text: "Mình cũng đang quan tâm vấn đề này", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huong" },
  { author: "Dương Võ", text: "Đóng góp ý kiến hay", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=duong" },
  { author: "Minh Nguyễn", text: " Chia sẻ với mọi người nhé!", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh" },
  { author: "Linh Phạm", text: "Đúng là kiến thức bổ ích", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=linh" },
  { author: "Khoa Trần", text: "Bookmarked!", authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khoa" },
];

function getRandomComments(count) {
  const result = [];
  for (let i = 0; i < Math.min(count, 10); i++) {
    const cmt = sampleComments[Math.floor(Math.random() * sampleComments.length)];
    result.push({
      ...cmt,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 3), // Random time within 3 days
    });
  }
  return result;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("\nFinding posts with comments but empty commentList...");
  const posts = await Post.find({
    comments: { $gt: 0 },
    $or: [
      { commentList: { $size: 0 } },
      { commentList: { $exists: false } },
    ],
  });

  console.log(`Found ${posts.length} posts to fix`);

  for (const post of posts) {
    const commentCount = post.comments || 0;
    const newComments = getRandomComments(commentCount);
    
    post.commentList = newComments;
    await post.save();
    
    console.log(`Fixed post ${post._id}: added ${newComments.length} comments`);
  }

  console.log("\nDone!");
  await mongoose.disconnect();
}

main().catch(console.error);
