# backend/services/federated_learning_service.py

import sys
import os
import json
import asyncio
import subprocess
import threading
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# Add python_engine to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../python_engine'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FederatedLearningService:
    def __init__(self):
        self.fl_server_process = None
        self.fl_clients = []
        self.server_running = False
        self.client_processes = []
        self.fl_rounds = []
        self.current_round = 0
        
    def start_fl_server(self, host: str = "localhost", port: int = 8765) -> Dict[str, Any]:
        """Start the federated learning server."""
        try:
            if self.server_running:
                return {
                    "success": False,
                    "error": "FL server is already running"
                }
            
            # Start FL server process
            server_script = os.path.join(os.path.dirname(__file__), '../../python_engine/federated_learning/fl_server.py')
            
            self.fl_server_process = subprocess.Popen(
                ['python', server_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait a moment for server to start
            time.sleep(2)
            
            if self.fl_server_process.poll() is None:
                self.server_running = True
                logger.info(f"FL server started on {host}:{port}")
                
                return {
                    "success": True,
                    "message": f"FL server started on {host}:{port}",
                    "pid": self.fl_server_process.pid
                }
            else:
                stdout, stderr = self.fl_server_process.communicate()
                return {
                    "success": False,
                    "error": f"Failed to start FL server: {stderr}"
                }
                
        except Exception as e:
            logger.error(f"Error starting FL server: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def stop_fl_server(self) -> Dict[str, Any]:
        """Stop the federated learning server."""
        try:
            if not self.server_running or self.fl_server_process is None:
                return {
                    "success": False,
                    "error": "FL server is not running"
                }
            
            # Terminate server process
            self.fl_server_process.terminate()
            self.fl_server_process.wait(timeout=5)
            
            self.server_running = False
            self.fl_server_process = None
            
            logger.info("FL server stopped")
            
            return {
                "success": True,
                "message": "FL server stopped successfully"
            }
            
        except Exception as e:
            logger.error(f"Error stopping FL server: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def start_fl_client(self, client_id: str = None) -> Dict[str, Any]:
        """Start a federated learning client."""
        try:
            if not self.server_running:
                return {
                    "success": False,
                    "error": "FL server is not running. Start server first."
                }
            
            if client_id is None:
                client_id = f"biodiversity_client_{int(time.time())}"
            
            # Start FL client process
            client_script = os.path.join(os.path.dirname(__file__), '../../python_engine/federated_learning/enhanced_fl_client.py')
            
            client_process = subprocess.Popen(
                ['python', client_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env={**os.environ, 'CLIENT_ID': client_id}
            )
            
            self.client_processes.append({
                "process": client_process,
                "client_id": client_id,
                "started_at": datetime.now().isoformat()
            })
            
            logger.info(f"FL client {client_id} started")
            
            return {
                "success": True,
                "message": f"FL client {client_id} started",
                "client_id": client_id,
                "pid": client_process.pid
            }
            
        except Exception as e:
            logger.error(f"Error starting FL client: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def stop_all_clients(self) -> Dict[str, Any]:
        """Stop all federated learning clients."""
        try:
            stopped_clients = []
            
            for client_info in self.client_processes:
                try:
                    client_info["process"].terminate()
                    client_info["process"].wait(timeout=3)
                    stopped_clients.append(client_info["client_id"])
                except Exception as e:
                    logger.warning(f"Error stopping client {client_info['client_id']}: {e}")
            
            self.client_processes.clear()
            
            logger.info(f"Stopped {len(stopped_clients)} FL clients")
            
            return {
                "success": True,
                "message": f"Stopped {len(stopped_clients)} FL clients",
                "stopped_clients": stopped_clients
            }
            
        except Exception as e:
            logger.error(f"Error stopping FL clients: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_fl_status(self) -> Dict[str, Any]:
        """Get federated learning system status."""
        try:
            # Check server status
            server_status = "running" if self.server_running else "stopped"
            
            # Check client statuses
            active_clients = []
            for client_info in self.client_processes:
                if client_info["process"].poll() is None:
                    active_clients.append({
                        "client_id": client_info["client_id"],
                        "pid": client_info["process"].pid,
                        "started_at": client_info["started_at"],
                        "status": "active"
                    })
                else:
                    active_clients.append({
                        "client_id": client_info["client_id"],
                        "status": "stopped"
                    })
            
            return {
                "success": True,
                "server_status": server_status,
                "active_clients": len([c for c in active_clients if c["status"] == "active"]),
                "total_clients": len(active_clients),
                "clients": active_clients,
                "fl_rounds": len(self.fl_rounds),
                "current_round": self.current_round
            }
            
        except Exception as e:
            logger.error(f"Error getting FL status: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def simulate_fl_round(self, num_clients: int = 3) -> Dict[str, Any]:
        """Simulate a federated learning round."""
        try:
            if not self.server_running:
                return {
                    "success": False,
                    "error": "FL server is not running"
                }
            
            # Simulate FL round
            round_data = {
                "round_number": self.current_round + 1,
                "start_time": datetime.now().isoformat(),
                "participating_clients": num_clients,
                "simulation": True
            }
            
            # Simulate training process
            time.sleep(2)  # Simulate training time
            
            # Generate simulated results
            round_data.update({
                "end_time": datetime.now().isoformat(),
                "global_accuracy": 0.75 + (self.current_round * 0.05) + (0.1 * (0.5 - abs(0.5 - (self.current_round % 10) / 10))),
                "convergence_score": 0.8 + (self.current_round * 0.02),
                "privacy_cost": 0.1 * num_clients,
                "client_contributions": [
                    {
                        "client_id": f"client_{i}",
                        "local_accuracy": 0.7 + (i * 0.05) + (0.1 * (0.5 - abs(0.5 - (self.current_round % 10) / 10))),
                        "data_size": 50 + (i * 25),
                        "contribution_weight": 0.8 + (i * 0.1)
                    }
                    for i in range(num_clients)
                ]
            })
            
            self.fl_rounds.append(round_data)
            self.current_round += 1
            
            logger.info(f"Simulated FL round {round_data['round_number']} completed")
            
            return {
                "success": True,
                "round_data": round_data
            }
            
        except Exception as e:
            logger.error(f"Error simulating FL round: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_fl_history(self) -> Dict[str, Any]:
        """Get federated learning history."""
        try:
            return {
                "success": True,
                "fl_rounds": self.fl_rounds,
                "total_rounds": len(self.fl_rounds),
                "average_accuracy": sum(round_data.get("global_accuracy", 0) for round_data in self.fl_rounds) / len(self.fl_rounds) if self.fl_rounds else 0,
                "convergence_trend": [round_data.get("convergence_score", 0) for round_data in self.fl_rounds]
            }
        except Exception as e:
            logger.error(f"Error getting FL history: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def reset_fl_system(self) -> Dict[str, Any]:
        """Reset the federated learning system."""
        try:
            # Stop all clients
            self.stop_all_clients()
            
            # Stop server
            if self.server_running:
                self.stop_fl_server()
            
            # Reset data
            self.fl_rounds.clear()
            self.current_round = 0
            
            logger.info("FL system reset")
            
            return {
                "success": True,
                "message": "FL system reset successfully"
            }
            
        except Exception as e:
            logger.error(f"Error resetting FL system: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Global FL service instance
fl_service = FederatedLearningService()
