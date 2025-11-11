// CommonJS 版：符合 Vercel 通用 Serverless (非 Next.js pages router)
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

module.exports = async (req, res) => {
  try {
    setupCloudinary();
    const cfg = cloudinary.config(); // 不含 secret
    const r = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "raw", upload_preset: "server_signed" }
    );
    res.status(200).json({ ok: true, url: r.secure_url, public_id: r.public_id, cloud_name: cfg.cloud_name });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e.message || e),
      have: {
        CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      },
    });
  }
};
