// CommonJS 版：符合 Vercel 通用 Serverless (非 Next.js pages router)
module.exports = async (req, res) => {
  try {
    // 延後載入，避免頂層 require 失敗導致 500 無法回傳診斷
    const cloudinary = require("cloudinary").v2;

    function setupCloudinary() {
      const hasUrl = !!process.env.CLOUDINARY_URL;
      const name = process.env.CLOUDINARY_CLOUD_NAME;
      const key = process.env.CLOUDINARY_API_KEY;
      const secret = process.env.CLOUDINARY_API_SECRET;

      if (hasUrl) {
        cloudinary.config({ secure: true }); // 直接讀 CLOUDINARY_URL
      } else if (name && key && secret) {
        cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });
      } else {
        const miss = [];
        if (!hasUrl) {
          if (!name) miss.push("CLOUDINARY_CLOUD_NAME");
          if (!key) miss.push("CLOUDINARY_API_KEY");
          if (!secret) miss.push("CLOUDINARY_API_SECRET");
        }
        throw new Error("Missing Cloudinary env: " + miss.join(", "));
      }
    }

    setupCloudinary();
    const cfg = require("cloudinary").v2.config(); // 不含 secret

    // 輕量健康檢查：若 query 帶 ?ping=1 則不進行上傳，只回傳環境狀態
    if (req.query && (req.query.ping === "1" || req.query.ping === 1)) {
      return res.status(200).json({ ok: true, mode: "ping", cloud_name: cfg.cloud_name });
    }

    // 預設執行範例上傳
    const r = await require("cloudinary").v2.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "raw", upload_preset: "server_signed" }
    );
    res.status(200).json({ ok: true, url: r.secure_url, public_id: r.public_id, cloud_name: cfg.cloud_name });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e && e.stack ? e.stack : e && e.message ? e.message : e),
      have: {
        CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      },
    });
  }
};

// 強制使用 Node.js Serverless Runtime（避免在 Edge 環境中無法使用 require/res）
module.exports.config = {
  runtime: "nodejs20.x",
};
