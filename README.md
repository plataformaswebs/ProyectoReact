# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


CORREOS
=======

plataformas.web.cl@gmail.com //OFICIAL
plataformas.web.contacto@gmail.com //CONTACTO
plataformas.webs.cl@gmail.com //SUSCRIPCIÓN


ANOTACIONES
===========
Password Example (Comando Git): node hashea.js admin 1234
Shift + Alt + F (Ordenar Código)

INSTALAR EN CONSOLA:
// npm install react-ga4
// npm install googleapis
LUEGO PARA NETLIFY, Consumir API GOOGLE:
// npm install netlify-cli -g
// netlify functions:create getAnalyticsStats

AMAZON S3
// npm install aws-sdk

BUCKET POLITICAS BUCKET:
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowPublicReadAccess",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::plataformas-web-buckets/*"
        }
    ]
}
BUCKET RECURSOS CORS:
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]

TRANSBANK
=========

TEST: netlify dev
npm install transbank-sdk

npm install -g ngrok
ngrok http 8888

npm install connect-history-api-fallback --save-dev
REGISTRARSE COMO CLIENTE PARA INGRESAR BANCO transbank.cl

COMANDOS
========

Node: npm run dev - npm run build

DEV: netlify dev
PRD: netlify deploy --prod


Kill puerto: npx kill-port 5173

REVISAR INSTALADO: npm install @google-analytics/data
AUTORIZAR NETLIFY: netlify deploy --prod

API NETLIFY: npx netlify functions:serve getAnalyticsStats

CORRER SERVICIOS: npx netlify dev

//LIMPIAR TAREAS
netstat -ano | findstr 5173
taskkill //PID 25908 //F
 taskkill /F /IM node.exe

227689800 (CONSULTAR OPCIONES DE PAGOS PARA EL CREDITO) TESORERIA NACIONAL DE LA REPUBLICA


*** PAY PAL - PLAN ***
curl -s -u "ASqGPrpMqekcTN4tWrMDuisHzi4wYjz8KjFdC48uFrdlnP4lA9yWRcIPTs909tMYjrtg-wFgf02w2Axy:EKDrID-iMqCHxQPlyxixeF-kHbQcrV4NZwvdLSInZ_M2Nxd6xw18bZ4CzBbD6ZgCeG9tWSgCGOYalzOA" \
  https://api-m.paypal.com/v1/oauth2/token \
  -d "grant_type=client_credentials"


curl -v -X POST https://api-m.paypal.com/v1/billing/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer A21AAM9Y42YvSxqy_PQSSbNPhkXFUxhnSsEz7RnR_hF1dSz_qzQYYUvusymP73Vkcmk6J9HcM59mKvA65rThwvvf9Y3XeaDdw" \
  -d '{
        "product_id": "PROD-57P335166G714234C",
        "name": "Plan Mensual SPA",
        "description": "Acceso completo a la plataforma SPA - pago mensual",
        "billing_cycles": [
          {
            "frequency": {
              "interval_unit": "MONTH",
              "interval_count": 1
            },
            "tenure_type": "REGULAR",
            "sequence": 1,
            "total_cycles": 0,
            "pricing_scheme": {
              "fixed_price": {
                "value": "300.00",
                "currency_code": "USD"
              }
            }
          }
        ],
        "payment_preferences": {
          "auto_bill_outstanding": true,
          "setup_fee": {
            "value": "0",
            "currency_code": "USD"
          },
          "setup_fee_failure_action": "CONTINUE",
          "payment_failure_threshold": 3
        }
      }'

CLIENT_ID: ASqGPrpMqekcTN4tWrMDuisHzi4wYjz8KjFdC48uFrdlnP4lA9yWRcIPTs909tMYjrtg
SECRET_CLIENT: EKDrID-iMqCHxQPlyxixeF-kHbQcrV4NZwvdLSInZ_M2Nxd6xw18bZ4CzBbD6ZgCeG9tWSgCGOYalzOA
ACCESS_KEY: A21AAM9Y42YvSxqy_PQSSbNPhkXFUxhnSsEz7RnR_hF1dSz_qzQYYUvusymP73Vkcmk6J9HcM59mKvA65rThwvvf9Y3XeaDdw
Plan ID: P-5LC37433HN414072XNGREBOA
Producto asociado: PROD-57P335166G714234C

npm run dev:all (NEW COMMAND)