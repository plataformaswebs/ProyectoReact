const axios = require("axios");
const querystring = require("querystring");
const AWS = require("aws-sdk");

// 🧩 Inicializa S3
const s3 = new AWS.S3({
    region: process.env.MY_AWS_REGION || "us-east-2", // Usa MY_AWS_REGION
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,    // Usa MY_AWS_ACCESS_KEY_ID
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY, // Usa MY_AWS_SECRET_ACCESS_KEY
});

// Debes asegurarte de que el handler sea una función async
exports.handler = async (event) => {
    console.log("🛰️ [confirmarSuscripcion] Nueva solicitud:", event.httpMethod);

    let existingData = null;
    let entorno_tbk = "INTEGRACION"; // Valor por defecto

    try {
        // 1️⃣ OBTENER TOKEN TBK
        const qs = event.queryStringParameters || {};
        let token =
            qs.TBK_TOKEN ||
            qs.token ||
            qs.TBK_TOKEN_WS;

        if (!token && event.body) {
            const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
            if (contentType.includes("application/x-www-form-urlencoded")) {
                const parsed = querystring.parse(event.body);
                token = parsed.TBK_TOKEN || parsed.token;
            } else {
                try {
                    const parsed = JSON.parse(event.body);
                    token = parsed.TBK_TOKEN || parsed.token;
                } catch { }
            }
        }

        console.log("🔹 Token recibido:", token);

        if (!token) {
            throw new Error("Faltó el token en la solicitud. Token inválido.");
        }

        // 2️⃣ OBTENER DATOS DESDE S3
        try {
            const bucketName = "plataformas-web-buckets";
            const key = `tokens/${token}.json`;  // Asegúrate de que esta clave sea correcta

            console.log(`🔍 Buscando el token en S3: tokens/${token}.json`);

            existingData = await s3
                .getObject({ Bucket: bucketName, Key: key })
                .promise()
                .then(r => JSON.parse(r.Body.toString()))
                .catch((err) => {
                    console.warn("⚠️ Error al buscar en S3:", err);
                    return null;
                });

            if (existingData) {
                entorno_tbk = existingData.entorno || existingData.entorno_tbk || "INTEGRACION";
                console.log("📦 Datos S3 encontrados. entorno_tbk:", entorno_tbk);
            } else {
                console.log("⚠️ Token no encontrado en S3, se asume INT");
            }
        } catch (err) {
            console.warn("⚠️ Error leyendo S3, fallback → INTEGRACION", err);
        }

        const isProd = entorno_tbk === "PRODUCCION";

        // ----------------------------------------------------------
        // 3️⃣ CONFIRMAR CON TRANSBANK
        // ----------------------------------------------------------
        const apiUrl = isProd
            ? `https://webpay3g.transbank.cl/rswebpaytransaction/api/oneclick/v1.0/inscriptions/${token}`
            : `https://webpay3gint.transbank.cl/rswebpaytransaction/api/oneclick/v1.0/inscriptions/${token}`;

        const headersReq = isProd
            ? {
                "Tbk-Api-Key-Id": process.env.TBK_OCM_API_KEY_ID,
                "Tbk-Api-Key-Secret": process.env.TBK_OCM_API_KEY_SECRET,
                "Content-Type": "application/json"
            }
            : {
                "Tbk-Api-Key-Id": "597055555541",
                "Tbk-Api-Key-Secret": "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C",
                "Content-Type": "application/json"
            };

        console.log("⚙️ Confirmando inscripción en:", apiUrl);
        const resp = await axios.put(apiUrl, {}, { headers: headersReq });

        console.log("✅ Respuesta Transbank:", resp.data);

        // Verifica si la respuesta tiene los campos necesarios
        if (!resp.data.token && !resp.data.url_webpay) {
            console.warn("⚠️ Respuesta incompleta, pero aún continuando...");  // WARNING solo si no se reciben todos los campos
        }

        const { tbk_user, card_number, card_type, authorization_code } = resp.data;

        if (!tbk_user || !authorization_code) {
            throw new Error("Error en la confirmación de la inscripción. Datos incompletos.");
        }

        // ----------------------------------------------------------
        // 4️⃣ GUARDAR DATOS EN S3
        // ----------------------------------------------------------
        if (existingData) {
            const updated = {
                ...existingData,
                tbk_user,
                authorization_code,
                tarjeta: card_number,
                tipo_tarjeta: card_type,
                confirmado: true,
                fechaConfirmacion: new Date().toISOString(),
                entorno_tbk,
            };

            try {
                await s3.putObject({
                    Bucket: "plataformas-web-buckets",
                    Key: `tokens/${token}.json`,
                    Body: JSON.stringify(updated),
                    ContentType: "application/json",
                }).promise();
                console.log(`💾 Token ${token} guardado correctamente en S3.`);
                console.log("💾 S3 actualizado con datos finales");
            } catch (err) {
                console.warn("⚠️ No se pudo actualizar S3:", err.message);
            }
        }

        // ----------------------------------------------------------
        // 5️⃣ REDIRECCIÓN FINAL
        // ----------------------------------------------------------
        const cameFromLocal = existingData?.cameFromLocal === true;
        const redirectBase = cameFromLocal
            ? "http://localhost:5174"
            : "https://plataformas-web.cl";

        console.log("🔀 Redirigiendo a:", redirectBase);

        const redirectUrl = `${redirectBase}/suscripcion?status=success&tbk_user=${encodeURIComponent(
            tbk_user
        )}&card=${encodeURIComponent(card_number)}&type=${encodeURIComponent(card_type)}`;

        console.log("🔀 URL de redirección:", redirectUrl);
        return { statusCode: 302, headers: { Location: redirectUrl }, body: "" };

    } catch (err) {
        console.error("❌ Error confirmarSuscripcion:", err.response?.data || err);

        const cameFromLocal = existingData?.cameFromLocal === true;
        const redirectBase = cameFromLocal
            ? "http://localhost:5174"
            : "https://plataformas-web.cl";

        const redirectError = `${redirectBase}/suscripcion?status=error&msg=${encodeURIComponent(
            err.response?.data?.error_message || err.message
        )}`;

        console.log("🔴 Redirigiendo a error:", redirectError);
        return { statusCode: 302, headers: { Location: redirectError }, body: "" };
    }
};
