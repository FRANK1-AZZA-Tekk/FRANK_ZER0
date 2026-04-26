from crewai import Agent

def create_biometric_agent(llm):
    return Agent(
        role='Analista Biométrico (BIOMETRIC_AGENT)',
        goal='Analisar dados de HRV e sono do Oura Ring e gerar nudges proativos',
        backstory='Você monitora os sinais vitais do usuário. Se o stress (HRV) sobe, você intervém. Você é direto e focado em otimização biológica.',
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
