#!/bin/bash

# Configurar variables de entorno explícitamente
export DATABASE_URL="mongodb+srv://servergames:servergames@cluster0.fs7ok5r.mongodb.net/server-games?ssl=true&retryWrites=true&w=majority&tlsAllowInvalidCertificates=true"
export NODE_ENV="production"
export PORT="3007"
export NODE_TLS_REJECT_UNAUTHORIZED="0"
export NODE_OPTIONS="--tls-min-v1.0"

# Iniciar la aplicación con SSL deshabilitado
node --tls-min-v1.0 --tls-reject-unauthorized=0 dist/main.js
