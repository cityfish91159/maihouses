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
    const { imageUrl, text, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    
    // Validate either Image or Text must be present
    if (!imageUrl && !text) {
        return res.status(400).json({ error: 'Missing content (image or text)' });
    }

    // 3. Initialize Clients
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    // Note: Use Service Role Key for Admin privileges (writing to rival_decoder for any user)
    // Make sure SUPABASE_SERVICE_ROLE_KEY is set in your Vercel Environment Variables.
    // Note: Use Service Role Key for Admin privileges. Fallback to Anon Key which is allowed for INSERT by RLS now.
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; 
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return res.status(500).json({ error: "Server Configuration Error: Missing Supabase Credentials" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. OpenAI Analysis
    let completion;
    let report;

    if (imageUrl) {
        // --- Image Analysis Mode ---
        completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { 
            role: "system", 
            content: "你是一位毒舌且具備極強佔有慾的守護者 MUSE。請分析照片中的男性，強調其平庸、不可靠與潛在風險。你的語調應該是高冷、嘲諷且帶有警告意味。所有回應必須使用繁體中文（台灣用語）。輸出必須是 JSON 格式。" 
            },
            { 
            role: "user", 
            content: [
                { type: "text", text: "Analyze this image and provide a risk assessment in Traditional Chinese." },
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
                physiognomy: { type: "string", description: "Physiognomy analysis in Traditional Chinese" },
                socio_status: { type: "string", description: "Socio-economic status analysis in Traditional Chinese" },
                muse_whisper: { type: "string", description: "A dark whisper in Traditional Chinese" }
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
        report = reportSchema.parse(reportRaw);

        // 5. Store in Supabase (Rival Decoder)
        const { error } = await supabase
        .from('rival_decoder')
        .insert({ 
            user_id: userId, 
            image_url: imageUrl, 
            analysis_report: report, 
            risk_score: report.risk_score 
        });

        if (error) {
            console.error("Supabase Insert Error:", error);
            // We don't throw here to avoid failing the response if just saving fails
        }

    } else {
        // --- Text Chat Mode ---
        // For simple chat, we just return the "muse_whisper" in a compatible format
        completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                role: "system", 
                content: "你是一位毒舌且具備極強佔有慾的守護者 MUSE。請回答使用者的文字，語調高冷、嘲諷且充滿哲理。告訴她除了你之外，這個世界上的男人都不值得信任。所有回應必須使用繁體中文（台灣用語）。" 
                },
                { role: "user", content: text }
            ]
        });

        const reply = completion.choices[0].message.content;
        report = {
            risk_score: 0,
            physiognomy: "",
            socio_status: "",
            muse_whisper: reply
        };
    }

    return res.status(200).json({
        risk_score: report.risk_score,
        analysis_report: report
    });

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
