#!/usr/bin/env python3
# backend/services/fl_cli.py

import sys
import json
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

from federated_learning_service import fl_service

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python fl_cli.py <command> [args...]"
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "start_server":
            host = sys.argv[2] if len(sys.argv) > 2 else "localhost"
            port = int(sys.argv[3]) if len(sys.argv) > 3 else 8765
            
            result = fl_service.start_fl_server(host, port)
            print(json.dumps(result))
            
        elif command == "stop_server":
            result = fl_service.stop_fl_server()
            print(json.dumps(result))
            
        elif command == "start_client":
            client_id = sys.argv[2] if len(sys.argv) > 2 else None
            result = fl_service.start_fl_client(client_id)
            print(json.dumps(result))
            
        elif command == "stop_clients":
            result = fl_service.stop_all_clients()
            print(json.dumps(result))
            
        elif command == "status":
            result = fl_service.get_fl_status()
            print(json.dumps(result))
            
        elif command == "simulate_round":
            num_clients = int(sys.argv[2]) if len(sys.argv) > 2 else 3
            result = fl_service.simulate_fl_round(num_clients)
            print(json.dumps(result))
            
        elif command == "history":
            result = fl_service.get_fl_history()
            print(json.dumps(result))
            
        elif command == "reset":
            result = fl_service.reset_fl_system()
            print(json.dumps(result))
            
        else:
            print(json.dumps({
                "success": False,
                "error": f"Unknown command: {command}. Available: start_server, stop_server, start_client, stop_clients, status, simulate_round, history, reset"
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
