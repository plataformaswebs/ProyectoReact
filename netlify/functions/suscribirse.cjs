const axios = require("axios");
const AWS = require("aws-sdk");

// 🧩 Inicializa S3
const s3 = new AWS.S3({
    region: process.env.MY_AWS_REGION || "us-east-2",
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
});

exports.handler = async (event) => {
    // 🌍 CORS
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:8888",
        "https://plataformas-web.cl",
        "https://www.plataformas-web.cl",
    ];
    const origin = event.headers.origin || "";
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    const corsHeaders = {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
    };
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders, body: "" };

    try {
        const { nombre, email, sitioWeb, idCliente, clienteInternacional } = JSON.parse(event.body || "{}");

        if (!nombre || !email || !idCliente) {
            throw new Error("Faltan parámetros requeridos (nombre, email, idCliente)");
        }

        const esInternacional =
            clienteInternacional === 1 ||
            clienteInternacional === "1" ||
            clienteInternacional === true ||
            String(clienteInternacional).toLowerCase() === "true";

        const isLocal = origin.startsWith("http://localhost");

        // 🔑 PayPal: selecciona sandbox o prod
        const PAYPAL_CLIENT_ID = isLocal ? process.env.PAYPAL_CLIENT_ID_SANDBOX : process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_SECRET = isLocal ? process.env.PAYPAL_SECRET_SANDBOX : process.env.PAYPAL_SECRET;
        const PAYPAL_PLAN_ID = isLocal ? process.env.PAYPAL_PLAN_ID_SANDBOX : process.env.PAYPAL_PLAN_ID;
        const PAYPAL_API_URL = isLocal ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

        const hasCredentials =
            (process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID) &&
            (process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY);

        if (esInternacional) {
            console.log(`🌎 Cliente internacional → flujo PayPal (${isLocal ? "sandbox" : "producción"})`);

            if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET || !PAYPAL_PLAN_ID) {
                const dummyLink = "https://www.paypal.com/dummy-link-para-dev";
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        tipo: "paypal",
                        clienteInternacional: 1,
                        approvalUrl: dummyLink,
                    }),
                };
            }

            // ⚡ Flujo real PayPal
            const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
            const tokenResponse = await axios.post(
                `${PAYPAL_API_URL}/v1/oauth2/token`,
                "grant_type=client_credentials",
                { headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" } }
            );

            const accessToken = tokenResponse.data.access_token;
            if (!accessToken) throw new Error("No se obtuvo access token de PayPal");

            const subscriptionResponse = await axios.post(
                `${PAYPAL_API_URL}/v1/billing/subscriptions`,
                {
                    plan_id: PAYPAL_PLAN_ID,
                    subscriber: { name: { given_name: nombre }, email_address: email },
                    application_context: {
                        brand_name: "Plataformas Web",
                        locale: "es-CL",
                        user_action: "SUBSCRIBE_NOW",
                        return_url: "https://plataformas-web.cl/paypal-exito",
                        cancel_url: "https://plataformas-web.cl/paypal-cancelado",
                    },
                },
                { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
            );

            const approvalLink = subscriptionResponse.data.links?.find(l => l.rel === "approve")?.href;
            if (!approvalLink) throw new Error("No se pudo obtener el link de aprobación de PayPal");

            // 💾 Guardar suscripción PayPal en S3
            if (hasCredentials) {
                try {
                    const subscriptionId = subscriptionResponse.data.id;
                    await s3.putObject({
                        Bucket: "plataformas-web-buckets",
                        Key: `paypal_subscriptions/${subscriptionId}.json`,
                        Body: JSON.stringify({
                            idCliente,
                            nombre,
                            email,
                            sitioWeb,
                            entorno: isLocal ? "SANDBOX" : "PRODUCCION",
                            planId: PAYPAL_PLAN_ID,
                            subscriptionId,
                            approvalUrl: approvalLink,
                            creado: new Date().toISOString(),
                        }),
                        ContentType: "application/json",
                    }).promise();
                    console.log(`✅ Suscripción PayPal guardada en S3: ${subscriptionResponse.data.id}`);
                } catch (s3Err) {
                    console.warn("⚠️ No se pudo guardar la suscripción PayPal en S3:", s3Err.message);
                }
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    tipo: "paypal",
                    clienteInternacional: 1,
                    approvalUrl: approvalLink,
                }),
            };
        }

        // ===============================
        // 🇨🇱 FLUJO TRANSBANK
        // ===============================
        const hasProdKeys =
            process.env.TBK_OCM_API_KEY_ID?.startsWith("5970") &&
            process.env.TBK_OCM_API_KEY_SECRET?.length > 10;

        const environment = hasProdKeys ? "PRODUCCION" : "INTEGRACION";
        const cameFromLocal = origin.startsWith("http://localhost");
        const inscriptionUrl = hasProdKeys
            ? "https://webpay3g.transbank.cl/rswebpaytransaction/api/oneclick/v1.0/inscriptions"
            : "https://webpay3gint.transbank.cl/rswebpaytransaction/api/oneclick/v1.0/inscriptions";

        const headers = hasProdKeys
            ? {
                "Tbk-Api-Key-Id": process.env.TBK_OCM_API_KEY_ID,
                "Tbk-Api-Key-Secret": process.env.TBK_OCM_API_KEY_SECRET,
                "Content-Type": "application/json",
            }
            : {
                "Tbk-Api-Key-Id": "597055555541",
                "Tbk-Api-Key-Secret": "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C",
                "Content-Type": "application/json",
            };

        const returnBase = cameFromLocal ? "http://localhost:8888" : "https://plataformas-web.cl";
        const returnUrl = `${returnBase}/.netlify/functions/confirmarSuscripcion`;

        const response = await axios.post(
            inscriptionUrl,
            { username: email, email, response_url: returnUrl },
            { headers }
        );

        const token = response.data.token;
        const url_webpay = response.data.url_webpay || response.data.url;
        if (!token || !url_webpay) throw new Error("Respuesta incompleta desde Transbank");

        // 💾 Guardar token Webpay en S3
        if (hasCredentials) {
            try {
                await s3.putObject({
                    Bucket: "plataformas-web-buckets",
                    Key: `tokens/${token}.json`,
                    Body: JSON.stringify({ idCliente, nombre, email, sitioWeb, entorno: environment, cameFromLocal, creado: new Date().toISOString() }),
                    ContentType: "application/json",
                }).promise();
            } catch (s3Err) {
                console.warn("⚠️ No se pudo guardar en S3:", s3Err.message);
            }
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                tipo: "webpay",
                clienteInternacional: 0,
                token,
                url: url_webpay,
            }),
        };
    } catch (err) {
        console.error("❌ [suscribirse] Error:", err.response?.data || err.message || err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error_message: err.response?.data?.error_message || err.message }),
        };
    }
};