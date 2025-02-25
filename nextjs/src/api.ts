const baseUrl = 'http://85.198.9.203:8000';

export const getInvoice = async (invoiceId: number): Promise<InvoiceGeneralData> => {
  const response = await fetch(`${baseUrl}/api/invoices/invoice/${invoiceId}/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.json();
};

export const createInvoiceComment = async (invoiceId: number, text: string) => {
  const response = await fetch(`${baseUrl}/api/invoices/invoice/${invoiceId}/comment/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  return response.json();
};

export const getInvoiceStatus = async (invoiceId: number) => {
  const response = await fetch(`${baseUrl}/api/invoices/status/${invoiceId}/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.json();
};

export const uploadInvoice = async (file: File) => {
  const formData = new FormData();
  formData.append('pdf_file', file);

  const response = await fetch(`${baseUrl}/api/invoices/upload/`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};

export const approveInvoiceItem = async (itemId: number, isApproved: boolean) => {
  const response = await fetch(`${baseUrl}/api/invoices/item/${itemId}/approve/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ isApproved: isApproved }),
  });
  return response.json();
};

export const disapproveInvoiceItem = async (itemId: number, isDisapproved: boolean) => {
  const response = await fetch(`${baseUrl}/api/invoices/item/${itemId}/disapprove/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ isDisapproved: isDisapproved }),
  });
  return response.json();
};

export const getApprovedInvoiceItems = async (): Promise<ApprovedInvoiceItems[]> => {
  const response = await fetch(`${baseUrl}/api/invoices/items/approved/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.json();
};

export const getUploadedInvoices = async (): Promise<UploadHistoryType[]> => {
  const response = await fetch(`${baseUrl}/api/invoices/invoices/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.json();
};

export type UploadHistoryType =  {
  id: 79;
  status: "processing" | "pending" | "completed";
  created_at: string;
  pdf_file_name: string;
}
export type ApprovedInvoiceItems = {
  id: number;
  name: string;
  hs_code: string;
  part_number: string | null;
  metadata: {
    [key: string]: string | null;
  };
}
export type InvoiceGeneralData = {
  id?: number,
  item_wise_features?: ItemWiseFeature[],
  general_features?: {
    Name: string,
    Value: string
  }[];
  status: "processing" | "pending" | "completed";
}

export type ItemWiseFeature = {
  id: number,
  name: string,
  hs_code: string | null,
  hs_code_method: used_method_choices | null,
  part_number: string | null;
  part_number_method: used_method_choices | null;
  quarantine: "maybe" | "yes" | "no";
  quarantine_detail: string,
  quarantine_method: used_method_choices | null;
  isApproved: boolean,
  isDisapproved: boolean,
  metadata: {
    [key: string]: string | null;
  }
}

export type used_method_choices = "naive_llm" | "extracted_from_invoice" | "context_llm";