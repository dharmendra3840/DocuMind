import re
from dataclasses import dataclass


@dataclass
class Chunk:
    text: str
    page_number: int
    chunk_index: int


def split_text_into_chunks(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> list[Chunk]:
    """
    Split text that contains [PAGE N] markers into chunks,
    preserving page number metadata for each chunk.
    """
    page_pattern = re.compile(r"\[PAGE (\d+)\]")
    segments = page_pattern.split(text)

    current_page = 1
    page_texts: list[tuple[int, str]] = []

    i = 0
    while i < len(segments):
        seg = segments[i]
        if seg.isdigit():
            current_page = int(seg)
            i += 1
        else:
            if seg.strip():
                page_texts.append((current_page, seg))
            i += 1

    if not page_texts:
        page_texts = [(1, text)]

    chunks: list[Chunk] = []
    chunk_index = 0
    buffer = ""
    buffer_page = 1

    for page_num, page_text in page_texts:
        words = page_text.split()
        for word in words:
            buffer += word + " "
            if len(buffer) >= chunk_size:
                chunks.append(Chunk(text=buffer.strip(), page_number=buffer_page, chunk_index=chunk_index))
                chunk_index += 1
                overlap_text = buffer[-chunk_overlap:] if len(buffer) > chunk_overlap else buffer
                buffer = overlap_text
                buffer_page = page_num
        buffer_page = page_num

    if buffer.strip():
        chunks.append(Chunk(text=buffer.strip(), page_number=buffer_page, chunk_index=chunk_index))

    return chunks
