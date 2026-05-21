import io
from pathlib import Path


def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
    """Returns (full_text_with_page_markers, page_count)."""
    import fitz  # pymupdf
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        pages.append(f"[PAGE {i + 1}]\n{text}")
    return "\n".join(pages), len(doc)


def extract_text_from_docx(file_bytes: bytes) -> tuple[str, int]:
    """Returns (full_text, estimated_page_count)."""
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(paragraphs)
    estimated_pages = max(1, len(full_text) // 3000)
    return full_text, estimated_pages


def extract_text_from_txt(file_bytes: bytes) -> tuple[str, int]:
    text = file_bytes.decode("utf-8", errors="replace")
    estimated_pages = max(1, len(text) // 3000)
    return text, estimated_pages


def extract_text(file_bytes: bytes, file_type: str) -> tuple[str, int]:
    if file_type == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif file_type == "docx":
        return extract_text_from_docx(file_bytes)
    elif file_type == "txt":
        return extract_text_from_txt(file_bytes)
    raise ValueError(f"Unsupported file type: {file_type}")
