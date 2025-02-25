import React, {useEffect, useState} from "react";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Image from "next/image";
import { styled } from '@mui/material/styles';
import { Stack } from "@mui/material";
import {approveInvoiceItem, disapproveInvoiceItem, getInvoice, InvoiceGeneralData, ItemWiseFeature} from "@/api";

const ApproveCode = ({row, setGeneralData, invoiceID}: {row: ItemWiseFeature, setGeneralData: React.Dispatch<React.SetStateAction<InvoiceGeneralData | null>>, invoiceID: number}) => {
  const [value, setValue] = useState<approvalType>("unknown");
  useEffect(() => {
    if(row.isApproved) setValue("approve");
    else if(row.isDisapproved) setValue("disapprove");
    else setValue("unknown");
  }, [row]);
  const handleChange = (event: React.MouseEvent<HTMLElement>, newValue: approvalType) => setValue(newValue);
  const handleApprove = async () => {
    setValue("approve");
    await approveInvoiceItem(row.id, true);
    await disapproveInvoiceItem(row.id, false);
    getInvoice(Number(invoiceID)).then((response) => {
      if(response.status === "completed") setGeneralData(response);
    })
  }
  const handleDisapprove = async () => {
    setValue("disapprove");
    await disapproveInvoiceItem(row.id, true);
    await approveInvoiceItem(row.id, false);
    getInvoice(Number(invoiceID)).then((response) => {
      if(response.status === "completed") setGeneralData(response);
    })
  }
  const handleUnknown = async () => {
    setValue("unknown");
    await disapproveInvoiceItem(row.id, false);
    await approveInvoiceItem(row.id, false);
    getInvoice(Number(invoiceID)).then((response) => {
      if(response.status === "completed") setGeneralData(response);
    })
  }
  return (
    <Stack spacing={0.5} alignItems={"center"}>
      <ToggleButtonGroup color="primary" value={value} exclusive onChange={handleChange}>
        <StyledToggleButton onClick={handleApprove} value="approve" sx={{ py: 0.2, px: 0.5 }}>
          <Image src="/images/check.svg" alt="check" width={16} height={16}/>
        </StyledToggleButton>
        <StyledToggleButton onClick={handleDisapprove} value="disapprove" sx={{ py: 0.2, px: 0.5 }}>
          <Image src="/images/cross.svg" alt="cross" width={16} height={16}/>
        </StyledToggleButton>
        <StyledToggleButton onClick={handleUnknown} value="unknown" sx={{ py: 0.2, px: 0.5 }}>
          <Image src="/images/question.svg" alt="none" width={16} height={16}/>
        </StyledToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};
const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  '&.Mui-selected': {
    border: `1px solid ${theme.palette.primary.light}`,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  '&:hover': {
    border: `1px solid ${theme.palette.primary.main}`,
  },
}));
export type approvalType = "approve" | "disapprove" | "unknown";
export default ApproveCode;
