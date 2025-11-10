# app.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
import fitz  # PyMuPDF
import os, requests, traceback

# 🔹 Cargar variables de entorno
load_dotenv(find_dotenv())
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
print("✅ API KEY detectada:", bool(OPENROUTER_KEY))

app = FastAPI()

# 🔹 Configurar CORS (sin barra al final)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://finalelectiva1.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧩 Funciones auxiliares
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
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
    }
    resp = requests.post(OPENROUTER_URL, headers=headers, json=body, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return str(data)

# 🔹 Endpoint principal
@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...), question: str = Form(None)):
    try:
        pdf_bytes = await file.read()
        text = extract_text_from_pdf(pdf_bytes)
        if not text.strip():
            return JSONResponse(status_code=400, content={"error": "PDF no contiene texto extraíble."})

        # 🟣 Si el usuario hace una pregunta
        if question:
            prompt = (
                f"El usuario ha hecho una pregunta sobre el siguiente documento:\n\n"
                f"{text[:5000]}\n\n"
                f"Pregunta: {question}\n\n"
                f"Responde de forma precisa, breve y coherente con el contenido del documento."
            )
            answer = call_openrouter_chat(prompt)
            return {"analysis": answer}

        # 🟢 Si NO hay pregunta → hace análisis completo
        chunks = chunk_text(text, max_chars=3500)
        results = []
        for i, c in enumerate(chunks):
            prompt = (
                "Eres un asistente que analiza documentos. "
                "Lee el siguiente fragmento y proporciona un análisis claro, "
                "indicando puntos clave, resumen, fechas, nombres y conclusiones:\n\n"
                f"Fragmento {i+1}/{len(chunks)}:\n{c}\n\nRespuesta:"
            )
            out = call_openrouter_chat(prompt)
            results.append({"chunk": i+1, "analysis": out})

        if len(results) > 1:
            combined_prompt = "Fusiona y sintetiza los análisis parciales a continuación en un solo análisis coherente:\n\n"
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
