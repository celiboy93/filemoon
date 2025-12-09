import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const fileCode = url.pathname.slice(1); // URL နောက်က Code ကိုယူမယ်

  if (!fileCode || fileCode === "favicon.ico") {
    return new Response("Usage: /FILEMOON_CODE");
  }

  try {
    // 1. Deno (US IP) နဲ့ FileMoon တံခါးကို သွားခေါက်မယ်
    const targetUrl = `https://filemoon.sx/e/${fileCode}`;
    const response = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://filemoon.sx/"
        }
    });
    
    // FileMoon က Deno ကို ပိတ်ထားရင် (403)
    if (response.status === 403) {
         return new Response("FileMoon blocked Deno IP (Cloudflare Protection)", { status: 403 });
    }

    const html = await response.text();

    // 2. ရိုးရိုး .m3u8 ရှာကြည့်မယ် (ကံကောင်းရင် တွေ့မယ်)
    let match = html.match(/file\s*:\s*"([^"]+\.m3u8[^"]*)"/);
    if (match && match[1]) {
        return Response.redirect(match[1], 302);
    }

    // 3. မတွေ့ရင် Packer (eval(function(p,a,c,k,e,d)...)) ကို ရှာမယ်
    const packerMatch = html.match(/(eval\(function\(p,a,c,k,e,d\).*?\.split\('\|'\)\)\))/);
    
    if (packerMatch && packerMatch[1]) {
        // Packer ကုဒ်ကို တွေ့ပြီ၊ ဖြည်ဖို့ ကြိုးစားမယ်
        const unpacked = unpack(packerMatch[1]);
        
        // ဖြည်ပြီးသားထဲက .m3u8 ကို ပြန်ရှာမယ်
        const m3u8Match = unpacked.match(/file\s*:\s*"([^"]+\.m3u8[^"]*)"/);
        
        if (m3u8Match && m3u8Match[1]) {
             // တွေ့ပြီ! User ကို Link အစစ်ဆီ ပို့မယ် (VPN မလိုတော့ဘူး)
             return Response.redirect(m3u8Match[1], 302);
        }
    }

    return new Response("Could not unpack or find link.", { status: 404 });

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
});

// --- Helper Function: P.A.C.K.E.R Unpacker ---
// Javascript ဝှက်စာတွေကို ဖြည်ပေးမယ့် Function
function unpack(packed) {
    try {
        // P.A.C.K.E.R format အမှန်ဟုတ်မဟုတ် စစ်မယ်
        if (!packed.startsWith("eval(function(p,a,c,k,e,d)")) return "";

        // ကွင်းစကွင်းပိတ်တွေကို ဖယ်ပြီး လိုအပ်တဲ့ variable တွေကို ခွဲထုတ်မယ်
        // (ဒါက ရိုးရှင်းတဲ့ unpacker logic ပါ)
        const params = packed.match(/}\('(.*)',\s*(\d+),\s*(\d+),\s*'(.*)'\.split\('\|'\)/);
        if (!params) return "";

        let payload = params[1];
        const radix = parseInt(params[2]);
        const count = parseInt(params[3]);
        const keywords = params[4].split('|');

        // Replace logic
        const decode = (str) => {
            return str.replace(/\b\w+\b/g, (word) => {
                let v = parseInt(word, radix);
                if(isNaN(v)) return word;
                return keywords[v] || word;
            });
        };
        
        // အကြမ်းဖျင်း ဖြည်လိုက်မယ် (Link ပေါ်လာအောင်)
        return decode(payload);
    } catch (e) {
        return "";
    }
}
