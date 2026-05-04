// updateUserNames.js - Update existing users with Vietnamese names
// Usage: node updateUserNames.js

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://21011596_db_user:hV8XCCI3iGsfRdUq@cluster0.yekmsao.mongodb.net";

const User = require("./src/models/User");

const nameUpdates = {
  "minh.nguyen@chatwave.com": "Nguyễn Minh",
  "linh.pham@chatwave.com": "Phạm Thị Linh",
  "khoa.tran@chatwave.com": "Trần Đức Khoa",
  "huong.le@chatwave.com": "Lê Hương",
  "duong.vo@chatwave.com": "Võ Minh Dương",
  "anh.nguyen@chatwave.com": "Nguyễn Hoàng Anh",
  "mai.phung@chatwave.com": "Phùng Thị Mai",
  "son.le@chatwave.com": "Lê Đình Sơn",
  "lan.nguyen@chatwave.com": "Nguyễn Thị Lan",
  "huy.pham@chatwave.com": "Phạm Quang Huy",
  "trang.tran@chatwave.com": "Trần Minh Trang",
  "bao.nguyen@chatwave.com": "Nguyễn Đức Bảo",
  "thu.hoang@chatwave.com": "Hoàng Thu",
  "nam.ho@chatwave.com": "Hồ Đức Nam",
  "phuong.le@chatwave.com": "Lê Thị Phương",
  "vinh.tran@chatwave.com": "Trần Ngọc Vinh",
  "ha.nguyen@chatwave.com": "Nguyễn Thảo Hà",
  "duclv@chatwave.com": "Lê Văn Đức",
  "tung.nguyen@chatwave.com": "Nguyễn Thế Tùng",
  "uyen.pham@chatwave.com": "Phạm Ngọc Uyên",
  "hieu.tran@chatwave.com": "Trần Thanh Hiếu",
  "nhi.le@chatwave.com": "Lê Khánh Nhi",
  "thanh.dang@chatwave.com": "Đặng Minh Thành",
  "uyen.nguyen@chatwave.com": "Nguyễn Ngọc Uyên",
  "quang.tran@chatwave.com": "Trần Đình Quang",
  "minhchi.ho@chatwave.com": "Hồ Minh Chí",
  "hanh.nguyen@chatwave.com": "Nguyễn Diễm Hạnh",
  "kiet.tran@chatwave.com": "Trần Gia Kiệt",
  "thuhien.nguyen@chatwave.com": "Nguyễn Thu Hiền",
  "phong.pham@chatwave.com": "Phạm Đức Phong",
  "thao.tran@chatwave.com": "Trần Minh Thảo",
  "hoang.nguyen@chatwave.com": "Nguyễn Gia Hoàng",
  "quynh.pham@chatwave.com": "Phạm Ngọc Quỳnh",
  "duynghia.le@chatwave.com": "Lê Duy Nghĩa",
  "thuy.tran@chatwave.com": "Trần Thị Thủy",
  "nhut.nguyen@chatwave.com": "Nguyễn Nhựt Tân",
  "hien.nguyen@chatwave.com": "Nguyễn Thu Hien",
  "lam.vo@chatwave.com": "Võ Đình Lâm",
  "huong.nguyen@chatwave.com": "Nguyễn Thị Hương",
  "phuc.tran@chatwave.com": "Trần Đình Phúc",
  "tram.le@chatwave.com": "Lê Thị Trâm",
  "viettuan.tran@chatwave.com": "Trần Việt Tuấn",
  "binh.nguyen@chatwave.com": "Nguyễn Hoàng Bình",
  "giang.tran@chatwave.com": "Trần Minh Giang",
  "thanhnam.pham@chatwave.com": "Phạm Thanh Nam",
  "my.nguyen@chatwave.com": "Nguyễn Thị Mỹ",
  "hung.tran@chatwave.com": "Trần Văn Hùng",
  "hong.nguyen@chatwave.com": "Nguyễn Thị Hồng",
  "son.nguyen@chatwave.com": "Nguyễn Văn Sơn",
  "khanh.tran@chatwave.com": "Trần Khánh",
  "ngan.le@chatwave.com": "Lê Thị Ngân",
  "viet.nguyen@chatwave.com": "Nguyễn Hoàng Việt",
  "diep.pham@chatwave.com": "Phạm Thị Diệp",
  "long.nguyen@chatwave.com": "Nguyễn Phúc Long",
  "vutran.nguyen@chatwave.com": "Nguyễn Vũ Trân",
  "haianh.nguyen@chatwave.com": "Nguyễn Hải Anh",
  "cuong.tran@chatwave.com": "Trần Đình Cường",
};

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("\nUpdating user names...\n");
  
  let updated = 0;
  
  for (const [email, newName] of Object.entries(nameUpdates)) {
    const user = await User.findOne({ email });
    if (user) {
      const oldName = user.username;
      user.username = newName;
      await user.save();
      console.log(`✓ ${oldName} → ${newName}`);
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} users!`);
  await mongoose.disconnect();
}

main().catch(console.error);
