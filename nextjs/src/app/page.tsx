"use client";
import FileUpload from "@/components/file-upload";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import React, {useState} from "react";
import {createInvoiceComment, InvoiceGeneralData} from "@/api";
import {
  DataGrid,
  GridToolbarContainer,
  // GridToolbarColumnsButton,
  // GridToolbarFilterButton,
  GridToolbarExport,
  // GridToolbarDensitySelector,
  gridClasses, GridRenderCellParams
} from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import {Button, Grow, TextField, Typography} from "@mui/material";
import Image from "next/image";
import { enqueueSnackbar } from 'notistack';
import Head from "next/head";
import CopyButton from "@/components/copy-button";

export default function Home() {
  const [generalData, setGeneralData] = useState<InvoiceGeneralData>();
  const [comment, setComment] = useState<string>("");
  const [invoiceID, setInvoiceID] = useState<number>();
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  const mainFields = ['Item Name', 'HS Code', 'Part Number'];
  const createDynamicColumns = (data: { [key: string]: string | null }[]) => {
    if (!data || data.length === 0) return [];
    const dynamicFields = Object.keys(data[0]).filter(
      (key) => !mainFields.includes(key)
    );
    return [
      ...mainFields,
      ...dynamicFields,
    ].map((field) => ({
      field,
      headerName: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
      flex: field === "Description" || field === "D E S C R I P T I O N" ? 2.5 : 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          {params.value !== null && <CopyButton text={params.value} />}
          <Typography>{params.value ?? "..."}</Typography>
        </Box>
      ),
    }));
  };
  const createColumns = (data: { [key: string]: string | number | null }[]) => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' '),
      flex: key.toLowerCase() === "value" ? 3 : 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          {params.value !== null && <CopyButton text={params.value} />}
          <Typography>{params.value ?? "..."}</Typography>
        </Box>
      ),
    }));
  };
  const animationStyle = {
    '@keyframes gradientAnimation': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  };
  return (
    <Box display={"flex"} flexDirection={"column"} gap={4} justifyContent={"center"} alignItems={"center"} p={4} minHeight={"100svh"} sx={{background: 'linear-gradient(270deg, #F4F4FF, #E0E7FF, #C7D2FE, #A5B4FC, #F4F4FF)', backgroundSize: "400% 400%", animation: "gradientAnimation 10s ease infinite", ...animationStyle}}>
      <Head>
        <title>Invoice Insight</title>
      </Head>
      {!generalData && <Box display="flex" flexDirection="column" gap={2} justifyContent="center" alignItems="center" position={"absolute"} top={40}>
        <Typography variant="h1" fontWeight={800} fontSize={"36px"} sx={{background: "linear-gradient(90deg, #3E50B4, #8E24AA)", WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent", textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'}}>
          Invoice Insight
        </Typography>
        <Typography component="p" color="textSecondary">
          Transform Your Invoices into Valuable Insights Instantly, Simplifying Your Financial Management!
        </Typography>
      </Box>}
      <Box display="flex" flexDirection="column" bgcolor="white" p={4} borderRadius={4} minWidth={generalData ? "100%" : "50%"} sx={{ transition: "0.5s" }}>
        {!generalData && <FileUpload setGeneralData={setGeneralData} setInvoiceID={setInvoiceID}/>}
        {generalData && invoiceID &&
          <Grow in={true} {...{ timeout: 1000 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={generalData?.general_features || []}
                  columns={createColumns(generalData.general_features)}
                  getRowId={(row) => row.Name}
                  // checkboxSelection
                  // hideFooterPagination={true}
                  // hideFooterSelectedRowCount={true}
                  // hideFooter={true}
                  slots={{
                    toolbar: () => CustomToolbar("General Extracted Data (Not Item-wise)"),
                  }}
                  sx={{
                    borderRadius: "12px",
                  }}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={generalData?.item_wise_features?.map((row, index) => ({
                    ...row,
                    id: index + 1,
                  })) || []}
                  columns={createDynamicColumns(generalData?.item_wise_features)}
                  getRowId={(row) => row.id}
                  // checkboxSelection
                  // hideFooterPagination={true}
                  // hideFooterSelectedRowCount={true}
                  // hideFooter={true}
                  slots={{
                    toolbar: () => CustomToolbar("Items in Invoice with Detected HS Codes and Part Numbers"),
                  }}
                  sx={{
                    borderRadius: "12px",
                  }}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth={true}
                  label={"Feedback/Comment on Invoice Processing"}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  multiline={true}
                  minRows={3}
                  slotProps={{
                    input: {
                      sx: { borderRadius: '12px' },
                    },
                  }}
                />
                <Box display="flex" width={"100%"} justifyContent={"flex-end"} gap={1} mt={1}>
                  <Button variant={"outlined"} onClick={() => setGeneralData(undefined)}>
                    <Image src={"/images/refresh.svg"} alt={"refresh"} width={20} height={20} style={{marginRight: "4px"}}/>
                    Start Over
                  </Button>
                  <Button disabled={!comment || isSubmittingComment} variant={"contained"} onClick={() => {
                    setIsSubmittingComment(true)
                    createInvoiceComment(invoiceID, comment ?? "").then(() => {
                    }).finally(() => {setIsSubmittingComment(false)});
                    enqueueSnackbar("Your feedback has been successfully saved!", {variant: "success"});
                    setComment("");
                  }} >
                    Submit Comment
                    <Image src={"/images/send.svg"} alt={"refresh"} width={20} height={20} style={{marginLeft: "4px"}}/>
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Grow>
        }
      </Box>
    </Box>
  );
}
function CustomToolbar(title: string) {
  return (
    <GridToolbarContainer>
      {/*<GridToolbarColumnsButton />*/}
      {/*<GridToolbarFilterButton />*/}
      {/*<GridToolbarDensitySelector*/}
      {/*  slotProps={{ tooltip: { title: 'Change density' } }}*/}
      {/*/>*/}
      {/*<Box sx={{ flexGrow: 1 }} />*/}
      <Typography ml={1} fontWeight={"bold"}>{title}</Typography>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarExport
        slotProps={{
          tooltip: { title: 'Export data' },
          button: { variant: 'outlined' },
        }}
      />
    </GridToolbarContainer>
  );
}
const ODD_OPACITY = 0.2;

const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: theme.palette.grey[200],
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(
        theme.palette.primary.main,
        ODD_OPACITY + theme.palette.action.selectedOpacity,
      ),
      '&:hover': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY +
          theme.palette.action.selectedOpacity +
          theme.palette.action.hoverOpacity,
        ),
        '@media (hover: none)': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY + theme.palette.action.selectedOpacity,
          ),
        },
      },
    },
  },
}));