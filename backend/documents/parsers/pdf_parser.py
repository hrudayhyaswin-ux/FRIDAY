import os
import logging

logger = logging.getLogger(__name__)

def parse_pdf(file_path: str) -> str:
    """Extracts text from a PDF file using PyMuPDF (fitz) or pypdf fallback."""
    text = ""
    try:
        # Try PyMuPDF (fitz)
        import fitz
        logger.info(f"Parsing PDF with PyMuPDF: {file_path}")
        doc = fitz.open(file_path)
        for page in doc:
            page_text = page.get_text()
            if page_text:
                text += page_text + "\n"
        doc.close()
        return text
    except ImportError:
        logger.info(f"PyMuPDF not installed. Falling back to pypdf for {file_path}")
    except Exception as e:
        logger.error(f"PyMuPDF error, trying pypdf: {e}")
        
    try:
        # Try pypdf fallback
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Failed to parse PDF {file_path} using all libraries: {e}")
        raise e
