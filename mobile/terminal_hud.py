#!/usr/bin/env python3
"""HUD mobile do YBY para Termux.

Interface 100% texto. Sem root. Sem bloat. Conecta ao FastAPI do PC pela rede
Wi-Fi local e resiste a quedas curtas de conexao.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

PC_HOST = os.getenv("YBY_PC_HOST", "127.0.0.1")
PC_PORT = int(os.getenv("YBY_PC_PORT", "8001"))
TIMEOUT = float(os.getenv("YBY_TIMEOUT", "4"))
BASE_URL = f"http://{PC_HOST}:{PC_PORT}"

console = Console()


def request_json(method: str, path: str, payload: dict[str, Any] | None = None) -> tuple[bool, Any]:
    """Chamada HTTP curta e resiliente para redes Wi-Fi instaveis."""
    try:
      with httpx.Client(timeout=TIMEOUT) as client:
          response = client.request(method, f"{BASE_URL}{path}", json=payload)
          response.raise_for_status()
          return True, response.json()
    except httpx.HTTPError as exc:
        return False, f"[OFFLINE] Link Neural Rompido: {exc}"


def header() -> Panel:
    return Panel(
        "[bold green]YBY MOBILE_NODE[/bold green]\n"
        f"[dim]PC alvo:[/dim] {BASE_URL}  [dim]modo:[/dim] Wi-Fi local / sem root",
        border_style="green",
        box=box.SQUARE,
    )


def show_status() -> None:
    ok, data = request_json("GET", "/status")
    if not ok:
        console.print(Panel(str(data), title="[STATUS]", border_style="red", box=box.SQUARE))
        return

    table = Table(title="[1] Status da Rede e Hardware do PC", box=box.SQUARE, border_style="green")
    table.add_column("Alvo", style="green")
    table.add_column("Valor", style="yellow")
    table.add_column("Notas", style="dim")

    cpu = data.get("cpu", {})
    ram = data.get("ram", {})
    gpu = data.get("gpu", {})
    thermal = data.get("thermal", {})

    table.add_row("CPU Ryzen 5", f"{cpu.get('usage_percent', 0):.1f}%", f"cores: {cpu.get('cores_logical')}")
    table.add_row("RAM 16GB", f"{ram.get('used_percent', 0):.1f}%", f"total: {ram.get('total_gb')} GB")

    gpu_usage = gpu.get("usage_percent")
    gpu_free = gpu.get("memory_free_mb")
    gpu_value = "N/A" if gpu_usage is None else f"{gpu_usage:.1f}%"
    gpu_note = f"VRAM livre: {gpu_free} MB" if gpu_free is not None else gpu.get("note", "sem NVML")
    table.add_row("GPU GTX 1650", gpu_value, gpu_note)
    table.add_row("Thermal Guard", thermal.get("mode", "unknown"), thermal.get("reason", "sem dados"))

    console.print(table)


def chat() -> None:
    message = Prompt.ask("[green]Prompt para YBY[/green]").strip()
    if not message:
        return

    console.print("[dim]> enviando pacote neural...[/dim]")
    ok, data = request_json("POST", "/chat", {"message": message})
    if not ok:
        console.print(Panel(str(data), title="[CHAT]", border_style="red", box=box.SQUARE))
        return

    response = data.get("response", "sem resposta")
    style = "green" if data.get("ok") else "yellow"
    console.print(Panel(response, title="[2] Chat Criptografado", border_style=style, box=box.SQUARE))


def force_evolution() -> None:
    """Aciona manualmente a rotina das 05:00 AM pelo endpoint local."""
    ok, data = request_json("POST", "/evolve", {"source": "mobile_node"})
    if not ok:
        console.print(Panel(str(data), title="[EVOLUCAO]", border_style="red", box=box.SQUARE))
        return

    console.print(
        Panel(
            data.get("message", "Rotina acionada."),
            title="[3] Auto-Evolucao Manual",
            border_style="yellow",
            box=box.SQUARE,
        )
    )


def menu() -> None:
    while True:
        console.clear()
        console.print(header())
        console.print("[green][1][/green] Status da Rede e Hardware do PC")
        console.print("[green][2][/green] Chat Criptografado")
        console.print("[green][3][/green] Forcar Rotina de Auto-Evolucao")
        console.print("[green][0][/green] Sair")

        try:
            choice = Prompt.ask("\n[amber]Escolha[/amber]", choices=["1", "2", "3", "0"], default="1")
        except EOFError:
            console.print("[green]MOBILE_NODE encerrado.[/green]")
            return

        if choice == "0":
            console.print("[green]MOBILE_NODE encerrado.[/green]")
            return
        if choice == "1":
            show_status()
        elif choice == "2":
            chat()
        elif choice == "3":
            force_evolution()

        console.print("\n[dim]Enter para voltar ao menu...[/dim]")
        try:
            input()
        except EOFError:
            console.print("[green]MOBILE_NODE encerrado.[/green]")
            return
        time.sleep(0.1)


if __name__ == "__main__":
    menu()
