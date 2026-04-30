import { getApiUrl } from "./api";

export const performResearch = async (topic: string): Promise<string> => {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/swarm/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: topic }),
    });
    if (!res.ok) throw new Error("Server Error");
    const data = await res.json();
    return data.result || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("API Error:", error);
    return `Erro ao realizar pesquisa real.`;
  }
};

export const generateOptimizations = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/swarm/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error("Server Error");
    const data = await res.json();
    
    if (data.improvements && Array.isArray(data.improvements)) {
       return data.improvements.map((opt: any) => opt.title || "Otimização não especificada");
    }
    
    return [
      "Implementar WebGPU para aceleração de inferência local",
      "Atualizar para a versão mais recente do modelo DeepSeek GGUF",
      "Otimizar o bundle Vite com code-splitting agressivo"
    ];
  } catch (error) {
    console.error("API Error:", error);
    return [
      "Falha ao buscar otimizações reais",
      "Verifique a conexão com o Cortex backend",
      "Mantendo sistema na versão atual"
    ];
  }
};

export const processVision = async (base64Image: string): Promise<string> => {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/swarm/vision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!res.ok) throw new Error("Server Error");
    const data = await res.json();
    return data.analysis || data.result || "Análise de imagem concluída sem retorno textual.";
  } catch (error) {
    console.error("Vision Error:", error);
    return "Erro no processamento visual.";
  }
};

export const processGeneralCommand = async (command: string, context: string): Promise<string> => {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/swarm/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: command, text: command }), // Assume text is sent directly for now
    });
    if (!res.ok) throw new Error("Server Error");
    const data = await res.json();
    return data.yby_response || data.result?.response || data.result || "Comando processado, mas sem resposta gerada.";
  } catch (error) {
    console.error("API Error:", error);
    return "Erro de processamento neural local.";
  }
};
