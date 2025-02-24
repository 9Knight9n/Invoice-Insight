import json

from celery import shared_task

from scripts.extractors import extract_text_from_pdf, extract_json, extract_string, extract_fuzzy, \
    SHORT_USED_METHOD_CHOICES
from scripts.llm import call_llm_api, question1, question9
from .models import Invoice, InvoiceItem


@shared_task
def process_pdf(invoice_id):
    invoice = Invoice.objects.get(id=invoice_id)
    invoice.status = 'processing'
    invoice.save()

    try:
        # Extract text from the PDF
        extracted_pages = extract_text_from_pdf(invoice.pdf_file)
        invoice.extracted_text = extracted_pages
        invoice.save()
    except Exception as e:
        invoice.status = 'failed'
        invoice.extracted_text = None
        invoice.save()
        raise e

    # Call the LLM API
    try:
        general_features_content = call_llm_api(question1, extracted_pages)
        invoice.general_features = extract_json(general_features_content)
        invoice.save()
    except Exception as e:
        invoice.general_features = None
        invoice.save()

    exclude_fields = {"name", "hs", "hs_m", "pn", "pn_m", "q", "q_d", "q_m"}
    for page in extracted_pages.keys():
        line_items = []
        try:
            line_items = extract_json(call_llm_api(
                question9(None if len(line_items) == 0 else json.dumps([line_items[0]])), extracted_pages[page]
            ))
        except Exception as e:
            print(f"Error calling LLM on {page}: {e}")
        for item in line_items:
            metadata = {key: value for key, value in item.items() if key not in exclude_fields}
            try:
                InvoiceItem.objects.create(
                    invoice=invoice,
                    name=item["name"],
                    hs_code=item["hs"],
                    hs_code_method=None if item["hs_m"] is None else SHORT_USED_METHOD_CHOICES[item["hs_m"]],
                    part_number=item["pn"],
                    part_number_method=None if item["pn_m"] is None else SHORT_USED_METHOD_CHOICES[item["pn_m"]],
                    quarantine=item["q"],
                    quarantine_detail=item["q_d"],
                    quarantine_method=None if item["q_m"] is None else SHORT_USED_METHOD_CHOICES[item["q_m"]],
                    metadata=metadata
                )
            except Exception as e:
                print(f"Error saving line item {json.dumps(item)}: {e.__str__()}")


    # try:
    #     item_wise_content = call_llm_api(question2, extracted_pages)
    #     invoice.item_wise_content = extract_json(item_wise_content)
    #     for item in invoice.item_wise_content:
    #         InvoiceItem.objects.create(invoice=invoice, name=item)
    # except Exception as e:
    #     pass
    #
    #
    # items = InvoiceItem.objects.filter(invoice=invoice)
    # for item in items:
    #     try:
    #         metadata_content = call_llm_api(question3(item.name), extracted_pages)
    #         item.metadata = extract_json(metadata_content)
    #         item.save()
    #     except:
    #         pass
    #
    # items = InvoiceItem.objects.filter(invoice=invoice)
    # for item in items:
    #     try:
    #         hs_code_content = call_llm_api(question4({"item name":item.name, **item.metadata}), extracted_pages)
    #         item.hs_code = extract_string(hs_code_content)
    #         if item.hs_code is not None:
    #             item.hs_code_method = 'extracted_from_invoice'
    #             item.save()
    #     except:
    #         pass
    #
    # items = InvoiceItem.objects.filter(invoice=invoice, hs_code__isnull=True)
    # for item in items:
    #     try:
    #         hs_code_content = call_llm_api(question5({"item name":item.name, **item.metadata}))
    #         item.hs_code = extract_string(hs_code_content)
    #         if item.hs_code is not None:
    #             item.hs_code_method = 'naive_llm'
    #             item.save()
    #     except:
    #         pass
    #
    # items = InvoiceItem.objects.filter(invoice=invoice)
    # for item in items:
    #     try:
    #         part_number_content = call_llm_api(question6({"item name":item.name, **item.metadata}), extracted_pages)
    #         item.part_number = extract_string(part_number_content)
    #         if item.part_number is not None:
    #             item.part_number_method = 'extracted_from_invoice'
    #             item.save()
    #     except:
    #         pass
    #
    # items = InvoiceItem.objects.filter(invoice=invoice, part_number__isnull=True)
    # for item in items:
    #     try:
    #         part_number_content = call_llm_api(question7({"item name":item.name, **item.metadata}))
    #         item.part_number = extract_string(part_number_content)
    #         if item.part_number is not None:
    #             item.part_number_method = 'naive_llm'
    #             item.save()
    #     except:
    #         pass
    #
    # items = InvoiceItem.objects.filter(invoice=invoice)
    # for item in items:
    #     try:
    #         quarantine_content = call_llm_api(question8({"item name":item.name, **item.metadata}))
    #         item.quarantine, item.quarantine_detail = extract_fuzzy(quarantine_content)
    #         if item.quarantine is not None:
    #             item.quarantine_method = 'naive_llm'
    #             item.save()
    #     except:
    #         pass

    invoice.status = 'completed'
    invoice.save()