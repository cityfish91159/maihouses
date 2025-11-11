// 使用 Web API 風格 + 強制 Node.js Runtime，以便於載入 Cloudinary Node SDK
export const config = {
  runtime: "nodejs20.x",
};

export default async function handler(request) {
  try {
    const { v2: cloudinary } = await import("cloudinary");

    function setupCloudinary() {
      const hasUrl = !!process.env.CLOUDINARY_URL;
      const name = process.env.CLOUDINARY_CLOUD_NAME;
      const key = process.env.CLOUDINARY_API_KEY;
      const secret = process.env.CLOUDINARY_API_SECRET;

      if (hasUrl) {
        cloudinary.config({ secure: true });
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
    const cfg = cloudinary.config();

    const url = new URL(request.url);
    const ping = url.searchParams.get("ping");
    if (ping === "1") {
      return new Response(JSON.stringify({ ok: true, mode: "ping", cloud_name: cfg.cloud_name }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    }

    const r = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "raw", upload_preset: "server_signed" }
    );
    return new Response(
      JSON.stringify({ ok: true, url: r.secure_url, public_id: r.public_id, cloud_name: cfg.cloud_name }),
      { headers: { "content-type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(e && e.stack ? e.stack : e && e.message ? e.message : e),
        have: {
          CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
          CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
        },
      }),
      { headers: { "content-type": "application/json" }, status: 500 }
    );
  }
}
