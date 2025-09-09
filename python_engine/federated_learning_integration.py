# python_engine/federated_learning_integration.py
"""
Comprehensive Federated Learning Integration for BioMapper
Handles FL simulation, real-time updates, and biodiversity model training
"""

import json
import time
import random
import asyncio
import threading
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import websockets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FederatedLearningSimulator:
    """Simulates federated learning for biodiversity model training"""
    
    def __init__(self):
        self.participants = []
        self.global_model = None
        self.round_number = 0
        self.training_history = []
        self.is_running = False
        self.websocket_clients = set()
        
    def start_simulation(self, num_participants: int = 5, rounds: int = 10) -> Dict[str, Any]:
        """Start federated learning simulation"""
        if self.is_running:
            return {"error": "Simulation already running"}
        
        self.is_running = True
        self.participants = self._create_participants(num_participants)
        self.round_number = 0
        self.training_history = []
        
        # Start simulation in background thread
        simulation_thread = threading.Thread(
            target=self._run_simulation, 
            args=(rounds,),
            daemon=True
        )
        simulation_thread.start()
        
        return {
            "status": "started",
            "participants": len(self.participants),
            "total_rounds": rounds,
            "simulation_id": f"fl-sim-{int(time.time())}"
        }
    
    def _create_participants(self, num_participants: int) -> List[Dict[str, Any]]:
        """Create simulated FL participants"""
        participants = []
        regions = ["Western Ghats", "Himalayas", "Sundarbans", "Northeast India", "Deccan Plateau"]
        
        for i in range(num_participants):
            participant = {
                "id": f"participant_{i+1}",
                "name": f"Research Institute {i+1}",
                "region": regions[i % len(regions)],
                "data_size": random.randint(1000, 5000),
                "local_accuracy": random.uniform(0.7, 0.9),
                "privacy_budget": random.uniform(0.3, 0.8),
                "reputation_score": random.uniform(0.6, 1.0),
                "specialization": random.choice([
                    "Marine Biodiversity", "Forest Ecosystems", "Endemic Species", 
                    "Conservation Genetics", "Climate Adaptation"
                ])
            }
            participants.append(participant)
        
        return participants
    
    def _run_simulation(self, total_rounds: int):
        """Run the federated learning simulation"""
        logger.info(f"Starting FL simulation with {len(self.participants)} participants for {total_rounds} rounds")
        
        for round_num in range(1, total_rounds + 1):
            if not self.is_running:
                break
                
            self.round_number = round_num
            round_result = self._simulate_round(round_num)
            self.training_history.append(round_result)
            
            # Broadcast update to websocket clients
            self._broadcast_update(round_result)
            
            # Wait between rounds
            time.sleep(2)
        
        # Final results
        final_result = self._generate_final_results()
        self._broadcast_update(final_result)
        self.is_running = False
        
        logger.info("FL simulation completed")
    
    def _simulate_round(self, round_num: int) -> Dict[str, Any]:
        """Simulate a single FL round"""
        # Simulate local training for each participant
        local_updates = []
        for participant in self.participants:
            # Simulate training improvement
            improvement = random.uniform(0.01, 0.05)
            participant["local_accuracy"] = min(0.95, participant["local_accuracy"] + improvement)
            
            # Simulate privacy budget usage
            privacy_cost = random.uniform(0.05, 0.15)
            participant["privacy_budget"] = max(0.1, participant["privacy_budget"] - privacy_cost)
            
            local_update = {
                "participant_id": participant["id"],
                "local_accuracy": participant["local_accuracy"],
                "data_size": participant["data_size"],
                "privacy_cost": privacy_cost,
                "training_time": random.uniform(30, 120),  # seconds
                "contribution_weight": self._calculate_contribution_weight(participant)
            }
            local_updates.append(local_update)
        
        # Simulate global aggregation
        global_accuracy = self._calculate_global_accuracy(local_updates)
        convergence_score = self._calculate_convergence_score(local_updates)
        
        round_result = {
            "type": "round_update",
            "round_number": round_num,
            "timestamp": datetime.now().isoformat(),
            "global_accuracy": global_accuracy,
            "convergence_score": convergence_score,
            "participating_clients": len(local_updates),
            "local_updates": local_updates,
            "aggregation_time": random.uniform(5, 15),  # seconds
            "privacy_preservation": self._calculate_privacy_preservation(local_updates),
            "communication_efficiency": random.uniform(0.7, 0.95)
        }
        
        return round_result
    
    def _calculate_contribution_weight(self, participant: Dict[str, Any]) -> float:
        """Calculate participant's contribution weight"""
        base_weight = participant["data_size"] / 1000.0
        accuracy_bonus = max(0, participant["local_accuracy"] - 0.5) * 2.0
        reputation_factor = participant["reputation_score"]
        
        return max(0.1, min(2.0, base_weight * (1 + accuracy_bonus) * reputation_factor))
    
    def _calculate_global_accuracy(self, local_updates: List[Dict[str, Any]]) -> float:
        """Calculate global model accuracy"""
        total_weight = sum(update["contribution_weight"] for update in local_updates)
        weighted_accuracy = sum(
            update["local_accuracy"] * update["contribution_weight"] 
            for update in local_updates
        )
        return weighted_accuracy / total_weight if total_weight > 0 else 0.0
    
    def _calculate_convergence_score(self, local_updates: List[Dict[str, Any]]) -> float:
        """Calculate convergence score"""
        accuracies = [update["local_accuracy"] for update in local_updates]
        if not accuracies:
            return 0.0
        
        mean_accuracy = np.mean(accuracies)
        std_accuracy = np.std(accuracies)
        return 1.0 - (std_accuracy / mean_accuracy) if mean_accuracy > 0 else 0.0
    
    def _calculate_privacy_preservation(self, local_updates: List[Dict[str, Any]]) -> float:
        """Calculate privacy preservation score"""
        total_privacy_cost = sum(update["privacy_cost"] for update in local_updates)
        max_possible_cost = len(local_updates) * 0.2  # Assuming max 0.2 per participant
        return max(0.0, 1.0 - (total_privacy_cost / max_possible_cost))
    
    def _generate_final_results(self) -> Dict[str, Any]:
        """Generate final simulation results"""
        if not self.training_history:
            return {"error": "No training history available"}
        
        final_round = self.training_history[-1]
        initial_accuracy = self.training_history[0]["global_accuracy"] if self.training_history else 0.0
        final_accuracy = final_round["global_accuracy"]
        
        # Calculate improvement metrics
        accuracy_improvement = final_accuracy - initial_accuracy
        convergence_round = self._find_convergence_round()
        
        # Generate biodiversity insights
        biodiversity_insights = self._generate_biodiversity_insights()
        
        return {
            "type": "simulation_complete",
            "timestamp": datetime.now().isoformat(),
            "total_rounds": len(self.training_history),
            "performance_metrics": {
                "initial_accuracy": initial_accuracy,
                "final_accuracy": final_accuracy,
                "accuracy_improvement": accuracy_improvement,
                "convergence_round": convergence_round,
                "privacy_preservation": final_round["privacy_preservation"],
                "communication_efficiency": final_round["communication_efficiency"]
            },
            "participant_summary": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "region": p["region"],
                    "final_accuracy": p["local_accuracy"],
                    "total_contributions": len(self.training_history),
                    "specialization": p["specialization"]
                }
                for p in self.participants
            ],
            "biodiversity_insights": biodiversity_insights,
            "recommendations": [
                "Continue federated learning for improved model accuracy",
                "Implement differential privacy for enhanced data protection",
                "Expand participant network to include more regions",
                "Develop specialized models for different ecosystem types"
            ]
        }
    
    def _find_convergence_round(self) -> int:
        """Find the round where convergence was achieved"""
        if len(self.training_history) < 2:
            return 1
        
        for i in range(1, len(self.training_history)):
            current_accuracy = self.training_history[i]["global_accuracy"]
            previous_accuracy = self.training_history[i-1]["global_accuracy"]
            
            # Consider converged if improvement is less than 0.01
            if current_accuracy - previous_accuracy < 0.01:
                return i + 1
        
        return len(self.training_history)
    
    def _generate_biodiversity_insights(self) -> Dict[str, Any]:
        """Generate biodiversity insights from FL simulation"""
        return {
            "species_classification_improvement": f"{(random.uniform(5, 20)):.1f}%",
            "cross_region_patterns": "Identified via federated pattern recognition",
            "conservation_recommendations": [
                "Increase monitoring in low-data regions",
                "Enhance cross-institutional collaboration",
                "Implement privacy-preserving data sharing protocols",
                "Develop region-specific conservation strategies"
            ],
            "model_robustness": {
                "generalization_score": random.uniform(0.8, 0.95),
                "bias_reduction": f"{(random.uniform(10, 30)):.1f}%",
                "cross_validation_accuracy": random.uniform(0.85, 0.92)
            },
            "data_heterogeneity_analysis": {
                "regional_diversity_score": random.uniform(0.6, 0.9),
                "species_distribution_variance": random.uniform(0.3, 0.7),
                "ecosystem_representation": "Well-distributed across major Indian biomes"
            }
        }
    
    def _broadcast_update(self, update: Dict[str, Any]):
        """Broadcast update to all connected websocket clients"""
        if not self.websocket_clients:
            return
        
        message = json.dumps(update)
        disconnected_clients = set()
        
        for client in self.websocket_clients:
            try:
                asyncio.create_task(client.send(message))
            except Exception as e:
                logger.error(f"Failed to send update to client: {e}")
                disconnected_clients.add(client)
        
        # Remove disconnected clients
        self.websocket_clients -= disconnected_clients
    
    def get_status(self) -> Dict[str, Any]:
        """Get current simulation status"""
        return {
            "is_running": self.is_running,
            "round_number": self.round_number,
            "total_rounds": len(self.training_history),
            "participants": len(self.participants),
            "connected_clients": len(self.websocket_clients),
            "latest_accuracy": self.training_history[-1]["global_accuracy"] if self.training_history else 0.0
        }
    
    def stop_simulation(self):
        """Stop the current simulation"""
        self.is_running = False
        return {"status": "stopped"}

