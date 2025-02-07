from celery import shared_task
from .models import Invoice
from .utils import extract_text_from_pdf, call_llm_api  # Import the utility functions

@shared_task
def process_pdf(invoice_id):
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        invoice.status = 'processing'
        invoice.save()

        # Extract text from the PDF
        extracted_text = extract_text_from_pdf(invoice.pdf_file)
        invoice.extracted_text = extracted_text
        invoice.save()

        # Call the LLM API
        llm_analysis = call_llm_api(extracted_text)
        invoice.llm_analysis = llm_analysis
        invoice.status = 'completed'
        invoice.save()

    except Exception as e:
        invoice.status = 'failed'
        invoice.save()
        raise e