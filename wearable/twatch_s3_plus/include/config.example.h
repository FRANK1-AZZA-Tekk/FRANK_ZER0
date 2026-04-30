#pragma once

// Copie este arquivo para include/config.h e ajuste os valores locais.
// Nunca versionar config.h com senha real de Wi-Fi.

#define WIFI_SSID "SUA_REDE_WIFI"
#define WIFI_PASSWORD "SUA_SENHA_WIFI"

// IP do PC rodando FastAPI:
// python -m uvicorn backend.yby_api:app --host 0.0.0.0 --port 8001
#define YBY_API_HOST "192.168.1.100"
#define YBY_API_PORT 8001
#define YBY_API_BASE "http://" YBY_API_HOST ":" String(YBY_API_PORT)
