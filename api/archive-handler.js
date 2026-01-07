import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Secure this endpoint (e.g., check for a secret token from Cron)
  const authHeader = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase.rpc("archive_old_history");

    if (error) throw error;

    return res.status(200).json({
      success: true,
      archived_count: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Archive Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
