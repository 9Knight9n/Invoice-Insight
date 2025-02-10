import io
import os
import tempfile
import json
from PyPDF2 import PdfReader
import fitz  # PyMuPDF
import pdfplumber
import camelot
from tabula import read_pdf
from pdfminer.high_level import extract_text
from openai import OpenAI

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

    return extracted_data

def call_llm_api_general(extracted_text):
    """
    Call the LLM API (gpt-4o) to analyze the extracted text.
    """
    # Define the LLM configuration
    llm_config = {
        "name": "gpt-4o",
        "api_url": "https://models.inference.ai.azure.com",
        "api_key": os.getenv("OPENAI_API_KEY")
    }
    # llm_config = {
    #     "name": "Meta-Llama-3.1-405B-Instruct",
    #     "api_url": "https://api.sambanova.ai/v1",
    #     "api_key": os.getenv("OPENAI_API_KEY")
    # }

    # Initialize the OpenAI client
    client = OpenAI(
        base_url=llm_config["api_url"],
        api_key=llm_config["api_key"],
    )

    # Prepare the context for the LLM
    context = json.dumps(extracted_text, indent=4)

    # Define the question/prompt
    question = """
        Extract all fields provided in the invoice, 
        except the fields related to items in invoice, they will be extracted later on,
        just need fields that are related to the invoice features.
        return the result as JSON. No more explanation, only a JSON is enough.
        provide whole JSON and do not truncate the json. 
        the json format should be list of objects each with two fields of 'Name' and 'Value' 
        'Name' is the name of the field in the invoice, 
        'Value' is the value of the field in the invoice. convert these 'Value' to string if they are not. 
        both 'Name' and 'Value' should be user readable and easy to understand.
        """

    # Call the LLM API
    completion = client.chat.completions.create(
        model=llm_config["name"],
        messages=[
            {
                "role": "system",
                "content": "You are an assistant that answers questions based on the provided context. The context is extracted text and tables from an invoice."
            },
            {
                "role": "user",
                "content": f'Here is the context: {context}'
            },
            {
                "role": "user",
                "content": question
            }
        ]
    )

    # Extract the response
    if completion and completion.choices and completion.choices[0] and completion.choices[0].message and \
            completion.choices[0].message.content:
        content = completion.choices[0].message.content
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
    else:
        return {"error": "No valid response received from the API."}


def call_llm_api_item_wise(extracted_text):
    """
    Call the LLM API (gpt-4o) to analyze the extracted text.
    """
    # Define the LLM configuration
    llm_config = {
        "name": "gpt-4o",
        "api_url": "https://models.inference.ai.azure.com",
        "api_key": os.getenv("OPENAI_API_KEY")
    }

    # Initialize the OpenAI client
    client = OpenAI(
        base_url=llm_config["api_url"],
        api_key=llm_config["api_key"],
    )

    # Prepare the context for the LLM
    context = json.dumps(extracted_text, indent=4)

    # Define the question/prompt
    question = """
        Extract items and their fields provided in the invoice, 
        return the result as JSON. No more explanation, only a JSON is enough. 
        provide whole JSON and do not truncate the json. 
        all values in the JSON must be converted to string if they are not. 
        the json format should be list of objects with one mandatory field named 'Item Name'
        and two optional field named 'HS Code' and 'Part Number', 
        'HS Code' field is the Harmonized System Code assigned to items in the invoice.
        'Part Number' field may also be referred as 'item Number' or 'item no' or 'part no' as well.
        assign null value for any of 'HS Code' or 'Part Number' if value not provided. 
        on some invoices 'Item Name' might be same as 'Part Number' and that's ok, 
        in cases like this when no 'Item Name' is provided prefer 'Part Number' 
        than description to assign as 'Item Name'.
        add any other fields the invoice provide for each item as well, 
        name these fields as they are named in the invoice. 
        be careful not to add the total row as a item in invoice.
        """

    # Call the LLM API
    completion = client.chat.completions.create(
        model=llm_config["name"],
        messages=[
            {
                "role": "system",
                "content": "You are an assistant that answers questions based on the provided context. The context is extracted text and tables from an invoice."
            },
            {
                "role": "user",
                "content": f'Here is the context: {context}'
            },
            {
                "role": "user",
                "content": question
            }
        ]
    )

    # Extract the response
    if completion and completion.choices and completion.choices[0] and completion.choices[0].message and \
            completion.choices[0].message.content:
        content = completion.choices[0].message.content
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
    else:
        return {"error": "No valid response received from the API."}