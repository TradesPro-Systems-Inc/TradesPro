from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import subprocess, json, os

app = FastAPI(title="CEC MVP API", version="1.0")

@app.post("/api/v1/calc")
def calc(request: Request):
    data = json.loads(request.body())
    js_path = os.path.abspath("engine/calculateCecLoadFull.js").replace('\\', '/')
    script = f"import('{{js_path}}').then(m=>console.log(JSON.stringify(m.calculateCecLoadFull({json.dumps(data)}))))"
    try:
        result = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        return JSONResponse(content=json.loads(result.stdout))
    except subprocess.CalledProcessError as e:
        return JSONResponse(status_code=500, content={"detail": e.stderr})