# Global FL simulator instance
fl_simulator = FederatedLearningSimulator()

def start_fl_simulation(num_participants: int = 5, rounds: int = 10) -> Dict[str, Any]:
    """Start federated learning simulation"""
    return fl_simulator.start_simulation(num_participants, rounds)

def get_fl_status() -> Dict[str, Any]:
    """Get FL simulation status"""
    return fl_simulator.get_status()

def stop_fl_simulation() -> Dict[str, Any]:
    """Stop FL simulation"""
    return fl_simulator.stop_simulation()

# WebSocket server for real-time updates
class FLWebSocketServer:
    """WebSocket server for real-time FL updates"""
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.server = None
    
    async def handle_client(self, websocket, path):
        """Handle WebSocket client connections"""
        fl_simulator.websocket_clients.add(websocket)
        logger.info(f"FL WebSocket client connected: {websocket.remote_address}")
        
        try:
            # Send current status
            status = fl_simulator.get_status()
            await websocket.send(json.dumps({
                "type": "status_update",
                "data": status
            }))
            
            # Keep connection alive
            async for message in websocket:
                data = json.loads(message)
                if data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            fl_simulator.websocket_clients.discard(websocket)
            logger.info(f"FL WebSocket client disconnected: {websocket.remote_address}")
    
    async def start_server(self):
        """Start the WebSocket server"""
        self.server = await websockets.serve(self.handle_client, self.host, self.port)
        logger.info(f"FL WebSocket server started on {self.host}:{self.port}")
        return self.server

# Global WebSocket server instance
fl_websocket_server = FLWebSocketServer()

async def start_fl_websocket_server():
    """Start the FL WebSocket server"""
    return await fl_websocket_server.start_server()

if __name__ == "__main__":
    # Handle command line arguments
    import sys
    
    if len(sys.argv) < 3:
        participants = 5
        rounds = 10
    else:
        participants = int(sys.argv[1])
        rounds = int(sys.argv[2])
    
    # Test FL simulation
    result = start_fl_simulation(num_participants=participants, rounds=rounds)
    print(json.dumps(result))
    
    # Keep running to see updates
    time.sleep(15)
    status = get_fl_status()
    print(json.dumps(status))
