def analyze_hrv(rmssd: float, resting_hr: int) -> dict:
    """
    Mock Oura Ring HRV analysis
    """
    if rmssd < 30:
        return {"status": "HIGH_STRESS", "nudge": "Respira 4-7-8. Cortisol elevado detectado."}
    elif resting_hr > 75:
        return {"status": "FATIGUE", "nudge": "Foco baixo. Inicie ciclo Pomodoro ou consuma cafeína."}
    return {"status": "OPTIMAL", "nudge": "Sweet spot atingido. Continue."}
