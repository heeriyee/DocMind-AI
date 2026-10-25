import os
import shutil
from pathlib import Path
from typing import List

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel
from pypdf import PdfReader


# ============================================================
# PATHS & ENVIRONMENT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add it to backend/.env"
    )


# ============================================================
# GEMINI
# ============================================================

gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)

GENERATION_MODEL = "gemini-3.5-flash"
EMBEDDING_MODEL = "gemini-embedding-001"


# ============================================================
# FOLDERS
# ============================================================

UPLOAD_FOLDER = BASE_DIR / "uploads"
CHROMA_FOLDER = BASE_DIR / "chroma_db"

UPLOAD_FOLDER.mkdir(exist_ok=True)
CHROMA_FOLDER.mkdir(exist_ok=True)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="DocMind AI",
    description="AI-powered PDF analysis and document chat system",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CHROMADB
# ============================================================

chroma_client = chromadb.PersistentClient(
    path=str(CHROMA_FOLDER)
)

collection = chroma_client.get_or_create_collection(
    name="docmind_documents"
)


# ============================================================
# REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):
    question: str
    filename: str | None = None


# ============================================================
# TEXT CHUNKING
# ============================================================

def split_text(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[str]:

    if not text:
        return []

    if chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be smaller than chunk_size."
        )

    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:

        end = start + chunk_size

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += chunk_size - chunk_overlap

    return chunks


# ============================================================
# CREATE EMBEDDING
# ============================================================

def create_embedding(
    text: str,
    task_type: str
):

    try:

        result = gemini_client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=768
            )
        )

        return result.embeddings[0].values

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Embedding generation failed: {str(e)}"
        )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "DocMind AI Backend Running 🚀",
        "status": "online"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "database": "ChromaDB connected",
        "ai": "Gemini connected"
    }


# ============================================================
# UPLOAD PDF
# ============================================================

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Validate filename
    # --------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    # Keep only the filename, preventing unsafe paths
    original_filename = Path(file.filename).name

    # --------------------------------------------------------
    # Validate PDF
    # --------------------------------------------------------

    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    # --------------------------------------------------------
    # Save PDF
    # --------------------------------------------------------

    file_path = UPLOAD_FOLDER / original_filename

    try:

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not save PDF: {str(e)}"
        )

    # --------------------------------------------------------
    # Extract text
    # --------------------------------------------------------

    try:

        reader = PdfReader(str(file_path))

        text_parts = []

        for page_number, page in enumerate(reader.pages):

            extracted = page.extract_text()

            if extracted:

                text_parts.append(
                    f"[Page {page_number + 1}]\n"
                    f"{extracted}"
                )

        text = "\n\n".join(text_parts)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not read PDF: {str(e)}"
        )

    # --------------------------------------------------------
    # Validate extracted text
    # --------------------------------------------------------

    if not text.strip():

        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract readable text from "
                "this PDF. It may be a scanned/image-only PDF."
            )
        )

    # --------------------------------------------------------
    # Split text
    # --------------------------------------------------------

    chunks = split_text(
        text,
        chunk_size=800,
        chunk_overlap=150
    )

    if not chunks:

        raise HTTPException(
            status_code=400,
            detail="No text chunks were created."
        )

    # --------------------------------------------------------
    # Remove old chunks for same document
    # --------------------------------------------------------

    try:

        collection.delete(
            where={
                "filename": original_filename
            }
        )

    except Exception:
        pass

    # --------------------------------------------------------
    # Create embeddings
    # --------------------------------------------------------

    embeddings = []

    try:

        for chunk in chunks:

            embedding = create_embedding(
                chunk,
                "RETRIEVAL_DOCUMENT"
            )

            embeddings.append(embedding)

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not create document embeddings: {str(e)}"
        )

    # --------------------------------------------------------
    # Store in ChromaDB
    # --------------------------------------------------------

    document_id = original_filename.replace(
        " ",
        "_"
    )

    ids = [
        f"{document_id}_{i}"
        for i in range(len(chunks))
    ]

    metadatas = [
        {
            "filename": original_filename,
            "chunk_index": i
        }
        for i in range(len(chunks))
    ]

    try:

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not store document: {str(e)}"
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "filename": original_filename,

        "status": "Document processed successfully",

        "characters": len(text),

        "chunks": len(chunks),

        "embeddings": len(embeddings),

        "message": (
            "PDF uploaded, embedded and stored "
            "in the DocMind knowledge base."
        )
    }


