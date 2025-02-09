from celery import shared_task
from .models import Invoice
from .utils import extract_text_from_pdf, call_llm_api_general, call_llm_api_item_wise  # Import the utility functions

@shared_task
def process_pdf(invoice_id):
    invoice = Invoice.objects.get(id=invoice_id)
    invoice.status = 'processing'
    invoice.save()

    try:

        # Extract text from the PDF
        extracted_text = extract_text_from_pdf(invoice.pdf_file)
        invoice.extracted_text = extracted_text
        invoice.save()

        # Call the LLM API
        invoice.general_features = call_llm_api_general(extracted_text)
        invoice.item_wise_features = call_llm_api_item_wise(extracted_text)

        invoice.status = 'completed'
        invoice.save()

    except Exception as e:
        invoice.status = 'failed'
        invoice.save()
        raise e