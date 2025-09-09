#!/usr/bin/env python3
"""
BioMapper Platform - Complete Service Startup Script
Starts all required services for the BioMapper biodiversity intelligence platform
"""

import os
import sys
import subprocess
import time
import signal
import threading
from pathlib import Path

class BioMapperServiceManager:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.processes = []
        self.running = True
        
    def log(self, message, level="INFO"):
        """Enhanced logging with timestamps"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def check_dependencies(self):
        """Check if required dependencies are installed"""
        self.log("🔍 Checking system dependencies...")
        
        # Check Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ Node.js: {result.stdout.strip()}")
            else:
                self.log("❌ Node.js not found", "ERROR")
                return False
        except FileNotFoundError:
            self.log("❌ Node.js not found", "ERROR")
            return False
            
        # Check Python
        try:
            result = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
            self.log(f"✅ Python: {result.stdout.strip()}")
        except Exception as e:
            self.log(f"❌ Python check failed: {e}", "ERROR")
            return False
            
        # Check npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ npm: {result.stdout.strip()}")
            else:
                self.log("❌ npm not found", "ERROR")
                return False
        except FileNotFoundError:
            self.log("❌ npm not found", "ERROR")
            return False
            
        # Check Docker (optional)
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ Docker: {result.stdout.strip()}")
            else:
                self.log("⚠️  Docker not available (Parabricks features will be limited)", "WARN")
        except FileNotFoundError:
            self.log("⚠️  Docker not available (Parabricks features will be limited)", "WARN")
            
        # Check Conda (optional)
        try:
            result = subprocess.run(['conda', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ Conda: {result.stdout.strip()}")
            else:
                self.log("⚠️  Conda not available (QIIME2 features will be limited)", "WARN")
        except FileNotFoundError:
            self.log("⚠️  Conda not available (QIIME2 features will be limited)", "WARN")
            
        return True
        
    def install_dependencies(self):
        """Install Node.js and Python dependencies"""
        self.log("📦 Installing dependencies...")
        
        # Install backend dependencies
        backend_dir = self.base_dir / "backend"
        if backend_dir.exists():
            self.log("Installing backend dependencies...")
            try:
                result = subprocess.run(['npm', 'install'], 
                                      cwd=backend_dir, 
                                      capture_output=True, 
                                      text=True)
                if result.returncode == 0:
                    self.log("✅ Backend dependencies installed")
                else:
                    self.log(f"❌ Backend dependency installation failed: {result.stderr}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Backend dependency installation error: {e}", "ERROR")
                return False
        
        # Install frontend dependencies
        frontend_dir = self.base_dir / "frontend"
        if frontend_dir.exists():
            self.log("Installing frontend dependencies...")
            try:
                result = subprocess.run(['npm', 'install'], 
                                      cwd=frontend_dir, 
                                      capture_output=True, 
                                      text=True)
                if result.returncode == 0:
                    self.log("✅ Frontend dependencies installed")
                else:
                    self.log(f"❌ Frontend dependency installation failed: {result.stderr}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Frontend dependency installation error: {e}", "ERROR")
                return False
        
        # Install Python dependencies
        python_engine_dir = self.base_dir / "python_engine"
        requirements_file = python_engine_dir / "requirements.txt"
        if requirements_file.exists():
            self.log("Installing Python dependencies...")
            try:
                result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)], 
                                      capture_output=True, 
                                      text=True)
                if result.returncode == 0:
                    self.log("✅ Python dependencies installed")
                else:
                    self.log(f"❌ Python dependency installation failed: {result.stderr}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Python dependency installation error: {e}", "ERROR")
                return False
                
        return True
        
    def check_environment_files(self):
        """Check if environment files exist and create templates if needed"""
        self.log("🔧 Checking environment configuration...")
        
        # Backend .env
        backend_env = self.base_dir / "backend" / ".env"
        backend_env_example = self.base_dir / "backend" / ".env.example"
        
        if not backend_env.exists() and backend_env_example.exists():
            self.log("Creating backend .env from template...")
            try:
                with open(backend_env_example, 'r') as src, open(backend_env, 'w') as dst:
                    dst.write(src.read())
                self.log("✅ Backend .env created from template")
            except Exception as e:
                self.log(f"❌ Failed to create backend .env: {e}", "ERROR")
                
        # Frontend .env
        frontend_env = self.base_dir / "frontend" / ".env"
        frontend_env_example = self.base_dir / "frontend" / ".env.example"
        
        if not frontend_env.exists() and frontend_env_example.exists():
            self.log("Creating frontend .env from template...")
            try:
                with open(frontend_env_example, 'r') as src, open(frontend_env, 'w') as dst:
                    dst.write(src.read())
                self.log("✅ Frontend .env created from template")
            except Exception as e:
                self.log(f"❌ Failed to create frontend .env: {e}", "ERROR")
                
    def start_service(self, name, command, cwd, delay=0):
        """Start a service with proper error handling"""
        if delay > 0:
            self.log(f"⏳ Waiting {delay}s before starting {name}...")
            time.sleep(delay)
            
        self.log(f"🚀 Starting {name}...")
        try:
            if os.name == 'nt':  # Windows
                process = subprocess.Popen(command, 
                                         cwd=cwd, 
                                         shell=True,
                                         creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            else:  # Unix/Linux/macOS
                process = subprocess.Popen(command, 
                                         cwd=cwd, 
                                         shell=True,
                                         preexec_fn=os.setsid)
            
            self.processes.append((name, process))
            self.log(f"✅ {name} started (PID: {process.pid})")
            return process
            
        except Exception as e:
            self.log(f"❌ Failed to start {name}: {e}", "ERROR")
            return None
            
    def start_all_services(self):
        """Start all BioMapper services in the correct order"""
        self.log("🚀 Starting BioMapper Platform Services...")
        
        # Start Python AI Engine first
        python_engine_dir = self.base_dir / "python_engine"
        if python_engine_dir.exists():
            python_cmd = f"{sys.executable} main_ensemble.py"
            self.start_service("Python AI Engine", python_cmd, python_engine_dir)
            time.sleep(3)  # Give Python engine time to initialize
        
        # Start Backend Server
        backend_dir = self.base_dir / "backend"
        if backend_dir.exists():
            backend_cmd = "npm start"
            self.start_service("Backend Server", backend_cmd, backend_dir, delay=2)
            time.sleep(5)  # Give backend time to initialize
        
        # Start Frontend Development Server
        frontend_dir = self.base_dir / "frontend"
        if frontend_dir.exists():
            frontend_cmd = "npm start"
            self.start_service("Frontend Server", frontend_cmd, frontend_dir, delay=3)
        
        self.log("🎉 All services started successfully!")
        self.log("📊 Access the platform at: http://localhost:3000")
        self.log("🔧 Backend API available at: http://localhost:5000")
        self.log("🤖 Python AI Engine running on: http://localhost:8000")
        
    def monitor_services(self):
        """Monitor running services and restart if needed"""
        self.log("👀 Monitoring services...")
        
        while self.running:
            try:
                for i, (name, process) in enumerate(self.processes):
                    if process.poll() is not None:
                        self.log(f"⚠️  {name} has stopped unexpectedly", "WARN")
                        # Could implement restart logic here
                        
                time.sleep(10)  # Check every 10 seconds
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.log(f"❌ Monitoring error: {e}", "ERROR")
                
    def stop_all_services(self):
        """Gracefully stop all services"""
        self.log("🛑 Stopping all services...")
        self.running = False
        
        for name, process in self.processes:
            try:
                self.log(f"Stopping {name}...")
                if os.name == 'nt':  # Windows
                    process.send_signal(signal.CTRL_BREAK_EVENT)
                else:  # Unix/Linux/macOS
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                    
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=10)
                    self.log(f"✅ {name} stopped gracefully")
                except subprocess.TimeoutExpired:
                    self.log(f"⚠️  Force killing {name}...")
                    if os.name == 'nt':
                        process.kill()
                    else:
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                        
            except Exception as e:
                self.log(f"❌ Error stopping {name}: {e}", "ERROR")
                
        self.log("✅ All services stopped")
        
    def signal_handler(self, signum, frame):
        """Handle interrupt signals"""
        self.log("🛑 Received interrupt signal, shutting down...")
        self.stop_all_services()
        sys.exit(0)
        
    def run(self):
        """Main execution method"""
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        if hasattr(signal, 'SIGTERM'):
            signal.signal(signal.SIGTERM, self.signal_handler)
            
        try:
            # Pre-flight checks
            if not self.check_dependencies():
                self.log("❌ Dependency check failed", "ERROR")
                return False
                
            # Install dependencies
            if not self.install_dependencies():
                self.log("❌ Dependency installation failed", "ERROR")
                return False
                
            # Check environment files
            self.check_environment_files()
            
            # Start all services
            self.start_all_services()
            
            # Start monitoring in a separate thread
            monitor_thread = threading.Thread(target=self.monitor_services)
            monitor_thread.daemon = True
            monitor_thread.start()
            
            # Keep main thread alive
            self.log("✅ BioMapper Platform is running!")
            self.log("Press Ctrl+C to stop all services")
            
            while self.running:
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.log("🛑 Keyboard interrupt received")
        except Exception as e:
            self.log(f"❌ Unexpected error: {e}", "ERROR")
        finally:
            self.stop_all_services()
            
        return True

def main():
    """Main entry point"""
    print("🧬 BioMapper Platform - Service Manager")
    print("=" * 50)
    
    manager = BioMapperServiceManager()
    success = manager.run()
    
    if success:
        print("✅ BioMapper Platform shutdown complete")
    else:
        print("❌ BioMapper Platform encountered errors")
        sys.exit(1)

if __name__ == "__main__":
    main()
