import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const fileCode = url.pathname.slice(1); // URL အနောက်က Code (yywjc8s95cfh)

  if (!fileCode || fileCode === "favicon.ico") {
    return new Response("Usage: https://your-app.deno.dev/FILEMOON_CODE");
  }

  try {
    // 1. Embed Page ကို လှမ်းဖတ်မယ် (Browser က ဝင်သလိုမျိုး)
    const targetUrl = `https://filemoon.sx/e/${fileCode}`;
    const response = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://filemoon.sx/"
        }
    });
    const html = await response.text();

    // 2. HTML ထဲက .m3u8 link ကို ရှာမယ်
    // FileMoon က Link ကို file:"..." ဆိုပြီး သိမ်းလေ့ရှိပါတယ်
    const regex = /file\s*:\s*"([^"]+\.m3u8[^"]*)"/;
    const match = html.match(regex);

    if (match && match[1]) {
      const m3u8Link = match[1];
      
      // 3. User ကို Link အစစ်ဆီ Redirect လုပ်ပေးမယ်
      return Response.redirect(m3u8Link, 302);
    }
    
    // ရှာမတွေ့ရင် (Packed Javascript နဲ့ ဝှက်ထားရင်)
    return new Response("Could not find m3u8 link. FileMoon might be using Packer protection.", { status: 404 });

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
});
