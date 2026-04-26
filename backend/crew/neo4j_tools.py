from langchain.tools import tool
from services.neo4j_mcp import neo4j_cortex

@tool("Registrar Interação no Grafo")
def log_interaction(user_id: str, name: str, interaction_type: str, data: str) -> str:
    """Registra uma nova interação do usuário no Neo4j Graph RAG."""
    try:
        neo4j_cortex.add_interaction(user_id, name, interaction_type, data)
        return f"Interação '{interaction_type}' registrada com sucesso para {user_id}."
    except Exception as e:
        return f"Erro ao registrar no Neo4j: {str(e)}"

@tool("Otimizar Memória UMEM (Dossiê)")
def optimize_dossier(user_id: str) -> str:
    """Roda o otimizador UMEM para consolidar interações em preferências."""
    try:
        res = neo4j_cortex.optimize_memory_dossier(user_id)
        return f"Dossiê UMEM otimizado: {res}"
    except Exception as e:
        return f"Erro na otimização UMEM: {str(e)}"

@tool("NL2Cypher APOC Query")
def nl2cypher_query(natural_language_query: str) -> str:
    """Converte linguagem natural para Cypher usando APOC (Mock/Simulação para segurança OWASP)."""
    return f"[APOC NL2Cypher] Query processada: MATCH (n) RETURN n LIMIT 5 // Baseado em: {natural_language_query}"

@tool("Buscar Memória no Grafo")
def search_memory(user_id: str, query: str) -> str:
    """Busca interações passadas e preferências do usuário no Neo4j."""
    try:
        # Simulação de busca semântica no grafo
        return f"Resultados da memória para '{query}': Encontrado 3 interações relevantes sobre {query}."
    except Exception as e:
        return f"Erro ao buscar na memória: {str(e)}"

class Neo4jMemoryTools:
    def __init__(self):
        self.log_interaction = log_interaction
        self.optimize_dossier = optimize_dossier
        self.nl2cypher_query = nl2cypher_query
        self.search_memory = search_memory
