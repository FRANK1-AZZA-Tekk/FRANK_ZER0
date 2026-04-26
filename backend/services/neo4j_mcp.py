import os
from neo4j import GraphDatabase
from datetime import datetime

class Neo4jMCP:
    def __init__(self):
        from core.vault import vault
        uri = vault.NEO4J_URI or "neo4j+s://mock.databases.neo4j.io"
        user = vault.NEO4J_USER or "neo4j"
        password = vault.NEO4J_PASSWORD or "mock_password"
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def add_interaction(self, user_id: str, name: str, interaction_type: str, data: str):
        query = """
        MERGE (u:User {user_id: $user_id})
        ON CREATE SET u.name = $name
        CREATE (i:Interaction {timestamp: $now, type: $type, data: $data})
        MERGE (u)-[:HAS_INTERACTION]->(i)
        """
        with self.driver.session() as session:
            session.run(query, user_id=user_id, name=name, now=datetime.utcnow().isoformat(), type=interaction_type, data=data)

    def update_biometrics(self, user_id: str, heart_rate: int, stress_level: str):
        query = """
        MERGE (u:User {user_id: $user_id})
        MERGE (b:Biometrics {id: $user_id + '_bio'})
        ON CREATE SET b.heart_rate = $heart_rate, b.stress_level = $stress_level
        ON MATCH SET b.heart_rate = $heart_rate, b.stress_level = $stress_level, b.last_updated = $now
        MERGE (u)-[:HAS_BIOMETRICS]->(b)
        """
        with self.driver.session() as session:
            session.run(query, user_id=user_id, heart_rate=heart_rate, stress_level=stress_level, now=datetime.utcnow().isoformat())

    def optimize_memory_dossier(self, user_id: str):
        query = """
        MATCH (u:User {user_id: $user_id})-[:HAS_INTERACTION]->(i:Interaction)
        WITH u, count(i) as interaction_count, collect(i.data)[0..5] as recent_interactions
        MERGE (p:Preferences {id: $user_id + '_pref'})
        SET p.interaction_count = interaction_count, p.summary = 'UMEM Optimized Dossier'
        MERGE (u)-[:HAS_PREFERENCES]->(p)
        RETURN p
        """
        with self.driver.session() as session:
            result = session.run(query, user_id=user_id)
            return result.single()

neo4j_cortex = Neo4jMCP()
