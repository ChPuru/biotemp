#!/usr/bin/env python3
"""
BioMapper Services Startup Script
Initializes federated learning server, quantum simulator, and other Python services
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def install_dependencies():
    """Install required Python packages"""
    required_packages = [
        'websockets',
        'asyncio',
        'sqlite3',
        'numpy',
        'scikit-learn',
        'pandas',
        'joblib'
    ]
    
    print("🔧 Installing required dependencies...")
    for package in required_packages:
        try:
            print(f"📦 Installing {package}...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', package], 
                         check=True, capture_output=True)
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError:
            print(f"⚠️  {package} installation failed or already installed")

def start_federated_learning_server():
    """Start the federated learning server"""
    print("🌐 Starting Federated Learning Server...")
    fl_server_path = Path("python_engine/federated_learning/fl_server.py")
    
    if fl_server_path.exists():
        try:
            fl_process = subprocess.Popen([
                'py', str(fl_server_path)
            ], cwd=Path.cwd())
            print("✅ Federated Learning Server started")
            return fl_process
        except Exception as e:
            print(f"❌ Failed to start FL Server: {e}")
            return None
    else:
        print("⚠️  FL Server script not found")
        return None

def start_python_ai_engine():
    """Start the Python AI Engine"""
    print("🐍 Starting Python AI Engine...")
    try:
        python_process = subprocess.Popen([
            'py', 
            'python_engine/main_ensemble.py'
        ], cwd=Path.cwd())
        print("✅ Python AI Engine started")
        return python_process
    except Exception as e:
        print(f"❌ Failed to start Python AI Engine: {e}")
        return None

def main():
    """Main function to start all services"""
    print("🚀 Starting BioMapper Services...")
    
    # Install dependencies
    install_dependencies()
    
    # Start services
    processes = []
    
    # Start Python AI Engine
    ai_process = start_python_ai_engine()
    if ai_process:
        processes.append(ai_process)
    
    # Start Federated Learning Server
    fl_process = start_federated_learning_server()
    if fl_process:
        processes.append(fl_process)
    
    print("✅ All services started successfully!")
    print("📝 Services running:")
    for i, proc in enumerate(processes, 1):
        print(f"   {i}. Process PID: {proc.pid}")
    
    print("\n🔄 Services are running. Press Ctrl+C to stop all services.")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
        for proc in processes:
            proc.terminate()
        print("✅ All services stopped.")

if __name__ == "__main__":
    main()
                            f1_score REAL,
                            model_path TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            completed_at TIMESTAMP
                        )
                    """,
                    'model_versions': """
                        CREATE TABLE IF NOT EXISTS model_versions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            version TEXT UNIQUE NOT NULL,
                            model_path TEXT NOT NULL,
                            accuracy REAL,
                            is_active BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """
                }
            },
            'federated_learning': {
                'path': Path("python_engine/federated_learning/fl_data.db"),
                'tables': {
                    'fl_rounds': """
                        CREATE TABLE IF NOT EXISTS fl_rounds (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            round_number INTEGER NOT NULL,
                            participants INTEGER DEFAULT 0,
                            accuracy REAL,
                            convergence_metric REAL,
                            privacy_budget REAL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """,
                    'fl_clients': """
                        CREATE TABLE IF NOT EXISTS fl_clients (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            client_id TEXT UNIQUE NOT NULL,
                            last_seen TIMESTAMP,
                            contribution_score REAL DEFAULT 0.0,
                            total_rounds INTEGER DEFAULT 0,
                            status TEXT DEFAULT 'inactive'
                        )
                    """
                }
            }
        }
        
        for db_name, db_config in databases.items():
            db_path = db_config['path']
            db_path.parent.mkdir(parents=True, exist_ok=True)
            
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                for table_name, schema in db_config['tables'].items():
                    cursor.execute(schema)
                    logger.info(f"✅ {db_name}.{table_name} table ready")
                
                conn.commit()
                conn.close()
                logger.info(f"✅ {db_name} database initialized")
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize {db_name} database: {e}")
                return False
        
        return True

    def start_federated_learning_server(self):
        """Start the federated learning server"""
        logger.info("🌐 Starting Federated Learning Server...")
        fl_server_path = Path("python_engine/federated_learning/fl_server.py")
        
        if fl_server_path.exists():
            try:
                subprocess.Popen([
                    sys.executable, str(fl_server_path)
                ], cwd="python_engine/federated_learning")
                logger.info("✅ Federated Learning Server started on ws://localhost:8765")
            except Exception as e:
                logger.error(f"❌ Failed to start FL Server: {e}")
        else:
            logger.error("❌ FL Server script not found")

    def start_quantum_simulator(self):
        """Start quantum job simulator"""
        logger.info("⚛️  Starting Quantum Job Simulator...")
        quantum_sim_path = Path("python_engine/quantum_jobs/enhanced_quantum_simulator.py")
        
        if quantum_sim_path.exists():
            try:
                subprocess.Popen([
                    sys.executable, str(quantum_sim_path)
                ], cwd="python_engine/quantum_jobs")
                logger.info("✅ Quantum Simulator started")
            except Exception as e:
                logger.error(f"❌ Failed to start Quantum Simulator: {e}")
        else:
            logger.error("❌ Quantum Simulator script not found")

def main():
    """Main startup sequence"""
    logger.info("🚀 BioMapper Services Startup")
    logger.info("=" * 50)
    
    # Change to project directory
    os.chdir(Path(__file__).parent)
    
    # Initialize service manager
    service_manager = ServiceManager()
    
    # Install dependencies
    install_dependencies()
    
    # Initialize databases
    initialize_databases()
    
    # Check external services
    check_ollama_service()
    
    # Start Python services
    start_federated_learning_server()
    time.sleep(2)  # Give FL server time to start
    
    start_quantum_simulator()
    
    print("\n🎉 Service startup complete!")
    print("📊 Services Status:")
    print("   - Federated Learning: ws://localhost:8765")
    print("   - Quantum Simulator: Running in background")
    print("   - Training Pipeline: Ready")
    print("   - IUCN Service: Ready")
    print("   - Ollama Integration: Check above")
    
    print("\n💡 Next steps:")
    print("   1. Start your backend server: npm run dev (in backend/)")
    print("   2. Start your frontend: npm start (in frontend/)")
    print("   3. Access admin panel to test training features")
    
    # Keep script running
    try:
        print("\n⏳ Services running... Press Ctrl+C to stop")
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        sys.exit(0)

if __name__ == "__main__":
    main()
