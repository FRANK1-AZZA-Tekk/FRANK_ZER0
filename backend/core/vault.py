import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env para a memória do sistema
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

class Vault:
    """
    Cofre centralizado de APIs (Secrets Management).
    Garante que as chaves sejam acessadas de forma segura e em um único ponto,
    evitando vazamentos e facilitando a rotação de credenciais.
    """
    
    @property
    def GROQ_API_KEY(self):
        return os.getenv("GROQ_API_KEY")

    @property
    def DEEPSEEK_API_KEY(self):
        return os.getenv("DEEPSEEK_API_KEY")

    @property
    def OPENROUTER_API_KEY(self):
        return os.getenv("OPENROUTER_API_KEY")

    @property
    def GEMINI_API_KEY(self):
        return os.getenv("GEMINI_API_KEY")

    @property
    def PERPLEXITY_API_KEY(self):
        return os.getenv("PERPLEXITY_API_KEY")

    @property
    def TAVILY_API_KEY(self):
        return os.getenv("TAVILY_API_KEY")

    @property
    def ELEVENLABS_API_KEY(self):
        return os.getenv("ELEVENLABS_API_KEY")

    @property
    def OPENAI_API_KEY(self):
        return os.getenv("OPENAI_API_KEY")

    @property
    def ELEVENLABS_VOICE_ID(self):
        return os.getenv("ELEVENLABS_VOICE_ID")

    @property
    def HUGGINGFACE_API_KEY(self):
        return os.getenv("HUGGINGFACE_API_KEY")

    @property
    def CHROMA_URL(self):
        return os.getenv("CHROMA_URL", "http://localhost:8000")

    @property
    def CARTESIA_API_KEY(self):
        return os.getenv("CARTESIA_API_KEY")

    @property
    def DEEPGRAM_API_KEY(self):
        return os.getenv("DEEPGRAM_API_KEY")

    @property
    def WEATHER_API_KEY(self):
        return os.getenv("WEATHER_API_KEY")

    @property
    def OLLAMA_HOST(self):
        return os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")

    @property
    def NEO4J_URI(self):
        return os.getenv("NEO4J_URI")

    @property
    def NEO4J_USER(self):
        return os.getenv("NEO4J_USER")

    @property
    def NEO4J_PASSWORD(self):
        return os.getenv("NEO4J_PASSWORD")

    def reload(self):
        load_dotenv(dotenv_path=env_path, override=True)

# Instância global do cofre para ser importada nos outros módulos
vault = Vault()
