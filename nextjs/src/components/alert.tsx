import React, { createContext, useContext, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children } : {children: React.ReactNode}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  // const [severity, setSeverity] = useState<"success" | "error" | "info">('info');

  const showAlert = (newMessage: string) => {
    setMessage(newMessage);
    // setSeverity(newSeverity);
    setOpen(true);
  };

  const hideAlert = () => {
    setOpen(false);
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={hideAlert}
        message={message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </AlertContext.Provider>
  );
};