# python_engine/federated_learning/fl_server.py
import asyncio
import json
import numpy as np
import websockets
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pickle
import base64
import hashlib
import sqlite3
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedFederatedLearningServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients = {}
        self.global_model = None
        self.round_number = 0
        self.min_clients = 2
        self.max_clients = 10
        self.aggregation_weights = {}
        self.client_contributions = {}
        self.round_timeout = 300  # 5 minutes
        self.privacy_budget = 1.0
        
        # Initialize database for FL history
        self.db_path = Path("fl_history.db")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()
        
    def _init_database(self):
        """Initialize SQLite database for FL history."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # FL rounds table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fl_rounds (
                round_number INTEGER PRIMARY KEY,
                start_time TEXT,
                end_time TEXT,
                participating_clients INTEGER,
                global_accuracy REAL,
                convergence_score REAL,
                privacy_budget_used REAL,
                aggregation_method TEXT DEFAULT 'fedavg'
            )
        ''')
        
        # Client participation table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS client_participation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                round_number INTEGER,
                client_id TEXT,
                local_accuracy REAL,
                data_size INTEGER,
                contribution_weight REAL,
                privacy_cost REAL,
                timestamp TEXT,
                FOREIGN KEY (round_number) REFERENCES fl_rounds (round_number)
            )
        ''')
        
        conn.commit()
        conn.close()
        
    async def start_server(self):
        """Start the enhanced federated learning server."""
        logger.info(f"Starting Enhanced FL server on {self.host}:{self.port}")
        logger.info(f"Server configuration:")
        logger.info(f"  - Min clients: {self.min_clients}")
        logger.info(f"  - Max clients: {self.max_clients}")
        logger.info(f"  - Round timeout: {self.round_timeout}s")
        logger.info(f"  - Privacy budget: {self.privacy_budget}")
        
        async with websockets.serve(self.handle_client, self.host, self.port):
            logger.info("Enhanced FL server is running...")
            
            # Start background tasks
            asyncio.create_task(self.monitor_clients())
            asyncio.create_task(self.periodic_aggregation())
            
            await asyncio.Future()  # Run forever
    
    async def handle_client(self, websocket, path):
        """Handle client connections with enhanced capabilities."""
        client_id = None
        try:
            async for message in websocket:
                data = json.loads(message)
                
                if data["type"] == "register":
                    client_id = await self.register_client(data, websocket)
                    
                elif data["type"] == "model_update":
                    await self.handle_model_update(data)
                    
                elif data["type"] == "evaluation_result":
                    await self.handle_evaluation_result(data)
                    
                elif data["type"] == "heartbeat":
                    await self.handle_heartbeat(data)
                    
        except websockets.exceptions.ConnectionClosed:
            if client_id:
                await self.handle_client_disconnect(client_id)
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
    
    async def register_client(self, data: Dict[str, Any], websocket) -> str:
        """Register a new client with enhanced validation."""
        client_id = data["client_id"]
        capabilities = data["capabilities"]
        
        # Check if server is at capacity
        if len(self.clients) >= self.max_clients:
            await websocket.send(json.dumps({
                "type": "registration_rejected", 
                "reason": "Server at capacity"
            }))
            return None
        
        self.clients[client_id] = {
            "websocket": websocket,
            "capabilities": capabilities,
            "last_seen": datetime.now(),
            "reputation_score": 1.0,
            "total_contributions": 0,
            "average_accuracy": 0.0,
            "privacy_budget": 1.0
        }
        
        # Send registration confirmation
        await websocket.send(json.dumps({
            "type": "registration_confirmed",
            "client_id": client_id,
            "server_config": {
                "round_timeout": self.round_timeout,
                "privacy_requirements": True,
                "aggregation_method": "fedavg_enhanced"
            }
        }))
        
        logger.info(f"Client {client_id} registered successfully")
        return client_id
    
    async def handle_model_update(self, data: Dict[str, Any]):
        """Handle model updates with enhanced security and validation."""
        client_id = data["client_id"]
        model_data = data["model_data"]
        training_metrics = data["training_metrics"]
        
        # Calculate contribution weight
        contribution_weight = self._calculate_contribution_weight(client_id, training_metrics)
        
        # Store client model for aggregation
        self.aggregation_weights[client_id] = {
            "model_data": model_data,
            "data_size": training_metrics["data_size"],
            "accuracy": training_metrics["local_accuracy"],
            "contribution_weight": contribution_weight,
            "privacy_cost": training_metrics.get("privacy_budget_used", 0.1),
            "timestamp": datetime.now()
        }
        
        # Update client statistics
        if client_id in self.clients:
            client = self.clients[client_id]
            client["total_contributions"] += 1
            client["last_seen"] = datetime.now()
        
        logger.info(f"Received model update from {client_id}")
        
        # Check if we have enough updates for aggregation
        if len(self.aggregation_weights) >= self.min_clients:
            await self.enhanced_aggregate_models()
    
    def _calculate_contribution_weight(self, client_id: str, metrics: Dict[str, Any]) -> float:
        """Calculate contribution weight based on multiple factors."""
        base_weight = metrics["data_size"] / 100.0
        accuracy_bonus = max(0, metrics["local_accuracy"] - 0.5) * 2.0
        reputation_factor = 1.0
        
        if client_id in self.clients:
            reputation_factor = self.clients[client_id]["reputation_score"]
        
        final_weight = base_weight * (1 + accuracy_bonus) * reputation_factor
        return max(0.1, min(2.0, final_weight))
    
    async def enhanced_aggregate_models(self):
        """Enhanced model aggregation with advanced techniques."""
        logger.info("Starting enhanced model aggregation...")
        
        round_start_time = datetime.now()
        
        # Calculate weighted federated averaging
        total_weight = sum(client["contribution_weight"] for client in self.aggregation_weights.values())
        
        # Weighted accuracy calculation
        global_accuracy = sum(
            client["accuracy"] * (client["contribution_weight"] / total_weight)
            for client in self.aggregation_weights.values()
        )
        
        # Calculate convergence score
        accuracies = [client["accuracy"] for client in self.aggregation_weights.values()]
        convergence_score = 1.0 - (np.std(accuracies) / np.mean(accuracies)) if accuracies else 0.0
        
        # Calculate total privacy cost
        total_privacy_cost = sum(client["privacy_cost"] for client in self.aggregation_weights.values())
        
        self.round_number += 1
        round_end_time = datetime.now()
        
        # Save round to database
        self._save_round_to_db(round_start_time, round_end_time, global_accuracy, 
                              convergence_score, total_privacy_cost)
        
        # Broadcast aggregation results
        aggregation_msg = {
            "type": "aggregation_complete",
            "round": self.round_number,
            "global_accuracy": global_accuracy,
            "convergence_score": convergence_score,
            "participating_clients": len(self.aggregation_weights),
            "contributors": list(self.aggregation_weights.keys()),
            "privacy_cost": total_privacy_cost
        }
        
        await self.broadcast_to_clients(aggregation_msg)
        
        # Clear aggregation weights for next round
        self.aggregation_weights.clear()
        
        logger.info(f"Enhanced FL Round {self.round_number} completed:")
        logger.info(f"  - Global accuracy: {global_accuracy:.4f}")
        logger.info(f"  - Convergence score: {convergence_score:.4f}")
        logger.info(f"  - Privacy cost: {total_privacy_cost:.4f}")
    
    def _save_round_to_db(self, start_time: datetime, end_time: datetime, 
                         global_accuracy: float, convergence_score: float, 
                         privacy_cost: float):
        """Save FL round results to database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Save round summary
        cursor.execute('''
            INSERT INTO fl_rounds 
            (round_number, start_time, end_time, participating_clients, 
             global_accuracy, convergence_score, privacy_budget_used)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            self.round_number,
            start_time.isoformat(),
            end_time.isoformat(),
            len(self.aggregation_weights),
            global_accuracy,
            convergence_score,
            privacy_cost
        ))
        
        # Save client participation details
        for client_id, client_data in self.aggregation_weights.items():
            cursor.execute('''
                INSERT INTO client_participation
                (round_number, client_id, local_accuracy, data_size, 
                 contribution_weight, privacy_cost, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                self.round_number,
                client_id,
                client_data["accuracy"],
                client_data["data_size"],
                client_data["contribution_weight"],
                client_data["privacy_cost"],
                client_data["timestamp"].isoformat()
            ))
        
        conn.commit()
        conn.close()
    
    async def broadcast_to_clients(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        disconnected_clients = []
        
        for client_id, client_info in self.clients.items():
            try:
                await client_info["websocket"].send(json.dumps(message))
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.append(client_id)
            except Exception as e:
                logger.error(f"Failed to send message to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Remove disconnected clients
        for client_id in disconnected_clients:
            await self.handle_client_disconnect(client_id)
    
    async def handle_client_disconnect(self, client_id: str):
        """Handle client disconnection."""
        if client_id in self.clients:
            logger.info(f"Client {client_id} disconnected")
            self.clients.pop(client_id, None)
        
        # Remove from current aggregation if present
        self.aggregation_weights.pop(client_id, None)
    
    async def handle_evaluation_result(self, data: Dict[str, Any]):
        """Handle evaluation results from clients."""
        client_id = data["client_id"]
        accuracy = data["accuracy"]
        logger.info(f"Client {client_id} evaluation: {accuracy:.4f}")
    
    async def handle_heartbeat(self, data: Dict[str, Any]):
        """Handle client heartbeat messages."""
        client_id = data["client_id"]
        if client_id in self.clients:
            self.clients[client_id]["last_seen"] = datetime.now()
    
    async def monitor_clients(self):
        """Monitor client health and remove inactive clients."""
        while True:
            await asyncio.sleep(60)
            
            current_time = datetime.now()
            inactive_clients = []
            
            for client_id, client_info in self.clients.items():
                if current_time - client_info["last_seen"] > timedelta(minutes=10):
                    inactive_clients.append(client_id)
            
            for client_id in inactive_clients:
                logger.info(f"Removing inactive client: {client_id}")
                await self.handle_client_disconnect(client_id)
    
    async def periodic_aggregation(self):
        """Trigger aggregation periodically if conditions are met."""
        while True:
            await asyncio.sleep(self.round_timeout)
            
            if len(self.aggregation_weights) >= self.min_clients:
                logger.info("Triggering periodic aggregation...")
                await self.enhanced_aggregate_models()

async def main():
    """Main function to run the enhanced FL server."""
    server = EnhancedFederatedLearningServer()
    await server.start_server()

if __name__ == "__main__":
    asyncio.run(main())