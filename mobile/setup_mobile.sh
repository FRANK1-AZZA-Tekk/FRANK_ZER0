#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Setup do MOBILE_NODE para Termux/HyperOS sem root.
# Function Over Form: instala só o necessário para operar o HUD.

echo "[YBY][MOBILE_NODE] Atualizando pacotes Termux..."
pkg update -y
pkg upgrade -y

echo "[YBY][MOBILE_NODE] Instalando base: python, pip, openssh e htop..."
pkg install -y python python-pip openssh htop

echo "[YBY][MOBILE_NODE] Instalando bibliotecas Python do HUD..."
python -m pip install --user --upgrade pip
python -m pip install --user -r "$(dirname "$0")/requirements.txt"

if [ ! -f "$(dirname "$0")/.env" ]; then
  cp "$(dirname "$0")/.env.example" "$(dirname "$0")/.env"
  echo "[YBY][MOBILE_NODE] Criado mobile/.env. Edite YBY_PC_HOST com o IP do PC."
fi

echo "[YBY][MOBILE_NODE] OK."
echo "Execute: python mobile/terminal_hud.py"
