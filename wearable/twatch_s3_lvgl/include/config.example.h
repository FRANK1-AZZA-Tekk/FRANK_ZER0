#pragma once

// Copie para include/config.h e ajuste. Nunca versionar senha real.

#define WIFI_SSID "SUA_REDE_WIFI"
#define WIFI_PASSWORD "SUA_SENHA_WIFI"

#define MQTT_HOST "192.168.1.100"
#define MQTT_PORT 1883
#define MQTT_CLIENT_ID "yby-watch-s3"

#define MQTT_TOPIC_TELEMETRY "yby/watch/telemetry"
#define MQTT_TOPIC_LOGS "yby/watch/logs"
#define MQTT_TOPIC_ACK "yby/watch/ack"

// Botao fisico BACK. Ajuste conforme sua revisao do T-Watch S3 Plus.
// Use -1 para desativar caso a placa/library LilyGO exponha outro caminho.
#define BACK_BUTTON_PIN 0

// Touch via TFT_eSPI. Se sua configuracao TFT_eSPI nao tiver touch calibrado,
// deixe ativo mesmo assim: o firmware ignora leituras inexistentes.
#define ENABLE_TOUCH_SWIPE 1
