const AWS = require("aws-sdk");
const XLSX = require("xlsx");
require("dotenv").config();

const BUCKET_NAME = process.env.BUCKET_NAME || "plataformas-web-buckets";
const REGION = process.env.MY_AWS_REGION || "us-east-2";
const FILE_KEY = "Clientes.xlsx";

AWS.config.update({
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region: REGION,
});

const s3 = new AWS.S3();

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: corsHeaders, body: "OK" };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Método no permitido" }),
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const {
            idCliente,
            nombreCliente,
            sitioWeb,
            URL,
            telefono,
            correo,
            pagado,
            valor,
            estado,
            logoCliente,
            internacional,
        } = body;

        if (!idCliente) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Falta idCliente" }),
            };
        }

        const s3Data = await s3.getObject({ Bucket: BUCKET_NAME, Key: FILE_KEY }).promise();
        const workbook = XLSX.read(s3Data.Body, { type: "buffer" });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(hoja, { defval: "" });

        const idx = datos.findIndex((d) => String(d.idCliente) === String(idCliente));
        if (idx === -1) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Cliente no encontrado" }),
            };
        }

        // Actualizar solo los campos enviados
        if (nombreCliente !== undefined) datos[idx].cliente = nombreCliente;
        if (sitioWeb !== undefined) datos[idx].sitioWeb = sitioWeb;
        if (URL !== undefined) datos[idx].URL = URL;
        if (telefono !== undefined) datos[idx].telefono = telefono;
        if (correo !== undefined) datos[idx].correo = correo;
        if (pagado !== undefined) datos[idx].pagado = pagado;
        if (valor !== undefined) datos[idx].valor = valor;
        if (estado !== undefined) datos[idx].estado = estado;
        if (logoCliente !== undefined) datos[idx].logoCliente = logoCliente;
        if (internacional !== undefined) datos[idx].internacional = internacional;

        const nuevaHoja = XLSX.utils.json_to_sheet(datos);
        workbook.Sheets[workbook.SheetNames[0]] = nuevaHoja;
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: FILE_KEY,
            Body: buffer,
            ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }).promise();

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Cliente actualizado correctamente", idCliente }),
        };
    } catch (error) {
        console.error("❌ Error al editar cliente:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Error interno", error: error.message }),
        };
    }
};
