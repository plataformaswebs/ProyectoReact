#!/bin/bash
npx kill-port 5173 8888 2>/dev/null || true
npx rimraf .netlify/functions-serve 2>/dev/null || true
netlify dev
