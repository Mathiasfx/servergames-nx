#!/bin/bash

# Probar con URL sin SSL
export DATABASE_URL="mongodb://servergames:servergames@cluster0.fs7ok5r.mongodb.net/server-games"
export NODE_ENV="production"
export PORT="3007"
export NODE_TLS_REJECT_UNAUTHORIZED="0"

# Iniciar la aplicación
node dist/main.js
