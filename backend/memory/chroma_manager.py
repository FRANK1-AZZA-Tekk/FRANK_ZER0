import os
import chromadb
from chromadb.config import Settings

class CortexMemory:
    def __init__(self):
        from core.vault import vault
        chroma_url = vault.CHROMA_URL
        
        host = chroma_url.split("://")[-1].split(":")[0]
        port = chroma_url.split(":")[-1] if ":" in chroma_url.split("://")[-1] else "8000"

        try:
            self.client = chromadb.HttpClient(host=host, port=port)
            self.collection = self.client.get_or_create_collection(name="frank_knowledge_base")
            print("[SISTEMA] Conectado à Memória Vetorial com sucesso.")
        except Exception as e:
            print(f"[AVISO] Falha ao conectar no ChromaDB. Rodando sem memória de longo prazo. Erro: {e}")
            self.collection = None

    def save_memory(self, text_id: str, content: str, metadata: dict = None):
        if self.collection:
            self.collection.add(
                documents=[content],
                metadatas=[metadata or {"source": "user_input"}],
                ids=[text_id]
            )

    def recall_memory(self, query: str, n_results: int = 2) -> str:
        if not self.collection:
            return "Memória indisponível."
        
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if results and results['documents'] and len(results['documents'][0]) > 0:
            return " | ".join(results['documents'][0])
        return "Nenhuma memória relevante encontrada."

cortex = CortexMemory()
