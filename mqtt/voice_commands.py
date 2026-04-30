"""Voice commands offline para YBY.

Roda no PC ou Termux. Usa Vosk offline quando houver microfone/modelo local e
publica comandos normalizados no MQTT. O modo mock permite testar sem broker.
"""

from __future__ import annotations

import re
import argparse
import json
import os
import time
from dataclasses import dataclass

import paho.mqtt.client as mqtt


@dataclass(frozen=True)
class VoiceCommand:
    """Comando normalizado para o relógio executar."""

    command: str
    original_text: str


def parse_voice_command(text: str) -> VoiceCommand | None:
    """Extrai comando depois da wake word YBY/FRANK.

    A lógica é propositalmente simples:
    - Sem NLP pesado.
    - Sem chamada externa.
    - Fácil de ajustar para novas palavras.
    """

    normalized = text.strip().lower()
    if not re.search(r"\b(yby|frank)\b", normalized):
        return None

    if re.search(r"\b(status|estado|sistema)\b", normalized):
        return VoiceCommand(command="status", original_text=text)
    if re.search(r"\b(sleep|dormir|desligar tela|economia)\b", normalized):
        return VoiceCommand(command="sleep", original_text=text)
    if re.search(r"\b(scan|varredura|escanear)\b", normalized):
        return VoiceCommand(command="scan", original_text=text)
    if re.search(r"\b(optimize|otimizar|otimize|performance)\b", normalized):
        return VoiceCommand(command="optimize", original_text=text)

    return None


def command_payload(command: VoiceCommand, source: str) -> str:
    """Monta payload pequeno para o relógio executar rápido."""

    return json.dumps(
        {
            "source": source,
            "command": command.command,
            "text": command.original_text,
            "ts": int(time.time()),
        },
        separators=(",", ":"),
        ensure_ascii=False,
    )


def publish_command(host: str, port: int, topic: str, payload: str, mock: bool) -> None:
    """Publica comando por MQTT ou imprime no modo mock."""

    if mock:
        print(f"[MOCK][VOICE] topic={topic} qos=1 payload={payload}")
        return

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="yby-voice-node")
    client.connect(host, port, keepalive=60)
    client.loop_start()
    info = client.publish(topic, payload, qos=1, retain=False)
    info.wait_for_publish(timeout=5)
    client.loop_stop()
    client.disconnect()
    print(f"[YBY][VOICE] publicado: {payload}")


def listen_once_with_vosk(model_path: str) -> str:
    """Escuta uma frase pelo microfone usando SpeechRecognition + Vosk offline."""

    import speech_recognition as sr

    recognizer = sr.Recognizer()
    recognizer.dynamic_energy_threshold = True

    with sr.Microphone() as source:
        print("[YBY][VOICE] Fale: YBY status/sleep/scan/optimize")
        recognizer.adjust_for_ambient_noise(source, duration=0.4)
        audio = recognizer.listen(source, timeout=6, phrase_time_limit=5)

    return recognizer.recognize_vosk(audio, language="pt", model_path=model_path)


def main() -> int:
    parser = argparse.ArgumentParser(description="YBY Voice Commands MQTT")
    parser.add_argument("--broker", default=os.getenv("YBY_MQTT_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("YBY_MQTT_PORT", "1883")))
    parser.add_argument("--topic", default=os.getenv("YBY_MQTT_COMMAND_TOPIC", "yby/watch/command"))
    parser.add_argument("--source", default=os.getenv("YBY_NODE_NAME", "voice"))
    parser.add_argument("--model", default=os.getenv("YBY_VOSK_MODEL", ""))
    parser.add_argument("--text", "--mock-text", dest="text", help="Texto para testar sem microfone")
    parser.add_argument("--mock", action="store_true", help="Nao conecta no broker; imprime payload")
    args = parser.parse_args()

    text = args.text
    if not text:
        if not args.model:
            raise SystemExit("Defina --model ou YBY_VOSK_MODEL para usar Vosk offline.")
        text = listen_once_with_vosk(args.model)

    command = parse_voice_command(text)
    if not command:
        print(f"[YBY][VOICE] frase ignorada: {text}")
        return 1

    publish_command(args.broker, args.port, args.topic, command_payload(command, args.source), args.mock)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
