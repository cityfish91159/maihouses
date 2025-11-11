import { v2 as cloudinary } from "cloudinary";

export default async function handler(req, res) {
  cloudinary.config({ secure: true }); // 讀 Vercel 的 CLOUDINARY_URL 或三個變數
  try {
    const r = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "raw", upload_preset: "server_signed" }
    );
    res.status(200).json({ ok: true, url: r.secure_url, public_id: r.public_id });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
