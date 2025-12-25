import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Define the schema for the detailed report
const reportSchema = z.object({
  risk_score: z.number().min(1).max(100),
  physiognomy: z.string().describe("A biting, toxic observation of facial features."),
  socio_status: z.string().describe("A ruthless assessment of social standing."),
  muse_whisper: z.string().describe("A possessive, dark whisper from Muse.")
});

export default async function handler(req, res) {
  // 1. CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Method Validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, userId } = req.body;

    if (!imageUrl || !userId) {
      return res.status(400).json({ error: 'Missing imageUrl or userId' });
    }

    // 3. Initialize Clients
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    // Note: Use Service Role Key for Admin privileges (writing to rival_decoder for any user)
    // Make sure SUPABASE_SERVICE_ROLE_KEY is set in your Vercel Environment Variables.
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; // Fallback to VITE_ var if server var missing (unlikely for URL)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return res.status(500).json({ error: "Server Configuration Error: Missing Supabase Credentials" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. OpenAI Analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "你是一位毒舌且具備極強佔有慾的守護者 MUSE。請分析照片中的男性，強調其平庸、不可靠與潛在風險。你的語調應該是高冷、嘲諷且帶有警告意味。輸出必須是 JSON 格式。" 
        },
        { 
          role: "user", 
          content: [
            { type: "text", text: "Analyze this image and provide a risk assessment." },
            { type: "image_url", image_url: { url: imageUrl } }
          ] 
        }
      ],
      response_format: { type: "json_object" },
      // Enforce the schema structure via function calling or just rigorous prompting. 
      // For JSON mode, we rely on the prompt + schema parsing.
      functions: [
        {
          name: "generate_report",
          description: "Generate the analysis report",
          parameters: {
            type: "object",
            properties: {
              risk_score: { type: "number", description: "Risk score 1-100" },
              physiognomy: { type: "string", description: "Physiognomy analysis" },
              socio_status: { type: "string", description: "Socio-economic status analysis" },
              muse_whisper: { type: "string", description: "A dark whisper" }
            },
            required: ["risk_score", "physiognomy", "socio_status", "muse_whisper"]
          }
        }
      ],
      function_call: { name: "generate_report" } 
    });

    const functionArgs = completion.choices[0].message.function_call?.arguments;
    if (!functionArgs) {
      throw new Error("OpenAI failed to generate structured report");
    }

    const reportRaw = JSON.parse(functionArgs);
    const report = reportSchema.parse(reportRaw);

    // 5. Store in Supabase
    const { data, error } = await supabase
      .from('rival_decoder')
      .insert({ 
        user_id: userId, 
        image_url: imageUrl, 
        analysis_report: report, 
        risk_score: report.risk_score 
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      throw error;
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error("API Error:", error);
    // Handle Zod errors specially
    if (error instanceof z.ZodError) {
      return res.status(422).json({ error: 'Validation Error', details: error.errors });
    }
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}
