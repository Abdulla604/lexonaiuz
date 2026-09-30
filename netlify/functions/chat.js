exports.handler = async function (event, context) {
  // CORS sarlavhalari (saytdan kelayotgan so'rovlarni bloklamaslik uchun)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Netlify'da GEMINI_API_KEY sozlanmagan!" }),
      };
    }

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Savol matni yuborilmadi." }),
      };
    }

    // Google Gemini API v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Siz Lexon AI yuridik va huquqiy yordamchisiz. Foydalanuvchining huquqiy savollariga aniq, ravon va tushunarli o'zbek tilida javob bering.\n\nSavol: ${message}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.error.message || "Gemini API xatoligi" }),
      };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Javob olishda xatolik yuz berdi.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server ichki xatoligi: " + error.message }),
    };
  }
};
