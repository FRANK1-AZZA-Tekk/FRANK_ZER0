#!/usr/bin/env python3
"""Entrada principal de voz offline para PC/Termux.

Este arquivo existe para bater com o workflow pedido: `voice_pc.py`.
A lógica real fica em `voice_commands.py` para não duplicar código.
"""

from voice_commands import main


if __name__ == "__main__":
    raise SystemExit(main())
