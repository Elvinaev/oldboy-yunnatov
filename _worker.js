export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };


    // OPTIONS / CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    // ПРОВЕРКА WORKER
    if (
      url.pathname === "/feedback" &&
      request.method === "GET"
    ) {

      return new Response(
        JSON.stringify({
          success: true,
          message: "Feedback server is working",
          telegram_token_configured: !!env.TELEGRAM_BOT_TOKEN,
test_variable_configured: !!env.TEST_VARIABLE
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );

    }


    // ПРИЁМ ОТЗЫВА
    if (
      url.pathname === "/feedback" &&
      request.method === "POST"
    ) {

      try {

        const data = await request.json();

        const rating = Number(data.rating);

        const comment = String(
          data.comment || ""
        ).trim();


        // Проверяем данные

        if (
          !rating ||
          rating < 1 ||
          rating > 3 ||
          !comment
        ) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Некорректные данные"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );

        }


        // Проверяем секрет

        if (!env.TELEGRAM_BOT_TOKEN) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "TELEGRAM_BOT_TOKEN не настроен в Cloudflare"
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );

        }


        // Сообщение для Telegram

        const message =
          `🚨 Новая обратная связь\n\n` +
          `OldBoy Юннатов\n` +
          `⭐ Оценка: ${rating}/5\n` +
          `💬 «${comment}»\n` +
          `🕐 ${new Date().toLocaleString("ru-RU", {
            timeZone: "Europe/Moscow"
          })}`;


        // Telegram API

        const telegramUrl =
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;


        const telegramResponse = await fetch(
          telegramUrl,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              chat_id: "2047866940",
              text: message
            })
          }
        );


        const telegramData =
          await telegramResponse.json();


        // ЕСЛИ TELEGRAM ОТКАЗАЛ

        if (
          !telegramResponse.ok ||
          !telegramData.ok
        ) {

          return new Response(
            JSON.stringify({
              success: false,
              error: telegramData.description || "Ошибка Telegram",
              telegram_error_code: telegramData.error_code || null
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );

        }


        // ВСЁ УСПЕШНО

        return new Response(
          JSON.stringify({
            success: true
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );


      } catch (error) {

        return new Response(
          JSON.stringify({
            success: false,
            error: error.message || "Server error"
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      }

    }


    // Остальное отдаём сайту

    return env.ASSETS.fetch(request);

  }
};
