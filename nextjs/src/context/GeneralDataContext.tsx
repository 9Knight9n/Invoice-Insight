import React, { createContext, useContext, useEffect, useState } from 'react';
import { InvoiceGeneralData } from "@/api";

interface GeneralDataContextType {
  generalData: InvoiceGeneralData | null;
  setGeneralData: React.Dispatch<React.SetStateAction<InvoiceGeneralData | null>>;
}

const GeneralDataContext = createContext<GeneralDataContextType | undefined>(undefined);

export const GeneralDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [generalData, setGeneralData] = useState<InvoiceGeneralData | null>(() => {
    const savedData = localStorage.getItem('generalData');
    return savedData ? JSON.parse(savedData) : null;
  });

  useEffect(() => {
    if (generalData) {
      localStorage.setItem('generalData', JSON.stringify(generalData));
    }
  }, [generalData]);

  return (
    <GeneralDataContext.Provider value={{ generalData, setGeneralData }}>
      {children}
    </GeneralDataContext.Provider>
  );
};

export const useGeneralData = (): GeneralDataContextType => {
  const context = useContext(GeneralDataContext);
  if (!context) {
    throw new Error('useGeneralData must be used within a GeneralDataProvider');
  }
  return context;
};