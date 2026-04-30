#!/usr/bin/env python3
"""Publisher MQTT leve para YBY.

Roda no PC ou no Termux. Publica comandos para o T-Watch S3 e escuta ACKs.
Sem framework pesado: apenas paho-mqtt e biblioteca padrao.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from dataclasses import dataclass

import paho.mqtt.client as mqtt


@dataclass
class MqttConfig:
    """Configuracao central do broker e topicos."""

    host: str
    port: int
    client_id: str
    command_topic: str
    ack_topic: str
    keepalive: int = 60


def load_config() -> MqttConfig:
    """Le configuracao por variaveis de ambiente para funcionar no PC e Termux."""

    return MqttConfig(
        host=os.getenv("YBY_MQTT_HOST", "127.0.0.1"),
        port=int(os.getenv("YBY_MQTT_PORT", "1883")),
        client_id=os.getenv("YBY_MQTT_CLIENT_ID", "yby-pc-publisher"),
        command_topic=os.getenv("YBY_MQTT_COMMAND_TOPIC", "yby/watch/command"),
        ack_topic=os.getenv("YBY_MQTT_ACK_TOPIC", "yby/watch/ack"),
    )


def build_payload(message: str, source: str) -> str:
    """Monta JSON pequeno e previsivel para o relogio processar."""

    return json.dumps(
        {
            "source": source,
            "message": message,
            "ts": int(time.time()),
        },
        separators=(",", ":"),
        ensure_ascii=False,
    )


def on_connect(client: mqtt.Client, _userdata, _flags, reason_code, _properties=None) -> None:
    """Assina o topico de ACK quando conecta ao broker."""

    print(f"[YBY][MQTT] conectado: {reason_code}")
    client.subscribe(load_config().ack_topic, qos=1)


def on_message(_client: mqtt.Client, _userdata, msg: mqtt.MQTTMessage) -> None:
    """Mostra ACKs do T-Watch/Termux sem tentar interpretar demais."""

    print(f"[YBY][ACK] {msg.topic}: {msg.payload.decode(errors='replace')}")


def publish_once(config: MqttConfig, message: str, source: str, mock: bool) -> None:
    """Publica um unico comando com QoS 1.

    Em modo mock, apenas imprime o payload; util para testar sem broker.
    """

    payload = build_payload(message, source)
    if mock:
        print(f"[MOCK] topic={config.command_topic} qos=1 payload={payload}")
        return

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=config.client_id)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(config.host, config.port, keepalive=config.keepalive)
    client.loop_start()
    info = client.publish(config.command_topic, payload, qos=1, retain=False)
    info.wait_for_publish(timeout=5)
    print(f"[YBY][MQTT] publicado em {config.command_topic}: {payload}")
    time.sleep(2)
    client.loop_stop()
    client.disconnect()


def listen(config: MqttConfig, mock: bool) -> None:
    """Escuta ACKs continuamente. No Termux, rode dentro de tmux se quiser deixar ativo."""

    if mock:
        print(f"[MOCK] escutaria ACKs em {config.ack_topic}")
        return

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"{config.client_id}-listener")
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(config.host, config.port, keepalive=config.keepalive)
    print(f"[YBY][MQTT] escutando ACKs em {config.ack_topic}. Ctrl+C para sair.")
    client.loop_forever()


def main() -> int:
    parser = argparse.ArgumentParser(description="YBY MQTT publisher PC/Termux")
    parser.add_argument("message", nargs="?", default="PING_YBY", help="Mensagem para o T-Watch")
    parser.add_argument("--broker", "--host", dest="host", help="IP/host do broker MQTT")
    parser.add_argument("--port", type=int, help="Porta do broker MQTT")
    parser.add_argument("--message", dest="message_flag", help="Mensagem para o T-Watch; alias amigavel para iniciantes")
    parser.add_argument("--source", default=os.getenv("YBY_NODE_NAME", "pc"), help="Identidade do emissor")
    parser.add_argument("--listen", action="store_true", help="Escuta ACKs em vez de publicar")
    parser.add_argument("--mock", action="store_true", help="Nao conecta no broker; imprime o que faria")
    args = parser.parse_args()

    config = load_config()
    if args.host:
        config.host = args.host
    if args.port:
        config.port = args.port

    if args.listen:
        listen(config, args.mock)
    else:
        publish_once(config, args.message_flag or args.message, args.source, args.mock)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
