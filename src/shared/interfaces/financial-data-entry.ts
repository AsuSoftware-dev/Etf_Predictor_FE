export interface FinancialDataEntry {
    date: string;
    close_price: number;
    sma_20: number | null; // SMA poate fi null dacă nu sunt suficiente date
    sma_50: number | null;
  }
  