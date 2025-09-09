"""
RAG (Retrieval-Augmented Generation) Service - Phase 3
Vector store for patient context and psychoeducation content
"""

import os
import json
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import hashlib
import asyncio

# For production, you'd use Pinecone or Weaviate
# For now, we'll implement a simple in-memory vector store
class SimpleVectorStore:
    """Simple in-memory vector store for development"""
    
    def __init__(self):
        self.vectors = {}
        self.metadata = {}
        self.index = {}
    
    def add_vector(self, id: str, vector: List[float], metadata: Dict[str, Any]):
        """Add a vector to the store"""
        self.vectors[id] = vector
        self.metadata[id] = metadata
        
        # Simple indexing by keywords
        for key, value in metadata.items():
            if isinstance(value, str):
                keywords = value.lower().split()
                for keyword in keywords:
                    if keyword not in self.index:
                        self.index[keyword] = set()
                    self.index[keyword].add(id)
    
    def search(self, query_vector: List[float], top_k: int = 5) -> List[Tuple[str, float, Dict[str, Any]]]:
        """Search for similar vectors"""
        results = []
        
        for vector_id, vector in self.vectors.items():
            similarity = self._cosine_similarity(query_vector, vector)
            results.append((vector_id, similarity, self.metadata[vector_id]))
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def search_by_keywords(self, keywords: List[str], top_k: int = 5) -> List[Tuple[str, float, Dict[str, Any]]]:
        """Search by keywords"""
        matching_ids = set()
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in self.index:
                matching_ids.update(self.index[keyword_lower])
        
        results = []
        for vector_id in matching_ids:
            if vector_id in self.metadata:
                results.append((vector_id, 1.0, self.metadata[vector_id]))
        
        return results[:top_k]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)

