"use client";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
// import {GeneralDataProvider} from "@/context/GeneralDataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#483EA8',
    },
    secondary: {
      main: '#A8B348',
    },
    success: {
      main: "#11AF22"
    },
    error: {
      main: "#E41D1D"
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          boxShadow: 'none',
          borderRadius: '8px',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <GeneralDataProvider>
            <ThemeProvider theme={theme}>
              <SnackbarProvider/>
              {children}
            </ThemeProvider>
          </GeneralDataProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
