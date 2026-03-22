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
        const {
            nombre,
            email,
            sitioWeb,
            idCliente,
            clienteInternacional,
            paypalPlanMode,
            esClientePaypalPrueba,
        } = JSON.parse(event.body || "{}");

        console.log("[suscribirse] clienteInternacional raw:", clienteInternacional);

        if (!nombre || !email || !idCliente) {
            throw new Error("Faltan parámetros requeridos (nombre, email, idCliente)");
        }

        const esInternacional =
            clienteInternacional === 1 ||
            clienteInternacional === "1" ||
            clienteInternacional === true ||
            String(clienteInternacional).toLowerCase() === "true";

        const usarPlanPaypalTest =
            paypalPlanMode === "test" ||
            esClientePaypalPrueba === true ||
            esClientePaypalPrueba === 1 ||
            esClientePaypalPrueba === "1" ||
            String(esClientePaypalPrueba).toLowerCase() === "true";

        console.log("[suscribirse] esInternacional:", esInternacional);
        console.log("[suscribirse] nombre/email/idCliente:", nombre, email, idCliente);
        console.log("[suscribirse] paypalPlanMode:", paypalPlanMode, "| usarPlanPaypalTest:", usarPlanPaypalTest);

        const isLocal = origin.startsWith("http://localhost");

        // 🔑 PayPal: selecciona sandbox o prod
        const PAYPAL_CLIENT_ID = isLocal ? process.env.PAYPAL_CLIENT_ID_SANDBOX : process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_SECRET = isLocal ? process.env.PAYPAL_SECRET_SANDBOX : process.env.PAYPAL_SECRET;
        const PAYPAL_PLAN_ID_STANDARD = isLocal ? process.env.PAYPAL_PLAN_ID_SANDBOX : process.env.PAYPAL_PLAN_ID;
        const PAYPAL_PLAN_ID_TEST = isLocal
            ? (process.env.PAYPAL_PLAN_ID_TEST_SANDBOX || process.env.PAYPAL_PLAN_ID_TEST)
            : process.env.PAYPAL_PLAN_ID_TEST;
        const PAYPAL_PLAN_ID =
            usarPlanPaypalTest && PAYPAL_PLAN_ID_TEST
                ? PAYPAL_PLAN_ID_TEST
                : PAYPAL_PLAN_ID_STANDARD;
        const PAYPAL_API_URL = isLocal ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

        console.log("[suscribirse] PayPal env summary:", {
            isLocal,
            hasClientId: Boolean(PAYPAL_CLIENT_ID),
            hasSecret: Boolean(PAYPAL_SECRET),
            hasStandardPlan: Boolean(PAYPAL_PLAN_ID_STANDARD),
            hasTestPlan: Boolean(PAYPAL_PLAN_ID_TEST),
            selectedPlanMode: usarPlanPaypalTest ? "test" : "standard",
            selectedPlanId: PAYPAL_PLAN_ID,
        });

        const hasCredentials =
            (process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID) &&
            (process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY);

        if (esInternacional) {
            console.log(`Cliente internacional -> flujo PayPal (${isLocal ? "sandbox" : "produccion"})`);

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
            console.log("[suscribirse] PayPal token app_id:", tokenResponse.data.app_id);

            console.log(
                "[suscribirse] PayPal plan_id:",
                PAYPAL_PLAN_ID,
                "env:",
                isLocal ? "SANDBOX" : "PROD",
                "mode:",
                usarPlanPaypalTest ? "TEST" : "STANDARD"
            );

            try {
                const planCheck = await axios.get(
                    `${PAYPAL_API_URL}/v1/billing/plans/${PAYPAL_PLAN_ID}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                console.log("[suscribirse] PayPal plan verification:", {
                    id: planCheck.data?.id,
                    status: planCheck.data?.status,
                    product_id: planCheck.data?.product_id,
                });
            } catch (planErr) {
                console.error("[suscribirse] PayPal plan verification failed:", {
                    status: planErr.response?.status,
                    data: planErr.response?.data,
                    selectedPlanId: PAYPAL_PLAN_ID,
                    selectedPlanMode: usarPlanPaypalTest ? "test" : "standard",
                });
                throw planErr;
            }

            let subscriptionResponse;
            try {
                subscriptionResponse = await axios.post(
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
            } catch (paypalErr) {
                console.error("[suscribirse] PayPal subscription creation failed:", {
                    status: paypalErr.response?.status,
                    data: paypalErr.response?.data,
                    selectedPlanId: PAYPAL_PLAN_ID,
                    selectedPlanMode: usarPlanPaypalTest ? "test" : "standard",
                    apiUrl: PAYPAL_API_URL,
                    idCliente,
                });
                throw paypalErr;
            }

            console.log("[suscribirse] PayPal subscription status/id:", subscriptionResponse.data.status, subscriptionResponse.data.id);
            console.log("[suscribirse] PayPal links rels:", (subscriptionResponse.data.links || []).map(l => l.rel));
            const approvalLink = subscriptionResponse.data.links?.find(l => l.rel === "approve")?.href;
            if (!approvalLink) throw new Error("No se pudo obtener el link de aprobaciÃ³n de PayPal");

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
                            paypalPlanMode: usarPlanPaypalTest ? "test" : "standard",
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

        // ðŸ’¾ Guardar token Webpay en S3
        if (hasCredentials) {
            try {
                await s3.putObject({
                    Bucket: "plataformas-web-buckets",
                    Key: `tokens/${token}.json`,
                    Body: JSON.stringify({ idCliente, nombre, email, sitioWeb, entorno: environment, cameFromLocal, creado: new Date().toISOString() }),
                    ContentType: "application/json",
                }).promise();
            } catch (s3Err) {
                console.warn("âš ï¸ No se pudo guardar en S3:", s3Err.message);
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
        console.error("[suscribirse] Error:", err.response?.data || err.message || err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error_message: err.response?.data?.error_message || err.message }),
        };
    }
};
