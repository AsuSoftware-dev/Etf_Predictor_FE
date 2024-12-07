/* eslint-disable @typescript-eslint/no-unused-vars */
import { useQuery } from "react-query";
import { Line } from "react-chartjs-2";
import { FinancialDataEntry } from "./shared/interfaces/financial-data-entry";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CoreChartOptions,
  ElementChartOptions,
  PluginChartOptions,
  DatasetChartOptions,
  ScaleChartOptions,
  LineControllerChartOptions,
} from "chart.js";
import { useState, useCallback } from "react";
import zoomPlugin from "chartjs-plugin-zoom";
import { _DeepPartialObject } from "node_modules/chart.js/dist/types/utils";

// Înregistrare componente ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const apiUrl = import.meta.env.VITE_API_URL;

// Funcția pentru fetch
const fetchFinancialData = async (symbol: string): Promise<FinancialDataEntry[]> => {
  const response = await fetch(`${apiUrl}/data/${symbol}/`);
  return response.json();
};

// Funcția debounce folosind useCallback
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const App = () => {
  const [symbol, setSymbol] = useState("SPY"); // Simbolul ETF implicit
  const [debouncedSymbol, setDebouncedSymbol] = useState("SPY"); // Simbolul debounced

  // Funcția debounce pentru actualizarea simbolului cu întârziere
  const debouncedUpdateSymbol = useCallback(
    debounce((value: string) => setDebouncedSymbol(value), 1000),
    []
  );

  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSymbol = event.target.value.toUpperCase();
    setSymbol(newSymbol); // Actualizare imediată pentru UI
    debouncedUpdateSymbol(newSymbol); // Actualizare cu întârziere pentru fetch
  };

  // Folosește debouncedSymbol pentru query
  const { data, isLoading } = useQuery<FinancialDataEntry[]>(
    ["financialData", debouncedSymbol],
    () => fetchFinancialData(debouncedSymbol),
    { keepPreviousData: true }
  );

  if (isLoading) return <div>Loading...</div>;

  // Configurare date grafic
  const chartData = {
    labels: data?.map((entry) =>
      new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    ),
    datasets: [
      {
        label: "Close Price ($)", // Preț de închidere în USD
        data: data?.map((entry) => entry.close_price),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
      {
        label: "SMA 20 (Simple Moving Average)",
        data: data?.map((entry) => entry.sma_20),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
      },
      {
        label: "SMA 50 (Simple Moving Average)",
        data: data?.map((entry) => entry.sma_50),
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
      },
    ],
  };

  // Configurare opțiuni grafic
  const chartOptions: _DeepPartialObject<CoreChartOptions<"line"> & ElementChartOptions<"line"> & PluginChartOptions<"line"> & DatasetChartOptions<"line"> & ScaleChartOptions<"line"> & LineControllerChartOptions> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${debouncedSymbol} ETF Price Data`,
        font: {
          size: 16,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "xy", // Permite panning atât pe axa X, cât și pe axa Y
        },
        zoom: {
          wheel: {
            enabled: true, // Zoom cu scroll
          },
          pinch: {
            enabled: true, // Zoom cu pinch (pe touchscreen)
          },
          mode: "xy", // Permite zoom atât pe axa X, cât și pe Y
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 12,
          },
          callback: function (tickValue: string | number) {
            if (typeof tickValue === "number") {
              const absValue = Math.abs(tickValue);
              if (absValue >= 1_000_000) {
                return `${tickValue < 0 ? "-" : ""}$${(absValue / 1_000_000).toFixed(2)}M`;
              } else if (absValue >= 1_000) {
                return `${tickValue < 0 ? "-" : ""}$${(absValue / 1_000).toFixed(2)}K`;
              }
              return `${tickValue < 0 ? "-" : ""}$${absValue.toFixed(2)}`;
            }
            return tickValue;
          },
        },
      },
    },
  };

  return (
    <div className="p-8 w-full">
      {/* Titlu și Input */}
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-2">ETF Dashboard</h1>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter ETF Symbol (e.g., SPY)"
            value={symbol}
            onChange={handleSymbolChange}
            className="px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grafic */}
      <div className="p-4 md:px-16" style={{ height: "500px", width: "100%" }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Legendă explicativă */}
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Legend:</h2>
        <ul className="list-disc pl-4 space-y-2 md:space-y-0 md:flex md:flex-row md:space-x-4">
          <li className="md:flex md:items-center">
            <span className="font-bold">Close Price:</span> Prețul de închidere al ETF-ului (în USD).
          </li>
          <li className="md:flex md:items-center">
            <span className="font-bold">SMA 20:</span> Media mobilă simplă calculată pe ultimele 20 de zile.
          </li>
          <li className="md:flex md:items-center">
            <span className="font-bold">SMA 50:</span> Media mobilă simplă calculată pe ultimele 50 de zile.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;
