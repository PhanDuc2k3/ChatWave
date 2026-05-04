// Fix hashtags - ensure posts have hashtags extracted from text
// Run: node fixHashtags.js

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const Post = require("./src/models/Post");

function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[^\s#]+/g) || [];
  return [...new Set(matches.map(tag => tag.toLowerCase()))];
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("\nChecking posts for hashtags...");
  
  const posts = await Post.find({});
  console.log(`Total posts: ${posts.length}`);
  
  let updated = 0;

  for (const post of posts) {
    const textHashtags = extractHashtags(post.text);
    const existingHashtags = post.hashtags || [];
    
    // Merge: keep existing + add from text
    const merged = [...new Set([...existingHashtags.map(h => h.toLowerCase()), ...textHashtags])];
    
    if (merged.length > 0 && JSON.stringify(existingHashtags.map(h => h.toLowerCase()).sort()) !== JSON.stringify(merged.sort())) {
      post.hashtags = merged;
      await post.save();
      updated++;
      console.log(`Updated post ${post._id}: [${merged.join(", ")}]`);
    }
  }

  console.log(`\nUpdated: ${updated} posts`);
  console.log("Done!");
  await mongoose.disconnect();
}

main().catch(console.error);