# ============================================================
# CHAT / RAG
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # --------------------------------------------------------
    # Question embedding
    # --------------------------------------------------------

    question_embedding = create_embedding(
        question,
        "RETRIEVAL_QUERY"
    )

    # --------------------------------------------------------
    # Search ChromaDB
    # --------------------------------------------------------

    try:

        if request.filename:

            filename = Path(request.filename).name

            results = collection.query(
                query_embeddings=[
                    question_embedding
                ],
                n_results=5,
                where={
                    "filename": filename
                }
            )

        else:

            results = collection.query(
                query_embeddings=[
                    question_embedding
                ],
                n_results=5
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Document search failed: {str(e)}"
        )

    documents = results.get(
        "documents",
        [[]]
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]]
    )[0]

    # --------------------------------------------------------
    # No results
    # --------------------------------------------------------

    if not documents:

        return {
            "answer": (
                "I couldn't find that information "
                "in the uploaded documents."
            ),
            "sources": []
        }

    # --------------------------------------------------------
    # Build context
    # --------------------------------------------------------

    context_parts = []

    for i, document in enumerate(documents):

        metadata = (
            metadatas[i]
            if i < len(metadatas)
            else {}
        )

        context_parts.append(
            f"""
SOURCE: {metadata.get("filename", "Unknown")}
CHUNK: {metadata.get("chunk_index", "Unknown")}

{document}
"""
        )

    context = "\n\n".join(context_parts)

    # --------------------------------------------------------
    # Gemini prompt
    # --------------------------------------------------------

    prompt = f"""
You are DocMind AI, an intelligent document analysis assistant.

Answer the user's question using ONLY the provided document
context.

IMPORTANT RULES:

1. Use only information from the document context.
2. Do not invent or assume information.
3. If the answer is not present in the context, say:
   "I couldn't find that information in the uploaded documents."
4. Give a clear and direct answer.
5. Use headings and bullet points when useful.
6. Do not mention embeddings, ChromaDB, RAG, or internal
   implementation details unless the user specifically asks.
7. If the selected document is provided, answer only from
   that document's retrieved context.

DOCUMENT CONTEXT:

{context}

USER QUESTION:

{question}
"""

    # --------------------------------------------------------
    # Generate answer
    # --------------------------------------------------------

    try:

        response = gemini_client.models.generate_content(
            model=GENERATION_MODEL,
            contents=prompt
        )

        answer = response.text

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"AI response generation failed: {str(e)}"
        )

    # --------------------------------------------------------
    # Sources
    # --------------------------------------------------------

    sources = []

    for metadata in metadatas:

        source = {
            "filename": metadata.get(
                "filename"
            ),
            "chunk": metadata.get(
                "chunk_index"
            )
        }

        if source not in sources:
            sources.append(source)

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "answer": answer,
        "sources": sources
    }


# ============================================================
# DOCUMENT LIST
# ============================================================

@app.get("/documents")
def get_documents():

    try:

        results = collection.get(
            include=["metadatas"]
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve documents: {str(e)}"
        )

    documents = {}

    for metadata in results.get(
        "metadatas",
        []
    ):

        if not metadata:
            continue

        filename = metadata.get(
            "filename"
        )

        if filename:
            documents[filename] = True

    return {
        "documents": list(
            documents.keys()
        )
    }


# ============================================================
# DOCUMENT SUMMARY
# ============================================================

@app.post("/summary")
def summarize_document(
    request: ChatRequest
):

    # Dashboard currently sends the filename
    # inside the question field.
    filename = request.filename or request.question

    filename = Path(
        filename.strip()
    ).name

    if not filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    # --------------------------------------------------------
    # Get document chunks
    # --------------------------------------------------------

    try:

        results = collection.get(
            where={
                "filename": filename
            }
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve document: {str(e)}"
        )

    documents = results.get(
        "documents",
        []
    )

    if not documents:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    # --------------------------------------------------------
    # Build context
    # --------------------------------------------------------

    context = "\n\n".join(
        documents
    )

    # --------------------------------------------------------
    # Summary prompt
    # --------------------------------------------------------

    prompt = f"""
You are DocMind AI.

Summarize the following document using ONLY the provided
document content.

Include:

1. Overview
2. Main objectives
3. Key concepts
4. Important findings
5. Important conclusions
6. Five key takeaways

Do not invent information that is not present in the document.

DOCUMENT:

{context}
"""

    # --------------------------------------------------------
    # Generate summary
    # --------------------------------------------------------

   
    try:
        response = gemini_client.models.generate_content(
            model=GENERATION_MODEL,
            contents=prompt
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty summary. Please try again."
            )

    except HTTPException:
        raise

    except Exception as e:
        error_message = str(e)

        if "503" in error_message or "UNAVAILABLE" in error_message:
            raise HTTPException(
                status_code=503,
                detail="Gemini is temporarily overloaded. Please try again later."
            )

        raise HTTPException(
            status_code=502,
            detail=f"AI summary generation failed: {error_message}"
        )

    return {
        "filename": filename,
        "summary": response.text
    }

    return {
        "filename": filename,
        "summary": response.text
    }


@app.get("/test-model")
def test_model():
    try:
        response = gemini_client.models.generate_content(
            model=GENERATION_MODEL,
            contents="Reply with exactly: WORKING"
        )
        return {"model": GENERATION_MODEL, "response": response.text}
    except Exception as e:
        return {"model": GENERATION_MODEL, "error": str(e)}
