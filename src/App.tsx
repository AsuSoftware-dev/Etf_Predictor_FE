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
import { useState } from "react";
import zoomPlugin from "chartjs-plugin-zoom";
import { _DeepPartialObject } from "node_modules/chart.js/dist/types/utils";

// Înregistrare componente
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

const fetchFinancialData = async (symbol: string): Promise<FinancialDataEntry[]> => {
  const response = await fetch(`http://127.0.0.1:8080/data/${symbol}/`);
  return response.json();
};

const App = () => {
  const [symbol, setSymbol] = useState("SPY"); // Simbolul ETF implicit
  const { data, isLoading, refetch } = useQuery<FinancialDataEntry[]>(
    ["financialData", symbol],
    () => fetchFinancialData(symbol),
    { keepPreviousData: true }
  );

  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(event.target.value.toUpperCase()); // Simbolurile ETF sunt uppercase
  };

  const handleUpdate = () => {
    refetch(); // Actualizează graficul
  };

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
  // Configurare opțiuni grafic
  const chartOptions: _DeepPartialObject<CoreChartOptions<"line"> & ElementChartOptions<"line"> & PluginChartOptions<"line"> & DatasetChartOptions<"line"> & ScaleChartOptions<"line"> & LineControllerChartOptions> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const, // Mutăm legenda în partea de jos
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${symbol} ETF Price Data`, // Afișăm simbolul curent
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
              const absValue = Math.abs(tickValue); // Luăm valoarea absolută
              if (absValue >= 1_000_000) {
                return `${tickValue < 0 ? "-" : ""}$${(absValue / 1_000_000).toFixed(2)}M`; // Milioane
              } else if (absValue >= 1_000) {
                return `${tickValue < 0 ? "-" : ""}$${(absValue / 1_000).toFixed(2)}K`; // Mii
              }
              return `${tickValue < 0 ? "-" : ""}$${absValue.toFixed(2)}`; // Sub 1000
            }
            return tickValue; // În cazul în care tickValue este un string
          },                
        }
      },
    },
  };

  return (
    <div className="p-8 w-full">
      {/* Titlu și Input */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">ETF Dashboard</h1>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter ETF Symbol (e.g., SPY)"
            value={symbol}
            onChange={handleSymbolChange}
            className="px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Update
          </button>
        </div>
      </div>

      {/* Grafic */}
      <div style={{ height: "500px", width: "100%" }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Legendă explicativă */}
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Legend:</h2>
        <ul className="list-disc pl-4">
          <li>
            <span className="font-bold">Close Price:</span> Prețul de închidere al ETF-ului (în USD).
          </li>
          <li>
            <span className="font-bold">SMA 20:</span> Media mobilă simplă calculată pe ultimele 20 de zile.
          </li>
          <li>
            <span className="font-bold">SMA 50:</span> Media mobilă simplă calculată pe ultimele 50 de zile.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;
