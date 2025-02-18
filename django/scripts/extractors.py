import io
import math
import os
import tempfile
import json
from PyPDF2 import PdfReader
import fitz  # PyMuPDF
import pdfplumber
import camelot
from tabula import read_pdf
from pdfminer.high_level import extract_text

def sanitize_json(value):
    """Recursively replace NaN with None in JSON-serializable data."""
    if isinstance(value, float) and math.isnan(value):
        return None
    elif isinstance(value, dict):
        return {k: sanitize_json(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_json(v) for v in value]
    elif isinstance(value, str):
        return value.strip()
    else:
        return value

def extract_text_from_pdf(pdf_file):
    """
    Extract text from a PDF file using multiple libraries.
    """
    extracted_data = {}

    # Save the uploaded file temporarily for Camelot
    pdf_bytes = io.BytesIO(pdf_file.read())
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(pdf_bytes.getvalue())
        temp_file_path = temp_file.name

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
    pdfplumber_text = ""
    with pdfplumber.open(pdf_file) as _pdf:
        for page in _pdf.pages:
            pdfplumber_text += page.extract_text()
    extracted_data["pdfplumber"] = pdfplumber_text

    # # Camelot (for tables)
    # camelot_tables = []
    # try:
    #     tables = camelot.read_pdf(temp_file_path, pages="all")
    #     for table in tables:
    #         camelot_tables.append(table.df.to_dict())
    # except Exception as e:
    #     print(f"Error using Camelot: {e}")
    # extracted_data["Camelot"] = camelot_tables

    # Tabula (for tables)
    tabula_tables = []
    try:
        tables = read_pdf(pdf_file, pages="all", multiple_tables=True)
        tabula_tables = [table.to_dict() for table in tables]
    except Exception as e:
        print(f"Error using Tabula: {e}")
    extracted_data["Tabula"] = tabula_tables

    # # PDFMiner
    # try:
    #     pdf_bytes.seek(0)
    #     pdfminer_text = extract_text(pdf_bytes)
    # except Exception as e:
    #     pdfminer_text = f"Error using PDFMiner: {e}"
    # extracted_data["PDFMiner"] = pdfminer_text

    return sanitize_json(extracted_data)

def extract_json(content):
    content = sanitize_json(content)

    # Remove Markdown code block markers if present
    if content.startswith("```json"):
        content = content.strip("```json").strip("```")
    elif content.startswith("```"):
        content = content.strip("```")

    try:
        # Validate if it's a proper JSON
        return json.loads(content)
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