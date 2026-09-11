export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Проверяем endpoint
    if (url.pathname === "/feedback" && request.method === "POST") {
      try {
        const data = await request.json();

        const rating = Number(data.rating);
        const comment = String(data.comment || "").trim();

        // Принимаем только оценки 1–3
        if (!rating || rating < 1 || rating > 3 || !comment) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Некорректные данные",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Формируем сообщение
        const message =
          `🚨 Новая обратная связь\n\n` +
          `OldBoy Юннатов\n` +
          `⭐ Оценка: ${rating}/5\n` +
          `💬 «${comment}»\n` +
          `🕐 ${new Date().toLocaleString("ru-RU", {
            timeZone: "Europe/Moscow",
          })}`;

        // Проверяем наличие токена
        if (!env.TELEGRAM_BOT_TOKEN) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "TELEGRAM_BOT_TOKEN не настроен",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Отправляем в Telegram
        const telegramUrl =
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

        const telegramResponse = await fetch(telegramUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: "2047866940",
            text: message,
          }),
        });

        const telegramData = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Telegram error",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Server error",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  },
};
