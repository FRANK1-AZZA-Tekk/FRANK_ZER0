#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Setup do MOBILE_NODE para Termux/HyperOS sem root.
# Function Over Form: instala só o necessário para operar o HUD.

echo "[FRANK][MOBILE_NODE] Atualizando pacotes Termux..."
pkg update -y
pkg upgrade -y

echo "[FRANK][MOBILE_NODE] Instalando base: python, pip, openssh e htop..."
pkg install -y python python-pip openssh htop

echo "[FRANK][MOBILE_NODE] Instalando bibliotecas Python do HUD..."
python -m pip install --user --upgrade pip
python -m pip install --user -r "$(dirname "$0")/requirements.txt"

if [ ! -f "$(dirname "$0")/.env" ]; then
  cp "$(dirname "$0")/.env.example" "$(dirname "$0")/.env"
  echo "[FRANK][MOBILE_NODE] Criado mobile/.env. Edite FRANK_PC_HOST com o IP do PC."
fi

echo "[FRANK][MOBILE_NODE] OK."
echo "Execute: python mobile/terminal_hud.py"
