# app.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
import fitz  # PyMuPDF
import os, requests, traceback

# Cargar variables de entorno
load_dotenv(find_dotenv())
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
print("API KEY detectada:", OPENROUTER_KEY)

app = FastAPI()

# Configuración CORS para conectar frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://finalelectiva1-mp2pupxik-velsalomes-projects.vercel.app/"],  # Reemplaza con tu URL de frontend en Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text

def chunk_text(text: str, max_chars: int = 3000):
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + max_chars, n)
        if end < n:
            cut = text.rfind('\n', start, end)
            if cut <= start:
                cut = text.rfind('. ', start, end)
            if cut <= start:
                cut = end
            else:
                end = cut + 1
        chunks.append(text[start:end].strip())
        start = end
    return chunks

def call_openrouter_chat(prompt: str, model: str = "openai/gpt-4o-mini", max_tokens: int = 800):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
    }
    resp = requests.post(OPENROUTER_URL, headers=headers, json=body, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return data

@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
        text = extract_text_from_pdf(pdf_bytes)
        if not text.strip():
            return JSONResponse(status_code=400, content={"error": "PDF no contiene texto extraíble."})

        chunks = chunk_text(text, max_chars=3500)
        results = []

        for i, c in enumerate(chunks):
            prompt = (
                "Eres un asistente que analiza documentos. "
                "Lee el siguiente fragmento de texto extraído de un PDF y responde con un análisis claro y conciso, "
                "indicando puntos clave, resumen y si hay elementos importantes (fechas, nombres, conclusiones):\n\n"
                f"Fragmento {i+1}/{len(chunks)}:\n{c}\n\nRespuesta:"
            )
            out = call_openrouter_chat(prompt)
            results.append({"chunk": i+1, "analysis": out})

        if len(results) > 1:
            combined_prompt = "Fusiona y sintetiza los análisis parciales a continuación en un solo análisis final coherente:\n\n"
            for r in results:
                combined_prompt += f"ANALISIS PARCIAL {r['chunk']}:\n{r['analysis']}\n\n"
            final = call_openrouter_chat(combined_prompt)
        else:
            final = results[0]["analysis"]

        return {"analysis": final, "parts": results}

    except requests.HTTPError as re:
        traceback.print_exc()
        try:
            return JSONResponse(status_code=re.response.status_code, content={"error": re.response.text})
        except Exception:
            return JSONResponse(status_code=500, content={"error": str(re)})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})
