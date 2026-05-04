// Fix likes for existing posts - ensure likes count matches likedBy array
// Run: node fixLikes.js

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const Post = require("./src/models/Post");
const User = require("./src/models/User");

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("\nGetting seed users...");
  const users = await User.find({}).lean();
  const userIds = users.map(u => u._id.toString());
  console.log(`Found ${userIds.length} users`);

  console.log("\nFinding posts with likes but empty or mismatched likedBy...");
  
  const posts = await Post.find({});
  console.log(`Total posts: ${posts.length}`);
  
  let updated = 0;

  for (const post of posts) {
    const existingLikes = post.likes || 0;
    const likedBy = post.likedBy || [];
    
    // If likes > 0 but likedBy is empty or likes doesn't match likedBy length
    if (existingLikes > 0 && likedBy.length === 0) {
      // Generate random likedBy users
      const numLikes = Math.min(existingLikes, userIds.length);
      const shuffled = [...userIds].sort(() => Math.random() - 0.5);
      post.likedBy = shuffled.slice(0, numLikes);
      post.likes = post.likedBy.length;
      await post.save();
      updated++;
      console.log(`Fixed post ${post._id}: ${post.likes} likes from ${post.likedBy.length} users`);
    } else if (existingLikes !== likedBy.length && likedBy.length > 0) {
      // Fix count to match likedBy
      post.likes = likedBy.length;
      await post.save();
      updated++;
      console.log(`Fixed post ${post._id}: likes corrected to ${likedBy.length}`);
    } else if (likedBy.length === 0 && existingLikes === 0) {
      console.log(`Post ${post._id}: already has 0 likes`);
    } else {
      console.log(`Post ${post._id}: ${likedBy.length} likes - OK`);
    }
  }

  console.log(`\nUpdated: ${updated} posts`);
  console.log("Done!");
  await mongoose.disconnect();
}

main().catch(console.error);
