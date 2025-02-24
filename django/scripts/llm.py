import os
from openai import OpenAI


# Define the LLM configuration
llm_config = {
    "name": "gpt-4o",
    "api_key": os.getenv("OPENAI_API_KEY")
}

# Initialize the OpenAI client
client = OpenAI(
    # base_url="https://openrouter.ai/api/v1",
    api_key=llm_config["api_key"],
)

def call_llm_api(question, invoice_context = None, question_context = None):
    """
    Call the LLM API (gpt-4o) to analyze the extracted text.
    """

    # Call the LLM API
    completion = client.chat.completions.create(
        model=llm_config["name"],
        messages=
        [
            {
                "role": "system",
                "content":
                    '''
                        You are an assistant that answers questions.
                    '''
            },
        ] +
        ([
            {
                "role": "user",
                "content":
                    f'''
                        answer question based on the provided context.
                        The context is extracted text and tables from an invoice.
                        several libraries might have been used to extract text from an invoice.
                        Here is the invoice context: {invoice_context}
                    '''
            },
        ] if invoice_context is not None else []) +
        ([
            {
                "role": "user",
                "content": f'Here are some extra context to help you answer following question, ' +
                           f'answer only using the content of this context: {question_context}'
            },
        ] if question_context is not None else []) +
        [
            {
                "role": "user",
                "content": question
            }
        ]
    )


    # Extract the response
    if completion and completion.choices and completion.choices[0] and completion.choices[0].message and \
            completion.choices[0].message.content:
        return completion.choices[0].message.content

    raise Exception('No answer')

# extracted_text question
question1 = \
    """
        Extract structured data from the following invoice. 
        Return the data in JSON format with all relevant fields. 
        the JSON format should be list of objects each with two fields of 'Name' and 'Value' 
        for relevant details you find, make sure the keys for 'Name' is short and descriptive 
        as this key will later be represented to endpoint users without any changes.
        make sure all the 'Name' and 'Value' are strings. 
        provide whole JSON and do not truncate the JSON. 
        
        Extract all fields provided in the invoice, 
        except the fields related to list items in invoice, they will be extracted later on,
        just need fields that are related to the invoice itself.
        'Name' is the name of the field in the invoice, 
        'Value' is the value of the field in the invoice.
        
        Example JSON Output:
        [
            {
                'Name': 'Company Name',
                'Value': 'Apple Products Co.,Ltd'  
            },
            {
                'Name': 'Invoice Number',
                'Value': 'XMK-GEW241023'  
            },
            {
                'Name': 'Customer Phone',
                'Value': '1300316550'  
            },
            {
                'Name': 'Customer Name',
                'Value': 'Sample Customer Name'    
            }
        ]
    """

# list items in invoice
question2 = \
    """
        Extract list of items or products in invoice,  
        return the result as JSON. No more explanation, only a JSON is enough. 
        provide whole JSON and do not truncate the json. 
        all values in the JSON must be converted to string if they are not. 
        the json format should be list of strings.
        on some invoices item names might be same as part number and that's ok, 
        in cases like this when no item name is provided check other provided fields and 
        chose one that best describes item, 
        also prefer part number than description to assign as item name if both provided.
        do not set name as N/M or NAN or things like that for name.
        be careful not to add the total row as a item in invoice.
    """

# item metadata in invoice
question3 = lambda item: \
    f"""
        Extract fields provided in the invoice for item {item}, 
        return the result as JSON. No more explanation, only a JSON is enough. 
        provide whole JSON and do not truncate the json. 
        all values in the JSON must be converted to string if they are not. 
        the json format should be an object. 
        remove fields that show 'HS Code' and 'Part Number',
        'HS Code' and 'Part Number' might be provided under a different name.
        'HS Code' field is the Harmonized System Code assigned to items in the invoice.
        'Part Number' field may also be referred as 'item Number' or 'item no' or 'part no' as well.
        name other fields as they are named in the invoice but try to shorten them if possible. 
    """

# item hs_code in invoice
question4 = lambda item: \
    f"""
        Extract HS Code provided in the invoice for item with this descriptions: {item}, 
        HS Code is the Harmonized System Code assigned to items in the invoice.
        return the result as a single string. No more explanation, only a string is enough.
        return 'None' if HS Code is not provided in invoice. 
    """

