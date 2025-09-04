import os
import uuid
import json
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")

# Use the deployed backend URL here
BACKEND_URL = "https://ai-data-platform.onrender.com"

os.makedirs(UPLOAD_DIR, exist_ok=True)
if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "w") as f:
        json.dump([], f)

app = FastAPI()

# CORS: allow frontend (Netlify) and any other origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your Netlify URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Helper ----------------
def save_history(original_name, cleansed_name):
    with open(HISTORY_FILE, "r") as f:
        history = json.load(f)
    history.append({
        "original": original_name,
        "cleansed": cleansed_name,
        "download": f"{BACKEND_URL}/download/{cleansed_name}"
    })
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f)

# ---------------- Cleanse ----------------
@app.post("/cleanse")
async def cleanse_data(file: UploadFile = File(...), column_strategy: str = Form(None)):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    cleansed_filename = f"cleansed_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, cleansed_filename)

    temp_path = os.path.join(UPLOAD_DIR, f"temp_{file.filename}")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Load file
    if file.filename.endswith(".csv"):
        df = pd.read_csv(temp_path)
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(temp_path)
    elif file.filename.endswith(".json"):
        df = pd.read_json(temp_path)
    else:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail="Unsupported file format")

    df.insert(0, "primary_key", [str(uuid.uuid4()) for _ in range(len(df))])
    df = df.drop_duplicates()

    strategies = {}
    if column_strategy:
        try:
            strategies = json.loads(column_strategy).get("strategies", {})
        except:
            strategies = {}

    for col in df.columns:
        if col == "primary_key":
            continue
        strat = strategies.get(col, "default")
        if df[col].dtype == "object":
            df[col] = df[col].fillna("UNKNOWN") if strat == "default" else df[col].fillna(strat)
        else:
            if strat == "mean":
                imputer = SimpleImputer(strategy="mean")
            elif strat == "median":
                imputer = SimpleImputer(strategy="median")
            elif strat == "mode":
                imputer = SimpleImputer(strategy="most_frequent")
            elif strat != "default":
                df[col] = df[col].fillna(float(strat))
                continue
            else:
                imputer = SimpleImputer(strategy="mean")
            df[col] = imputer.fit_transform(df[[col]])

        if df[col].dtype == "object":
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    df.to_csv(file_path, index=False)
    os.remove(temp_path)

    save_history(file.filename, cleansed_filename)

    return {
        "message": "File cleansed",
        "download": f"{BACKEND_URL}/download/{cleansed_filename}",
        "data": df.head(100).to_dict(orient="records")
    }

# ---------------- Download ----------------
@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="text/csv", filename=filename)
    raise HTTPException(status_code=404, detail="File not found")

# ---------------- History ----------------
@app.get("/history")
def get_history():
    with open(HISTORY_FILE, "r") as f:
        history = json.load(f)
    return {"history": history}
