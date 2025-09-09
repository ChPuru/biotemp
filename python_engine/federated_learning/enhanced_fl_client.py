# python_engine/federated_learning/enhanced_fl_client.py
import asyncio
import json
import numpy as np
import websockets
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import hashlib
import pickle
import base64

# ML imports
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score
    import joblib
except ImportError:
    print("scikit-learn not installed")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedFederatedLearningClient:
    def __init__(self, client_id: str, server_uri: str = "ws://localhost:8765"):
        self.client_id = client_id
        self.server_uri = server_uri
        self.local_model = None
        self.local_data = None
        self.training_history = []
        self.privacy_budget = 1.0  # Differential privacy budget
        self.contribution_score = 0.0
        
    async def connect_to_server(self):
        """Connect to federated learning server."""
        try:
            self.websocket = await websockets.connect(self.server_uri)
            logger.info(f"Client {self.client_id} connected to FL server")
            
            # Register with server
            await self.register_client()
            
            # Start listening for server messages
            await self.listen_for_updates()
            
        except Exception as e:
            logger.error(f"Failed to connect to FL server: {e}")
    
    async def register_client(self):
        """Register client with the federated learning server."""
        registration_msg = {
            "type": "register",
            "client_id": self.client_id,
            "capabilities": {
                "data_size": len(self.local_data) if self.local_data is not None else 0,
                "model_types": ["random_forest", "neural_network"],
                "privacy_level": "high",
                "computational_power": "medium"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await self.websocket.send(json.dumps(registration_msg))
        logger.info(f"Client {self.client_id} registered with server")
    
    async def listen_for_updates(self):
        """Listen for model updates from server."""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                await self.handle_server_message(data)
        except websockets.exceptions.ConnectionClosed:
            logger.info("Connection to FL server closed")
        except Exception as e:
            logger.error(f"Error listening for updates: {e}")
    
    async def handle_server_message(self, message: Dict[str, Any]):
        """Handle messages from the federated learning server."""
        msg_type = message.get("type")
        
        if msg_type == "global_model_update":
            await self.receive_global_model(message["model_data"])
        elif msg_type == "training_request":
            await self.perform_local_training(message["parameters"])
        elif msg_type == "evaluation_request":
            await self.evaluate_model(message["model_data"])
        elif msg_type == "aggregation_complete":
            await self.handle_aggregation_result(message)
        else:
            logger.warning(f"Unknown message type: {msg_type}")
    
    async def receive_global_model(self, model_data: str):
        """Receive and update local model with global model."""
        try:
            # Decode base64 encoded model
            model_bytes = base64.b64decode(model_data)
            self.local_model = pickle.loads(model_bytes)
            
            logger.info(f"Client {self.client_id} received global model update")
            
            # Evaluate global model on local data
            if self.local_data is not None:
                accuracy = self.evaluate_local_model()
                logger.info(f"Global model accuracy on local data: {accuracy:.4f}")
                
        except Exception as e:
            logger.error(f"Failed to receive global model: {e}")
    
    async def perform_local_training(self, parameters: Dict[str, Any]):
        """Perform local training and send updates to server."""
        try:
            if self.local_data is None or self.local_model is None:
                logger.warning("No local data or model available for training")
                return
            
            # Extract training parameters
            epochs = parameters.get("epochs", 1)
            learning_rate = parameters.get("learning_rate", 0.01)
            
            # Perform local training
            trained_model = self.train_local_model(epochs)
            
            # Add differential privacy noise
            if parameters.get("use_privacy", True):
                trained_model = self.add_privacy_noise(trained_model)
            
            # Serialize and encode model
            model_bytes = pickle.dumps(trained_model)
            model_data = base64.b64encode(model_bytes).decode('utf-8')
            
            # Calculate model hash for integrity
            model_hash = hashlib.sha256(model_bytes).hexdigest()
            
            # Send model update to server
            update_msg = {
                "type": "model_update",
                "client_id": self.client_id,
                "model_data": model_data,
                "model_hash": model_hash,
                "training_metrics": {
                    "local_accuracy": self.evaluate_local_model(),
                    "data_size": len(self.local_data),
                    "training_time": 1.5,  # Simulated
                    "privacy_budget_used": 0.1
                },
                "timestamp": datetime.now().isoformat()
            }
            
            await self.websocket.send(json.dumps(update_msg))
            logger.info(f"Client {self.client_id} sent model update to server")
            
        except Exception as e:
            logger.error(f"Failed to perform local training: {e}")
    
    def train_local_model(self, epochs: int = 1):
        """Train model on local data."""
        if self.local_data is None:
            return self.local_model
        
        # Simulate training (in real implementation, this would be actual ML training)
        X, y = self.local_data
        
        if self.local_model is None:
            self.local_model = RandomForestClassifier(n_estimators=10, random_state=42)
        
        # Train model
        self.local_model.fit(X, y)
        
        # Record training history
        self.training_history.append({
            "timestamp": datetime.now().isoformat(),
            "epochs": epochs,
            "accuracy": self.evaluate_local_model()
        })
        
        return self.local_model
    
    def evaluate_local_model(self) -> float:
        """Evaluate model on local data."""
        if self.local_data is None or self.local_model is None:
            return 0.0
        
        X, y = self.local_data
        predictions = self.local_model.predict(X)
        return accuracy_score(y, predictions)
    
    def add_privacy_noise(self, model):
        """Add differential privacy noise to model parameters."""
        # Simplified differential privacy implementation
        # In practice, this would use proper DP mechanisms
        
        if hasattr(model, 'feature_importances_'):
            # Add Laplace noise to feature importances
            noise_scale = 0.01
            noise = np.random.laplace(0, noise_scale, model.feature_importances_.shape)
            model.feature_importances_ += noise
            model.feature_importances_ = np.clip(model.feature_importances_, 0, None)
            model.feature_importances_ /= model.feature_importances_.sum()
        
        self.privacy_budget -= 0.1
        return model
    
    async def evaluate_model(self, model_data: str):
        """Evaluate a model sent by the server."""
        try:
            # Decode and load model
            model_bytes = base64.b64decode(model_data)
            model = pickle.loads(model_bytes)
            
            # Evaluate on local data
            if self.local_data is not None:
                X, y = self.local_data
                predictions = model.predict(X)
                accuracy = accuracy_score(y, predictions)
                
                # Send evaluation results
                eval_msg = {
                    "type": "evaluation_result",
                    "client_id": self.client_id,
                    "accuracy": accuracy,
                    "data_size": len(y),
                    "timestamp": datetime.now().isoformat()
                }
                
                await self.websocket.send(json.dumps(eval_msg))
                logger.info(f"Client {self.client_id} evaluated model: accuracy={accuracy:.4f}")
                
        except Exception as e:
            logger.error(f"Failed to evaluate model: {e}")
    
    async def handle_aggregation_result(self, message: Dict[str, Any]):
        """Handle aggregation completion notification."""
        round_number = message.get("round", 0)
        global_accuracy = message.get("global_accuracy", 0.0)
        participating_clients = message.get("participating_clients", 0)
        
        logger.info(f"FL Round {round_number} completed. Global accuracy: {global_accuracy:.4f}")
        logger.info(f"Participating clients: {participating_clients}")
        
        # Update contribution score
        if self.client_id in message.get("contributors", []):
            self.contribution_score += 1.0
    
    def load_local_data(self, data_path: str = None):
        """Load local training data."""
        # Simulate loading biodiversity data
        np.random.seed(hash(self.client_id) % 2**32)
        
        # Generate synthetic biodiversity data
        n_samples = np.random.randint(50, 200)
        n_features = 10
        
        X = np.random.randn(n_samples, n_features)
        y = np.random.randint(0, 5, n_samples)  # 5 species classes
        
        self.local_data = (X, y)
        logger.info(f"Client {self.client_id} loaded {n_samples} local samples")
    
    def get_client_stats(self) -> Dict[str, Any]:
        """Get client statistics."""
        return {
            "client_id": self.client_id,
            "data_size": len(self.local_data[1]) if self.local_data else 0,
            "training_rounds": len(self.training_history),
            "contribution_score": self.contribution_score,
            "privacy_budget_remaining": self.privacy_budget,
            "last_accuracy": self.training_history[-1]["accuracy"] if self.training_history else 0.0
        }

async def main():
    """Main function to run FL client."""
    client_id = f"biodiversity_client_{np.random.randint(1000, 9999)}"
    client = EnhancedFederatedLearningClient(client_id)
    
    # Load local data
    client.load_local_data()
    
    # Connect to server and start federated learning
    await client.connect_to_server()

if __name__ == "__main__":
    asyncio.run(main())
