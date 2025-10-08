
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, analysis

app = FastAPI(title="Poultry Tracker API - Starter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(upload.router, prefix="/upload")
app.include_router(analysis.router, prefix="/analysis")

@app.get('/')
def root():
    return {'message': 'Poultry Tracker API - running'}
