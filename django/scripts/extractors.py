import io
import math
import os
import tempfile
import json
from collections import defaultdict

from PyPDF2 import PdfReader
import fitz  # PyMuPDF
import pdfplumber
import camelot
from tabula import read_pdf
from pdfminer.high_level import extract_text
from pdf2image import convert_from_bytes
import pytesseract

SHORT_USED_METHOD_CHOICES = {
    'in': 'extracted_from_invoice',
    'llm': 'naive_llm'
}

def sanitize_json(value):
    """Recursively replace NaN with None in JSON-serializable data."""
    if isinstance(value, float) and math.isnan(value):
        return None
    elif isinstance(value, dict):
        return {k: sanitize_json(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_json(v) for v in value]
    elif isinstance(value, str):
        return (value.strip()
                .replace("None", "null")
                .replace(",}", "}")
                .replace(",]", "]"))
    else:
        return value

def extract_text_from_pdf(pdf_file):
    """
    Extract text from a PDF file using multiple libraries.
    """
    extracted_pages = defaultdict(dict)

    # # Save the uploaded file temporarily for Camelot
    pdf_bytes = io.BytesIO(pdf_file.read())
    # with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
    #     temp_file.write(pdf_bytes.getvalue())
    #     temp_file_path = temp_file.name

    # # PyPDF2
    # pdf_reader = PdfReader(pdf_file)
    # pypdf2_text = ""
    # for page in pdf_reader.pages:
    #     pypdf2_text += page.extract_text()
    # extracted_data["PyPDF2"] = pypdf2_text

    # # PyMuPDF
    # pymupdf_text = ""
    # doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    # for page in doc:
    #     pymupdf_text += page.get_text("text")
    # extracted_data["PyMuPDF"] = pymupdf_text

    # pdfplumber
    try:
        with pdfplumber.open(pdf_file) as _pdf:
            for page_num, page in enumerate(_pdf.pages, start=1):
                extracted_pages[f'page {page_num}']["texts extracted from pdfplumber"] = page.extract_text().strip()
                extracted_pages[f'page {page_num}']["tables extracted from pdfplumber"] = page.extract_tables()
                if len(extracted_pages[f'page {page_num}']["texts extracted from pdfplumber"]) == 0 & \
                        len(extracted_pages[f'page {page_num}']["tables extracted from pdfplumber"]) == 0:
                    del extracted_pages[f'page {page_num}']
    except Exception as e:
        print(f"Error using pdfplumber: {e}")

    # # Camelot (for tables)
    # camelot_tables = []
    # try:
    #     tables = camelot.read_pdf(temp_file_path, pages="all")
    #     for table in tables:
    #         camelot_tables.append(table.df.to_dict())
    # except Exception as e:
    #     print(f"Error using Camelot: {e}")
    # extracted_data["Camelot"] = camelot_tables

    # OCR with pytesseract
    try:
        # Convert PDF bytes to images (one image per page)
        images = convert_from_bytes(pdf_bytes.getvalue())
        # Extract text from each image page-by-page
        for page_num, image in enumerate(images, start=1):
            page_text = pytesseract.image_to_string(image, lang='eng')
            extracted_pages[f'page {page_num}']["texts extracted from pytesseract"] = page_text.strip()
            if len(extracted_pages[f'page {page_num}']["texts extracted from pytesseract"]) == 0 :
                del extracted_pages[f'page {page_num}']
    except Exception as e:
        print(f"Error using pytesseract: {e}")

    # # Tabula (for tables)
    # tabula_tables = []
    # try:
    #     tables = read_pdf(pdf_file, pages="all", multiple_tables=True)
    #     tabula_tables = [table.to_dict() for table in tables]
    # except Exception as e:
    #     print(f"Error using Tabula: {e}")
    # extracted_data["Tabula"] = tabula_tables

    # # PDFMiner
    # try:
    #     pdf_bytes.seek(0)
    #     pdfminer_text = extract_text(pdf_bytes)
    # except Exception as e:
    #     pdfminer_text = f"Error using PDFMiner: {e}"
    # extracted_data["PDFMiner"] = pdfminer_text

    return sanitize_json(extracted_pages)

def extract_json(content):
    content = sanitize_json(content).strip()

    # Remove Markdown code block markers if present
    if content.startswith("```json"):
        content = content.strip("```json").strip("```")
    elif content.startswith("```"):
        content = content.strip("```")

    try:
        # Validate if it's a proper JSON
        return sanitize_json(json.loads(content))
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format in response."}

def extract_string(content):
    return content.strip() if not content == "None" else None

def extract_fuzzy(content):
    if content.startswith('yes'):
        return "yes", content[3:].strip()
    if content.startswith('no'):
        return "no", content[2:].strip()
    if content.startswith('maybe'):
        return "maybe", content[5:].strip()
    return None, None