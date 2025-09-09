from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import tempfile
import os
import json
import subprocess

app = FastAPI(title="BioMapper FastAPI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class XaiRequest(BaseModel):
    sequence: str

class NcbiRequest(BaseModel):
    sequence: str

@app.post("/analyze")
async def analyze(fastaFile: UploadFile = File(...)):
    fd, tmp_path = tempfile.mkstemp(suffix=".fasta")
    os.close(fd)
    try:
        with open(tmp_path, 'wb') as f:
            f.write(await fastaFile.read())
        # Use main.py which already outputs final JSON to stdout
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "main.py"), tmp_path], capture_output=True, text=True)
        output = proc.stdout.strip().splitlines()[-1] if proc.stdout else '{}'
        return json.loads(output)
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/xai")
async def xai(req: XaiRequest):
    try:
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "run_xai.py"), req.sequence], capture_output=True, text=True)
        return json.loads(proc.stdout or '{}')
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/phylo")
async def phylo(fastaFile: UploadFile = File(...)):
    fd, tmp_path = tempfile.mkstemp(suffix=".fasta")
    os.close(fd)
    try:
        with open(tmp_path, 'wb') as f:
            f.write(await fastaFile.read())
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "run_phylo_tree.py"), tmp_path], capture_output=True, text=True)
        return json.loads(proc.stdout or '{}')
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/quantum/benchmark")
async def quantum_benchmark():
    try:
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "quantum_integration.py"), "benchmark", "{}"], capture_output=True, text=True)
        return json.loads(proc.stdout or '{}')
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/quantum/optimization")
async def quantum_optimization(request: dict):
    try:
        species_data = request.get("species_data", [])
        conservation_priorities = request.get("conservation_priorities", [])
        params = json.dumps({
            "species_data": species_data,
            "conservation_priorities": conservation_priorities
        })
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "quantum_integration.py"), "optimization", params], capture_output=True, text=True)
        return json.loads(proc.stdout or '{}')
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/quantum")
async def quantum():
    try:
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "run_quantum.py")], capture_output=True, text=True)
        return json.loads(proc.stdout or '{}')
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/fl/simulate")
async def fl_simulate(request: dict):
    try:
        participants = request.get("participants", 5)
        rounds = request.get("rounds", 10)
        proc = subprocess.run(["py", os.path.join(os.path.dirname(__file__), "federated_learning_integration.py"), str(participants), str(rounds)], capture_output=True, text=True)
        return json.loads(proc.stdout or '{}')
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/fl/status")
async def fl_status():
    try:
        # Import and call the FL status function directly
        import sys
        sys.path.append(os.path.dirname(__file__))
        from federated_learning_integration import getFLStatus
        return getFLStatus()
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/fl/stop")
async def fl_stop():
    try:
        # Import and call the FL stop function directly
        import sys
        sys.path.append(os.path.dirname(__file__))
        from federated_learning_integration import stopFLSimulation
        return stopFLSimulation()
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8890)


