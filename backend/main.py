from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import apartment, project

app = FastAPI(title="TradesPro Load Calculation API", version="1.0")

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 部署后改成你的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(apartment.router)
app.include_router(project.router)

@app.get("/")
def root():
    return {"message": "TradesPro Load Calculator API is running 🚀"}
