import { v2 as cloudinary } from "cloudinary";

export default async function handler(req, res) {
  // 檢查必要的 Cloudinary 認證是否存在（CLOUDINARY_URL 或三變數）
  const hasUrl = !!process.env.CLOUDINARY_URL;
  const hasTriple = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  if (!hasUrl && !hasTriple) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Cloudinary credentials',
      hint: '請在 Vercel 設定 CLOUDINARY_URL 或 CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET 後重新部署'
    });
  }

  // 初始化（若設了 CLOUDINARY_URL，SDK 會自動讀；此處仍保留 secure 與三變數回填）
  cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || undefined,
    api_key: process.env.CLOUDINARY_API_KEY || undefined,
    api_secret: process.env.CLOUDINARY_API_SECRET || undefined,
  });

  try {
    // 簡化為 server-side 簽名上傳，不依賴 upload_preset，降低誤設風險
    const r = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "raw" }
    );
    return res.status(200).json({ ok: true, url: r.secure_url, public_id: r.public_id });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e),
      hint: '若仍失敗，請確認 CLOUDINARY_* 變數與雲端權限、來源 URL/FETCH 設定'
    });
  }
}