class RAGService:
    """RAG service for retrieving relevant context"""
    
    def __init__(self):
        self.vector_store = SimpleVectorStore()
        self.embedding_dimension = 384  # Standard embedding dimension
        
        # Initialize with psychoeducation content
        self._initialize_psychoeducation_content()
    
    def _initialize_psychoeducation_content(self):
        """Initialize vector store with psychoeducation content"""
        
        psychoeducation_content = [
            {
                "id": "anxiety_coping_1",
                "content": "Deep breathing exercises can help reduce anxiety. Try the 4-7-8 technique: inhale for 4 counts, hold for 7, exhale for 8.",
                "category": "anxiety",
                "type": "coping_strategy",
                "keywords": ["anxiety", "breathing", "relaxation", "calm"]
            },
            {
                "id": "depression_support_1", 
                "content": "Depression can make daily activities feel overwhelming. Start with small, manageable tasks and celebrate each accomplishment.",
                "category": "depression",
                "type": "support_guidance",
                "keywords": ["depression", "tasks", "accomplishment", "overwhelming"]
            },
            {
                "id": "mindfulness_1",
                "content": "Mindfulness meditation can help you stay present and reduce rumination. Try focusing on your breath for 5 minutes daily.",
                "category": "mindfulness",
                "type": "technique",
                "keywords": ["mindfulness", "meditation", "present", "breath"]
            },
            {
                "id": "sleep_hygiene_1",
                "content": "Good sleep hygiene includes maintaining a regular sleep schedule, avoiding screens before bed, and creating a comfortable sleep environment.",
                "category": "sleep",
                "type": "lifestyle",
                "keywords": ["sleep", "schedule", "screens", "environment"]
            },
            {
                "id": "social_support_1",
                "content": "Social connections are crucial for mental health. Reach out to friends, family, or support groups when you're struggling.",
                "category": "social",
                "type": "support_guidance", 
                "keywords": ["social", "connections", "friends", "support"]
            },
            {
                "id": "crisis_resources_1",
                "content": "If you're having thoughts of self-harm, please reach out immediately to a crisis helpline, emergency services, or a trusted person.",
                "category": "crisis",
                "type": "emergency",
                "keywords": ["crisis", "self-harm", "emergency", "helpline"]
            }
        ]
        
        # Add content to vector store
        for item in psychoeducation_content:
            # Create simple embedding (in production, use proper embedding model)
            embedding = self._create_simple_embedding(item["content"])
            self.vector_store.add_vector(
                item["id"],
                embedding,
                {
                    "content": item["content"],
                    "category": item["category"],
                    "type": item["type"],
                    "keywords": item["keywords"]
                }
            )
    
    def _create_simple_embedding(self, text: str) -> List[float]:
        """Create a simple embedding for text (placeholder for production)"""
        # In production, you'd use a proper embedding model like OpenAI's text-embedding-ada-002
        # For now, create a simple hash-based embedding
        
        # Create a hash of the text
        text_hash = hashlib.md5(text.encode()).hexdigest()
        
        # Convert hash to vector
        embedding = []
        for i in range(0, len(text_hash), 2):
            hex_pair = text_hash[i:i+2]
            embedding.append(int(hex_pair, 16) / 255.0)  # Normalize to 0-1
        
        # Pad or truncate to desired dimension
        while len(embedding) < self.embedding_dimension:
            embedding.append(0.0)
        
        return embedding[:self.embedding_dimension]
    
    async def retrieve_relevant_context(
        self, 
        patient_message: str, 
        patient_context: Dict[str, Any],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant context for patient message"""
        
        try:
            # Create embedding for patient message
            query_embedding = self._create_simple_embedding(patient_message)
            
            # Search for similar content
            similar_items = self.vector_store.search(query_embedding, top_k)
            
            # Also search by keywords from patient context
            keywords = []
            if patient_context.get("mood_trend"):
                keywords.append(patient_context["mood_trend"])
            if patient_context.get("recent_concerns"):
                keywords.extend(patient_context["recent_concerns"].split())
            
            keyword_results = []
            if keywords:
                keyword_results = self.vector_store.search_by_keywords(keywords, top_k)
            
            # Combine and deduplicate results
            all_results = similar_items + keyword_results
            unique_results = {}
            
            for vector_id, similarity, metadata in all_results:
                if vector_id not in unique_results or unique_results[vector_id][1] < similarity:
                    unique_results[vector_id] = (similarity, metadata)
            
            # Sort by similarity and return top_k
            sorted_results = sorted(unique_results.values(), key=lambda x: x[0], reverse=True)
            
            return [
                {
                    "content": metadata["content"],
                    "category": metadata["category"],
                    "type": metadata["type"],
                    "relevance_score": similarity,
                    "source": "psychoeducation"
                }
                for similarity, metadata in sorted_results[:top_k]
            ]
            
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return []
    
    async def add_patient_interaction(
        self, 
        patient_id: str, 
        interaction_content: str, 
        interaction_type: str = "chat"
    ):
        """Add patient interaction to context store"""
        
        try:
            # Create embedding for interaction
            embedding = self._create_simple_embedding(interaction_content)
            
            # Create metadata
            metadata = {
                "patient_id": patient_id,
                "content": interaction_content,
                "type": interaction_type,
                "timestamp": datetime.utcnow().isoformat(),
                "keywords": interaction_content.lower().split()[:10]  # First 10 words as keywords
            }
            
            # Add to vector store
            interaction_id = f"patient_{patient_id}_{datetime.utcnow().timestamp()}"
            self.vector_store.add_vector(interaction_id, embedding, metadata)
            
        except Exception as e:
            print(f"Error adding patient interaction: {e}")
    
    async def get_patient_context(
        self, 
        patient_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent patient context"""
        
        try:
            # Search for patient interactions
            patient_keywords = [patient_id]
            results = self.vector_store.search_by_keywords(patient_keywords, limit)
            
            return [
                {
                    "content": metadata["content"],
                    "type": metadata["type"],
                    "timestamp": metadata["timestamp"],
                    "relevance_score": similarity
                }
                for vector_id, similarity, metadata in results
                if metadata.get("patient_id") == patient_id
            ]
            
        except Exception as e:
            print(f"Error getting patient context: {e}")
            return []
    
    def get_explainability_data(self, retrieved_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get explainability data for retrieved context"""
        
        if not retrieved_context:
            return {
                "sources_found": 0,
                "categories": [],
                "average_relevance": 0.0,
                "explanation": "No relevant context found"
            }
        
        categories = [item["category"] for item in retrieved_context if "category" in item]
        relevance_scores = [item["relevance_score"] for item in retrieved_context]
        
        return {
            "sources_found": len(retrieved_context),
            "categories": list(set(categories)),
            "average_relevance": sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0,
            "top_sources": [
                {
                    "content": item["content"][:100] + "..." if len(item["content"]) > 100 else item["content"],
                    "category": item.get("category", "unknown"),
                    "relevance_score": item["relevance_score"]
                }
                for item in retrieved_context[:3]
            ],
            "explanation": f"Retrieved {len(retrieved_context)} relevant sources from psychoeducation database, covering topics: {', '.join(set(categories))}"
        }

# Global RAG service instance
rag_service = RAGService()
