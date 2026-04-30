#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Runner Termux do YBY MQTT.
# Sem root. Sem magia. Instala o mínimo, sincroniza Git e roda publisher/listener.

REPO_URL="${YBY_REPO_URL:-}"
REPO_DIR="${YBY_REPO_DIR:-$HOME/yby}"
BROKER_HOST="${YBY_MQTT_HOST:-192.168.1.100}"
BROKER_PORT="${YBY_MQTT_PORT:-1883}"

echo "[YBY][MQTT] Preparando Termux..."
pkg update -y
pkg install -y git openssh python htop

echo "[YBY][MQTT] Instalando dependência Python leve..."
python -m pip install --user --upgrade pip
python -m pip install --user paho-mqtt SpeechRecognition vosk

if [ -n "$REPO_URL" ] && [ ! -d "$REPO_DIR/.git" ]; then
  echo "[YBY][MQTT] Clonando repositório em $REPO_DIR..."
  git clone "$REPO_URL" "$REPO_DIR"
elif [ -d "$REPO_DIR/.git" ]; then
  echo "[YBY][MQTT] Sincronizando repositório..."
  git -C "$REPO_DIR" pull --ff-only || true
else
  echo "[YBY][MQTT] Sem YBY_REPO_URL; usando diretório atual."
  REPO_DIR="$(pwd)"
fi

echo "[YBY][MQTT] SSH opcional para Cursor/PC:"
echo "  ssh -p 8022 <usuario>@<ip_do_pc>"
echo "  No PC, rode um servidor SSH se quiser editar/sincronizar por terminal."

cd "$REPO_DIR"

echo "[YBY][MQTT] Rodando listener de ACK em segundo plano..."
python mqtt/mqtt_pc_publisher.py --host "$BROKER_HOST" --port "$BROKER_PORT" --listen &
LISTENER_PID=$!

trap 'kill "$LISTENER_PID" 2>/dev/null || true' EXIT

echo "[YBY][MQTT] Enviando ping para o relógio..."
python mqtt/mqtt_pc_publisher.py --host "$BROKER_HOST" --port "$BROKER_PORT" --message "PING_TERMUX"

echo "[YBY][MQTT] Listener ativo por 20s para receber ACK..."
sleep 20

echo "[YBY][VOICE] Para comando de voz offline, baixe um modelo Vosk pequeno (<50MB) e rode:"
echo "  python mqtt/voice_commands.py --broker $BROKER_HOST --model ~/vosk-model-small-pt"
