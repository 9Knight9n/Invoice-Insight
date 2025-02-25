"use client";
import FileUpload from "@/components/file-upload";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import React, {useState, useEffect} from "react";
import {
  ApprovedInvoiceItems,
  createInvoiceComment,
  getApprovedInvoiceItems,
  getInvoice,
  InvoiceGeneralData,
  ItemWiseFeature
} from "@/api";
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
import Loading from "@/components/loading";
import Modal from '@mui/material/Modal';
import { useSearchParams } from 'next/navigation';
// import {useGeneralData} from "@/context/GeneralDataContext";
import Link from "next/link";
import ApproveCode from "@/components/hs-code-approval";
import MyDataGrid from "@/components/ApprovedDataGrid";
import { Suspense } from "react";

function SearchParamsHandler() {
  const searchParams = useSearchParams();
  return <ChildComponent searchParams={searchParams} />;
}
export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsHandler />
    </Suspense>
  );
}
function ChildComponent({ searchParams }: { searchParams: URLSearchParams }) {
  // const { generalData, setGeneralData } = useGeneralData();
  const [generalData, setGeneralData] = useState<InvoiceGeneralData | null>(null);
  const [comment, setComment] = useState<string>("");
  const [invoiceID, setInvoiceID] = useState<number>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isOpenExportModal, setIsOpenExportModal] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>("");
  const [isOpenApprovedItems, setIsOpenApprovedItems] = useState<boolean>(false);
  const [approvedItems, setApprovedItems] = useState<ApprovedInvoiceItems[]>([]);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setInvoiceID(Number(idParam));
      const checkInvoiceStatus = () => {
        getInvoice(Number(invoiceID)).then((response) => {
          console.log(response.status);
          if (response.status === 'processing' || response.status === 'pending') {
            if (!!response.general_features?.length && !!response.item_wise_features?.length)
              setGeneralData(prevState => ({
                ...prevState, ...response
              }));
            setTimeout(checkInvoiceStatus, 2000);
          } else if (response.status === 'completed') {
            setGeneralData(response);
            setIsLoading(false);
            enqueueSnackbar('Invoice processing completed', {variant: 'success'});
          } else {
            console.log('Invoice status:', response.status);
            setIsLoading(false);
          }
        });
      };
      checkInvoiceStatus();
    }
  }, [setGeneralData, invoiceID, searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [invoiceID]);

  // const mainFields = ['Item Name', 'HS Code', 'Part Number'];
  const createDynamicColumns = (data: { [key: string]: string | null }[]) => {
    if (!data || data.length === 0) return [];
    const dynamicFields = Object.keys(data[0]).filter(
      // (key) => !mainFields.includes(key)
      (key) => key.replaceAll("_", " ")
    );
    return [
      // ...mainFields,
      ...dynamicFields,
    ].map((field) => ({
      field,
      headerName: field.replaceAll("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ").replace(/\bHs Code\b/i, "HS Code"),
      flex: field === "hs_code" ? 2.5 : field === "Description" || field === "D E S C R I P T I O N" ? 2.5 : 1,
      renderCell: (params: GridRenderCellParams) => (
        field === "hs_code" ?
          <Box display="flex" alignItems="center">
            {params.value !== null && <CopyButton text={params.value} />}
            <Box display={"flex"} alignItems={"center"} gap={1}>
              <Typography color={"textPrimary"}>{params.value?.replaceAll("_", " ") || ""}</Typography>
              {params.row.hs_code && invoiceID &&
                <ApproveCode row={params.row} setGeneralData={setGeneralData} invoiceID={Number(searchParams.get("id"))}/>
              }
            </Box>
          </Box> :
          <Box display="flex" alignItems="center">
            {params.value !== null && <CopyButton text={params.value} />}
            <Typography color={params.value === "extracted_from_invoice" ? "success" : params.value === "naive_llm" ? "warning" : params.value === "context_llm" ? "info" : "textPrimary"}>
              {params.value?.toString().replaceAll("_", " ") || ""}
            </Typography>
          </Box>
      ),
    }));
  };
  const createColumns = (data: { [key: string]: string | number | null }[]) => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0])?.map((key) => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' '),
      flex: key.toLowerCase() === "value" ? 3 : 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          {params.value !== null && <CopyButton text={params.value} />}
          <Typography>{params.value?.toString().replaceAll("_", " ") || "..."}</Typography>
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
  const processItemWiseFeatures = <T extends Partial<ItemWiseFeature>>(
    itemWiseFeatures: T[],
    hasID: boolean
  ) => {
    return itemWiseFeatures?.map((row) => {
      const { metadata, ...rest } = row;
      if (hasID)
        return {
          ...rest,
          ...metadata,
          // id: (index + 1).toString()
        };
      else return { ...rest, ...metadata };
    });
  };
  return (
    <Box display={"flex"} flexDirection={"column"} gap={4} justifyContent={"center"} alignItems={"center"} p={{md: 4, xs: 1}} minHeight={"100svh"} sx={{background: 'linear-gradient(270deg, #F4F4FF, #E0E7FF, #C7D2FE, #A5B4FC, #F4F4FF)', backgroundSize: "400% 400%", animation: "gradientAnimation 10s ease infinite", ...animationStyle}}>
      <Head>
        <title>Invoice Insight</title>
      </Head>
      {!generalData && <Box display="flex" flexDirection="column" gap={2} justifyContent="center" alignItems="center" position={"absolute"} top={40}>
        <Typography variant="h1" fontWeight={800} fontSize={"36px"} sx={{background: "linear-gradient(90deg, #3E50B4, #8E24AA)", WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent", textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'}}>
          Invoice Insight
        </Typography>
        <Typography component="p" color="textSecondary" textAlign={"center"}>
          Transform Your Invoices into Valuable Insights Instantly, Simplifying Your Financial Management!
        </Typography>
      </Box>}
      <Box display="flex" flexDirection="column" bgcolor="white" p={4} borderRadius={4} minWidth={generalData ? "100%" : "50%"} maxWidth={"100%"} sx={{ transition: "0.5s" }}>
        {!generalData && <FileUpload setGeneralData={setGeneralData} setInvoiceID={setInvoiceID} isLoading={isLoading} setIsLoading={setIsLoading}/>}
        {generalData && invoiceID &&
          <Grow in={true} {...{ timeout: 1000 }}>
            <Grid container spacing={2}>
              {isLoading &&<Grid size={{xs: 12, md: 12}}>
                <Box mt={-4} display={"flex"} flexDirection={"column"} alignItems={"center"} justifyContent={"center"} width={"100%"} textAlign={"center"}>
                  <Loading/>
                  <Typography mt={-4} color={"textSecondary"}>Still processing your data. Please wait a moment.</Typography>
                </Box>
              </Grid>}
              <Grid size={{ xs: 12, md: 12 }}>
                <Box display={"flex"} alignItems={"center"} gap={1}>
                  <Button variant={"contained"} onClick={() => setIsOpenExportModal(true)}>
                    <Image src={"/images/download.svg"} alt={"download"} width={20} height={20} style={{marginRight: "4px"}}/>
                    export for expedient
                  </Button>
                  <Button variant={"outlined"} onClick={() => {
                    setIsOpenApprovedItems(true);
                    getApprovedInvoiceItems().then(r => setApprovedItems(r));
                  }}>
                    <Image src={"/images/approvedList.svg"} alt={"approved-list"} width={20} height={20} style={{marginRight: "4px"}}/>
                    Approved Items
                  </Button>
                  <Button variant={"outlined"} disabled={true}>
                    <Image src={"/images/uploadfile.svg"} alt={"approved-list"} width={20} height={20} style={{marginRight: "4px"}}/>
                    Upload Approved Items File
                  </Button>
                </Box>
                <Modal keepMounted open={isOpenApprovedItems} onClose={() => setIsOpenApprovedItems(false)}>
                  <Box sx={modalStyle}>
                    <MyDataGrid data={approvedItems}/>
                  </Box>
                </Modal>
                <Modal keepMounted open={isOpenExportModal} onClose={() => setIsOpenExportModal(false)}>
                  <Box sx={modalStyle}>
                    <TextField
                      fullWidth
                      placeholder={"Enter the project name here ..."}
                      slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      label={"Project Name"}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                    <StripedDataGrid
                      editMode="row"
                      isCellEditable={() => true}
                      rowHeight={30}
                      columnHeaderHeight={40}
                      rows={processItemWiseFeatures(generalData?.item_wise_features ?? [], true).map(row => ({
                        ...row,
                        projectName: projectName
                      }))}
                      columns={[{
                        field: 'projectName',
                        headerName: 'Project Name',
                        width: 150,
                        renderCell: () => projectName
                      }, // eslint-disable-next-line
                        ...createDynamicColumns(processItemWiseFeatures(generalData?.item_wise_features?.map(({ hs_code_method, part_number_method, quarantine_method, quarantine, quarantine_detail, isApproved, isDisapproved, ...rest }) => rest) ?? [], false))
                      ]}
                      getRowId={(row) => row.id}
                      slots={{ toolbar: () => CustomToolbar("Expedient Export Preview", projectName, "contained" ) }}
                      sx={{ borderRadius: "12px" }}
                      getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'}
                      rowSelection={false}
                    />
                  </Box>
                </Modal>
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={generalData?.general_features || []}
                  columns={createColumns(generalData.general_features ?? [])}
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
                  rowSelection={false}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={processItemWiseFeatures(generalData?.item_wise_features ?? [], true)}  // eslint-disable-next-line
                  columns={createDynamicColumns(processItemWiseFeatures(generalData?.item_wise_features?.map(({isApproved, isDisapproved, ...rest }) => rest) ?? [], false))}
                  getRowId={(row) => row.id}
                  // checkboxSelection
                  // hideFooterPagination={true}
                  // hideFooterSelectedRowCount={true}
                  // hideFooter={true}
                  slots={{
                    toolbar: () => CustomToolbar("Items in Invoice with Detected HS Codes and Part Numbers (Detailed)"),
                  }}
                  sx={{
                    borderRadius: "12px",
                  }}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                  }
                  rowSelection={false}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={processItemWiseFeatures(generalData?.item_wise_features ?? [], true)}
                  columns={createDynamicColumns(processItemWiseFeatures(generalData?.item_wise_features?.map(({name, hs_code, hs_code_method, part_number, part_number_method, quarantine}) => ({ name, hs_code, hs_code_method, part_number, part_number_method, quarantine })) ?? [], false))}
                  getRowId={(row) => row.id}
                  // checkboxSelection
                  // hideFooterPagination={true}
                  // hideFooterSelectedRowCount={true}
                  // hideFooter={true}
                  slots={{
                    toolbar: () => CustomToolbar("Items in Invoice with Detected HS Codes and Part Numbers (Summary)"),
                  }}
                  sx={{
                    borderRadius: "12px",
                  }}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                  }
                  rowSelection={false}
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
                  <Link href={"/"}>
                    <Button
                      variant={"outlined"}
                      onClick={() => {
                        setGeneralData(null);
                        // localStorage.removeItem('generalData');
                      }}
                    >
                      <Image src={"/images/refresh.svg"} alt={"refresh"} width={20} height={20} style={{marginRight: "4px"}}/>
                      Start Over
                    </Button>
                  </Link>
                  <Button disabled={!comment || isSubmittingComment} variant={"contained"} onClick={() => {
                    setIsSubmittingComment(true)
                    createInvoiceComment(invoiceID, comment ?? "").then(() => {
                    }).finally(() => {setIsSubmittingComment(false)});
                    enqueueSnackbar("Your feedback has been successfully saved!", {variant: "success"});
                    setComment("");
                  }}>
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
function CustomToolbar(title: string, exportName: string = "export", variantBtn: "outlined" | "text" | "contained" = "outlined") {
  return (
    <GridToolbarContainer>
      <Typography ml={1} fontWeight={"bold"}>{title}</Typography>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarExport
        csvOptions={{fileName: `${exportName || title}`}}
        slotProps={{
          tooltip: { title: exportName },
          button: { variant: variantBtn as "outlined" | "text" | "contained", children: exportName},
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
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: "90%",
  height: "90%",
  backgroundColor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 4,
  display: "flex",
  flexDirection: 'column',
  gap: 1,
};