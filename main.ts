import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const fileCode = url.pathname.slice(1); // URL အနောက်က Code ကိုယူမယ်

  // Usage: https://your-app.deno.dev/FILE_CODE
  if (!fileCode || fileCode === "favicon.ico") {
    return new Response("Usage: /FILEMOON_CODE");
  }

  // 🔑 မိတ်ဆွေရဲ့ FileMoon API Key
  const apiKey = "90760ks37a05ztzm9dnyh"; 

  try {
    // 1. FileMoon API ကို လှမ်းမေးမယ်
    const apiUrl = `https://filemoon.sx/api/file/info?key=${apiKey}&file_code=${fileCode}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    // 2. API က အောင်မြင်ကြောင်း ပြန်ပြောရင်
    if (data.status === 200 && data.result && data.result[0]) {
        const fileData = data.result[0];
        
        // 🔥 အရေးကြီးဆုံးအပိုင်း 🔥
        // API ထဲမှာ Direct Link ပါမပါ ရှာမယ်
        // (Account ပေါ်မူတည်ပြီး 'direct_link', 'download_url', 'hls' အမျိုးမျိုး ရှိတတ်ပါတယ်)
        
        // HLS (m3u8) ကို ဦးစားပေးရှာမယ်
        let targetUrl = fileData.hls || fileData.direct_link || fileData.download_url;

        // API က Link မပေးရင် Embed Page ကို Scrape လုပ်ဖို့ ကြိုးစားမယ် (Plan B)
        if (!targetUrl) {
           // Embed Link ရှိရင် အဲ့ဒါကို သွားဖတ်မယ်
           const embedRes = await fetch(`https://filemoon.sx/e/${fileCode}`);
           const embedHtml = await embedRes.text();
           // HTML ထဲက .m3u8 ကို ရှာမယ်
           const match = embedHtml.match(/file\s*:\s*"([^"]+\.m3u8[^"]*)"/);
           if (match) targetUrl = match[1];
        }

        // 3. Link ရပြီဆိုရင် User ကို Redirect လုပ်ပေးမယ်
        if (targetUrl) {
            return Response.redirect(targetUrl, 302);
        }
    }

    return new Response("Direct Link not found (Check API Key or Account Type)", { status: 404 });

  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
});
