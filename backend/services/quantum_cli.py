#!/usr/bin/env python3
# backend/services/quantum_cli.py

import sys
import json
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

from quantum_service import quantum_service

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python quantum_cli.py <command> [args...]"
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "submit":
            if len(sys.argv) < 4:
                print(json.dumps({
                    "success": False,
                    "error": "Usage: python quantum_cli.py submit <algorithm> <parameters_json>"
                }))
                sys.exit(1)
            
            algorithm = sys.argv[2]
            parameters = json.loads(sys.argv[3])
            
            result = quantum_service.submit_quantum_job(algorithm, parameters)
            print(json.dumps(result))
            
        elif command == "execute":
            if len(sys.argv) < 3:
                print(json.dumps({
                    "success": False,
                    "error": "Usage: python quantum_cli.py execute <job_id>"
                }))
                sys.exit(1)
            
            job_id = sys.argv[2]
            result = quantum_service.execute_quantum_job(job_id)
            print(json.dumps(result))
            
        elif command == "status":
            if len(sys.argv) < 3:
                print(json.dumps({
                    "success": False,
                    "error": "Usage: python quantum_cli.py status <job_id>"
                }))
                sys.exit(1)
            
            job_id = sys.argv[2]
            result = quantum_service.get_job_status(job_id)
            print(json.dumps(result))
            
        elif command == "list":
            result = quantum_service.list_jobs()
            print(json.dumps(result))
            
        elif command == "algorithms":
            result = quantum_service.get_available_algorithms()
            print(json.dumps(result))
            
        else:
            print(json.dumps({
                "success": False,
                "error": f"Unknown command: {command}. Available: submit, execute, status, list, algorithms"
            }))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
