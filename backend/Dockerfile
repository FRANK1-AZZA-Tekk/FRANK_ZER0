FROM python:3.11-slim

WORKDIR /app

# Instalação de dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalação do Redis (para rate limiting)
# RUN apt-get install -y redis-server

# Copia e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte
COPY . .

# Expõe a porta 3000 (Obrigatória para o ambiente)
EXPOSE 3000

# Comando de inicialização para produção
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:3000"]
