# YBY MQTT NODE

Modulo minimo para comunicacao bidirecional entre PC/Termux e LilyGO T-Watch S3.

## Arquitetura

- PC/Termux publica comandos em `yby/watch/cmd`.
- T-Watch assina `yby/watch/cmd`.
- T-Watch publica ACK/status em `yby/watch/ack`.
- Broker recomendado: Mosquitto local no PC ou qualquer broker acessivel via Tailscale/Wi-Fi.

## Setup no PC

```bash
python3 -m pip install --user paho-mqtt
python3 mqtt/mqtt_pc_publisher.py --broker 192.168.1.10 --message "PING"
python3 mqtt/mqtt_pc_publisher.py --broker 192.168.1.10 --listen
```

## Setup no Termux sem root

```bash
pkg update -y
pkg install -y python git openssh htop
git clone <URL_DO_REPO> yby
cd yby
bash mqtt/mqtt_termux_runner.sh --broker 192.168.1.10 --listen
```

## SSH Cursor -> Termux

No Termux:

```bash
pkg install -y openssh
passwd
sshd
whoami
ip addr
```

No PC/Cursor:

```bash
ssh -p 8022 <usuario>@<ip_do_xiaomi>
```

## Flash do T-Watch

1. Abra `mqtt/mqtt_watch_sub.ino` no Arduino IDE ou PlatformIO.
2. Instale bibliotecas:
   - `PubSubClient`
   - `TFT_eSPI`
3. Ajuste `WIFI_SSID`, `WIFI_PASS` e `MQTT_HOST`.
4. Faça upload via USB.

OTA pode ser adicionado depois com `ArduinoOTA`, mas o primeiro flash deve ser USB para reduzir risco.

## HUD LVGL v9 do T-Watch

Para a interface cyberpunk completa com 4 telas, use o projeto PlatformIO:

```bash
cd wearable/twatch_s3_lvgl
cp include/config.example.h include/config.h
pio run
pio run --target upload
```

O HUD LVGL assina `yby/watch/telemetry`, publica presença em `yby/watch/status`
e alterna telas por swipe. Se o MQTT cair, reduz brilho e entra em deep sleep
por 30 segundos para poupar bateria.

## Teste end-to-end

Terminal 1:

```bash
python3 mqtt/mqtt_pc_publisher.py --broker 192.168.1.10 --listen
```

Terminal 2:

```bash
python3 mqtt/mqtt_pc_publisher.py --broker 192.168.1.10 --message "STATUS"
```

Esperado:

- Watch exibe `STATUS`.
- Watch publica ACK.
- Listener mostra `ACK:STATUS`.

## Mock local sem broker

```bash
python3 mqtt/mqtt_pc_publisher.py --mock --message "PING"
```

## Otimizacoes reais

- Use QoS 1 para comandos criticos.
- Keepalive em 60s.
- Watch reduz brilho quando perde MQTT.
- Use sleep maior quando estiver fora do pulso operacional.
- Padronize topicos por dispositivo: `yby/watch/<id>/cmd`.

## Riscos

- Broker fora do ar: Watch fica em modo reconexao e reduz brilho.
- Wi-Fi instavel: PC/Termux deve reenviar comando se nao receber ACK.
- PubSubClient nao garante QoS 1 em publish igual broker profissional: use ACK explicito.
