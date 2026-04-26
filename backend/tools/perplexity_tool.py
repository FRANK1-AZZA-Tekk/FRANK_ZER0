import os
import requests
from crewai.tools import BaseTool
from tenacity import retry, stop_after_attempt, wait_exponential

class PerplexitySearchTool(BaseTool):
    name: str = "Buscador de Internet Deep Web e Surface"
    description: str = "Use esta ferramenta para pesquisar na internet dados atualizados, tutoriais ou fatos recentes que não estão na sua memória base."

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _run(self, query: str) -> str:
        from core.vault import vault
        api_key = vault.PERPLEXITY_API_KEY
        if not api_key:
            return "ERRO CRÍTICO: Chave da API do Perplexity não encontrada."

        url = "https://api.perplexity.ai/chat/completions"
        
        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": "Você é um pesquisador preciso. Retorne apenas fatos diretos, sem introduções longas."},
                {"role": "user", "content": query}
            ]
        }
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Bearer {api_key}"
        }

        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            raise Exception(f"Falha na API: {response.status_code} - {response.text}")
