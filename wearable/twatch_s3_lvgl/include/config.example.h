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

// Microfone I2S: ajuste conforme pinagem real da sua revisão LilyGO.
// Se ainda nao souber os pinos, deixe ENABLE_I2S_MIC 0.
#define ENABLE_I2S_MIC 0
#define I2S_MIC_WS 0
#define I2S_MIC_SCK 0
#define I2S_MIC_SD 0
#define I2S_SAMPLE_RATE 16000
#define VOICE_ENERGY_THRESHOLD 1800

// Beep simples de confirmação. Ajuste BUZZER_PIN ou deixe -1 para desativar.
#define BUZZER_PIN -1
