# backend/services/quantum_service.py

import sys
import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# Add python_engine to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../python_engine'))

from quantum_jobs.enhanced_quantum_simulator import EnhancedQuantumSimulator, QuantumAlgorithm, QuantumJob

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuantumService:
    def __init__(self):
        self.simulator = EnhancedQuantumSimulator(max_qubits=20)
        self.active_jobs = {}
        self.job_history = []
        
    def submit_quantum_job(self, algorithm: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a quantum job for execution."""
        try:
            # Convert string to enum
            algorithm_enum = QuantumAlgorithm(algorithm)
            
            # Submit job to simulator
            job_id = self.simulator.submit_job(algorithm_enum, parameters)
            
            # Store job info
            job_info = {
                "job_id": job_id,
                "algorithm": algorithm,
                "parameters": parameters,
                "status": "submitted",
                "submitted_at": datetime.now().isoformat(),
                "result": None,
                "error": None
            }
            
            self.active_jobs[job_id] = job_info
            
            logger.info(f"Quantum job {job_id} submitted: {algorithm}")
            
            return {
                "success": True,
                "job_id": job_id,
                "message": f"Quantum {algorithm} job submitted successfully"
            }
            
        except ValueError as e:
            return {
                "success": False,
                "error": f"Invalid algorithm: {algorithm}. Available: {[alg.value for alg in QuantumAlgorithm]}"
            }
        except Exception as e:
            logger.error(f"Error submitting quantum job: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def execute_quantum_job(self, job_id: str) -> Dict[str, Any]:
        """Execute a quantum job."""
        try:
            if job_id not in self.active_jobs:
                return {
                    "success": False,
                    "error": "Job not found"
                }
            
            # Execute job in simulator
            result = self.simulator.execute_job(job_id)
            
            # Update job info
            job_info = self.active_jobs[job_id]
            job_info["status"] = "completed" if result.get("success") else "failed"
            job_info["result"] = result.get("result")
            job_info["error"] = result.get("error")
            job_info["completed_at"] = datetime.now().isoformat()
            
            # Move to history
            self.job_history.append(job_info)
            del self.active_jobs[job_id]
            
            logger.info(f"Quantum job {job_id} executed: {job_info['status']}")
            
            return {
                "success": True,
                "job_id": job_id,
                "status": job_info["status"],
                "result": job_info["result"],
                "error": job_info["error"]
            }
            
        except Exception as e:
            logger.error(f"Error executing quantum job {job_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get status of a quantum job."""
        try:
            # Check active jobs
            if job_id in self.active_jobs:
                return {
                    "success": True,
                    "job_info": self.active_jobs[job_id]
                }
            
            # Check job history
            for job in self.job_history:
                if job["job_id"] == job_id:
                    return {
                        "success": True,
                        "job_info": job
                    }
            
            return {
                "success": False,
                "error": "Job not found"
            }
            
        except Exception as e:
            logger.error(f"Error getting job status {job_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def list_jobs(self) -> Dict[str, Any]:
        """List all quantum jobs."""
        try:
            return {
                "success": True,
                "active_jobs": list(self.active_jobs.values()),
                "job_history": self.job_history[-10:],  # Last 10 jobs
                "total_active": len(self.active_jobs),
                "total_completed": len(self.job_history)
            }
        except Exception as e:
            logger.error(f"Error listing jobs: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_available_algorithms(self) -> Dict[str, Any]:
        """Get list of available quantum algorithms."""
        try:
            algorithms = [
                {
                    "name": alg.value,
                    "description": self._get_algorithm_description(alg),
                    "use_cases": self._get_algorithm_use_cases(alg)
                }
                for alg in QuantumAlgorithm
            ]
            
            return {
                "success": True,
                "algorithms": algorithms
            }
        except Exception as e:
            logger.error(f"Error getting algorithms: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_algorithm_description(self, algorithm: QuantumAlgorithm) -> str:
        """Get description for quantum algorithm."""
        descriptions = {
            QuantumAlgorithm.GROVER_SEARCH: "Quantum search algorithm for finding items in unsorted databases with quadratic speedup",
            QuantumAlgorithm.QUANTUM_ANNEALING: "Optimization algorithm for finding global minima in complex energy landscapes",
            QuantumAlgorithm.VARIATIONAL_QUANTUM_EIGENSOLVER: "Hybrid quantum-classical algorithm for finding ground state energies of molecules",
            QuantumAlgorithm.QUANTUM_APPROXIMATE_OPTIMIZATION: "Approximate optimization algorithm for combinatorial problems",
            QuantumAlgorithm.QUANTUM_MACHINE_LEARNING: "Quantum algorithms for machine learning tasks with potential quantum advantage"
        }
        return descriptions.get(algorithm, "Quantum algorithm for computational tasks")
    
    def _get_algorithm_use_cases(self, algorithm: QuantumAlgorithm) -> List[str]:
        """Get use cases for quantum algorithm."""
        use_cases = {
            QuantumAlgorithm.GROVER_SEARCH: [
                "Biodiversity database search",
                "Species identification",
                "Pattern matching in genetic sequences"
            ],
            QuantumAlgorithm.QUANTUM_ANNEALING: [
                "Habitat optimization",
                "Species distribution modeling",
                "Conservation planning"
            ],
            QuantumAlgorithm.VARIATIONAL_QUANTUM_EIGENSOLVER: [
                "Molecular structure analysis",
                "Protein folding prediction",
                "Drug discovery"
            ],
            QuantumAlgorithm.QUANTUM_APPROXIMATE_OPTIMIZATION: [
                "Biodiversity conservation optimization",
                "Resource allocation",
                "Network optimization"
            ],
            QuantumAlgorithm.QUANTUM_MACHINE_LEARNING: [
                "Species classification",
                "Biodiversity pattern recognition",
                "Ecological modeling"
            ]
        }
        return use_cases.get(algorithm, ["General quantum computation"])

# Global quantum service instance
quantum_service = QuantumService()
