#pragma once

// Copie este arquivo para include/config.h e ajuste os valores locais.
// Nunca versionar config.h com senha real de Wi-Fi.

#define WIFI_SSID "SUA_REDE_WIFI"
#define WIFI_PASSWORD "SUA_SENHA_WIFI"

// IP do PC rodando FastAPI:
// python -m uvicorn backend.frank_api:app --host 0.0.0.0 --port 8001
#define FRANK_API_HOST "192.168.1.100"
#define FRANK_API_PORT 8001
