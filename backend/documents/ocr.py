import os
import logging

logger = logging.getLogger(__name__)

def perform_ocr(image_path: str) -> str:
    """Performs OCR on an image file using pytesseract."""
    try:
        from PIL import Image
        import pytesseract
        
        logger.info(f"Performing OCR on image: {image_path}")
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except ImportError:
        logger.warning("pytesseract or Pillow not installed. OCR fallback.")
        return "[Error: PIL or pytesseract library is not installed locally. Please run 'pip install pytesseract pillow' to enable local image OCR.]"
    except Exception as e:
        logger.error(f"Tesseract OCR failed: {e}")
        return f"[Error: OCR processing failed. Make sure tesseract-ocr is installed on your host system: {e}]"