# item hs_code using naive llm
question5 = lambda item: \
    f"""
        provide me the HS Code for an item with this descriptions: {item}, 
        HS Code is the Harmonized System Code assigned to items in the invoice.
        provide the HS code even if your are partially sure about it.
        don't need to be 100% sure about it. 
        return the result as a single string. No more explanation, only a string is enough.
        return 'None' if you don't know the HS Code. 
    """

# item part_number in invoice
question6 = lambda item: \
    f"""
        Extract part number provided in the invoice for item with this descriptions: {item}, 
        'Part Number' field may also be referred as 'item Number' or 'item no' or 'part no' as well.
        return the result as a single string. No more explanation, only a string is enough.
        return 'None' if part number is not provided in invoice. 
    """

# item part_number using naive llm
question7 = lambda item: \
    f"""
        provide me the part number for an item with this descriptions: {item}, 
        'Part Number' field may also be referred as 'item Number' or 'item no' or 'part no' as well.
        return the result as a single string. No more explanation, only a string is enough.
        return 'None' if you don't know the part number for an item with provided description. 
    """

# item quarantine using naive llm
question8 = lambda item: \
    f"""
        according to Australian border law, does the item 
        with this descriptions: {item} need quarantine, 
        first line of your answer must be either 'yes', 'no' or 'maybe'.
        after 'yes', 'no' or 'maybe' in a new line provide me a short reasoning as well.
        you should consider ingredients for the item as well in your reasoning.
    """

# item per page
question9 = lambda example: \
    f"""
        Extract structured data from the following invoice. 
        Return the data in JSON format with all relevant fields. 
        Returned JSON must be a list of line item, 
        ensure the following fields are included for each item: 
        name, hs, pn, q, hs_m, pn_m, q_m, q_d and any other relevant details.
        for any other relevant details you find, make sure the key for field is short and descriptive 
        as this key will later be represented to endpoint users without any changes.
        make sure all the keys and their values are strings. 
        provide whole JSON and do not truncate the JSON. 
        
        in cases when no item name is provided check other provided fields and 
        chose one that looks most to a item name, 
        also prefer part number rather than description to assign as item name if name is not provided.
        do not set name to N/M or NAN or any other meaningless names like that.
        
        hs is short for hs code or Harmonized System Code.
        If hs is present in the invoice, use it and set hs_m to "in".
        If hs is missing, infer it based on the item description and set hs_m to "llm".
        If hs is not present in invoice and can not be inferred, set both hs and hs_m to None.
        
        pm is short for part number.
        If pm is present in the invoice, use it and set pm_m to "in".
        If pm is missing, infer it based on the item description and set pm_m to "llm".
        If pm is not present in invoice and can not be inferred, set both pm and pm_m to None.
        
        q is short for quarantine, it specifies whether the line item needs quarantine 
        according to Australian border law.
        q must be either 'yes', 'no' or 'maybe'.
        q_d is a short reasoning for quarantine. 
        you should consider ingredients for the item as well in your reasoning.
        If q is present in the invoice, use it and set q_m to "in".
        If q is missing, infer it based on the item description and set q_m to "llm".
        If q is not present in invoice and can not be inferred, set all q, q_m and q_d to None.
        
        {("i have ask you same question before for previous page of invoice, "
          "here is the result for previous page, "
          "returned JSON must match the previous page JSON.") if example is not None else ""}
        { "Previous page JSON Output:" if example is not None else ""}
        { example if example is not None else ""}
        
        { "Example JSON Output:" if example is None else ""}
        { 
            '''
                [
                    {
                        "name: "Chair",
                        "hs": "732690",
                        "hs_m": "llm",
                        "pn": "XG11665",
                        "pn_m": "in",
                        "q": "no",
                        "q_m": "llm",
                        "q_d": "here is your reasoning for quarantine",
                        "Description": "Office Chair",
                        "Quantity": "2",
                        "price": "150.00"
                    },
                    {
                        "name: "Table",
                        "hs": "732469",
                        "hs_m": "in",
                        "pn": None,
                        "pn_m": None,
                        "q": "maybe",
                        "q_m": "llm",
                        "q_d": "here is your reasoning for quarantine",
                        "Description": "Office Table",
                        "Quantity": "3",
                        "price": "1000.00"
                    }
                ]
            ''' 
            if example is None else ""
        }
    """