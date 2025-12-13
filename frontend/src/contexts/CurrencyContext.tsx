import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, convertCurrency, formatCurrency, formatCurrencyAmount } from '../utils/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (amount: number) => number;
  format: (amount: number) => string;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'app_currency';

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && ['RUB', 'USD', 'EUR', 'CNY'].includes(stored)) {
      return stored as Currency;
    }
    return 'RUB';
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const convert = (amount: number) => {
    return convertCurrency(amount, currency);
  };

  const format = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const formatAmount = (amount: number) => {
    return formatCurrencyAmount(amount, currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convert,
        format,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

