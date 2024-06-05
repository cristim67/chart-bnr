import { useEffect, useState } from "react";
import { BackendService } from "@genezio-sdk/chart";
import { CsvDataEntry } from "@genezio-sdk/chart";
import { Line } from "react-chartjs-2";
import 'chart.js/auto';
export default function InteractiveChart() {
  const [data, setData] = useState<CsvDataEntry[]>([]);
  const [currencyAvailable, setCurrencyAvailable] = useState<string[]>([]);
  const [dataStart, setDataStart] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
  const [dataEnd, setDataEnd] = useState(new Date());
  const [valuteOne, setValuteOne] = useState("dolar SUA (lei) CURSZ_USD");
  const [valuteTwo, setValuteTwo] = useState("leu (lei) CURSZ_RON");

  const shuffle = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    async function fetchData() {
      const result = await BackendService.readCsv("dailySeries.csv");
      console.log(result);
      setData(result);
      setCurrencyAvailable(
        shuffle(
        Object.keys(result[0])
          .filter((item) => item !== "Data").concat("leu (lei) CURSZ_RON")
        )
      );
    }

    fetchData();
  }, []);

  const filteredData = data.filter(entry => {
    const date = new Date(entry.Data);
    return date >= dataStart && date <= dataEnd;
  });

  const parseCurrency = (value: string) => parseFloat(value.replace(',', '.'));

  const getRelativeValues = (data: CsvDataEntry[], currencyOne: string, currencyTwo: string) => {
    return data.map(entry => {
      const valueOne = currencyOne === "leu (lei) CURSZ_RON" ? 1 : parseCurrency(entry[currencyOne]);
      const valueTwo = currencyTwo === "leu (lei) CURSZ_RON" ? 1 : parseCurrency(entry[currencyTwo]);
      return valueOne / valueTwo; // calculate the ratio
    });
  };

  const chartDataConversion = {
    labels: filteredData.map(entry => entry.Data),
    datasets: [
      {
        label: `${valuteOne} / ${valuteTwo}`,
        data: getRelativeValues(filteredData, valuteOne, valuteTwo),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
      }
    ],
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Currency Exchange Chart
      </h1>
      <form className="flex flex-wrap justify-center gap-4 mb-8 bg-white p-6 rounded-lg shadow-md">
        <label className="flex flex-col items-center mb-4">
          <span className="text-gray-600 mb-1">Start Date:</span>
          <input
            className="p-2 border border-gray-300 rounded"
            type="date"
            value={dataStart.toISOString().split("T")[0]}
            onChange={(e) => setDataStart(new Date(e.target.value))}
          />
        </label>
        <label className="flex flex-col items-center mb-4">
          <span className="text-gray-600 mb-1">End Date:</span>
          <input
            className="p-2 border border-gray-300 rounded"
            type="date"
            value={dataEnd.toISOString().split("T")[0]}
            onChange={(e) => setDataEnd(new Date(e.target.value))}
          />
        </label>
        <label className="flex flex-col items-center mb-4">
          <span className="text-gray-600 mb-1">Currency 1:</span>
          <select
            className="p-2 border border-gray-300 rounded"
            value={valuteOne}
            onChange={(e) => setValuteOne(e.target.value)}
          >
            {currencyAvailable.map((currency) => (
              <option key={currency} value={currency} className="text-gray-800">
                {currency}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col items-center mb-4">
          <span className="text-gray-600 mb-1">Currency 2:</span>
          <select
            className="p-2 border border-gray-300 rounded"
            value={valuteTwo}
            onChange={(e) => setValuteTwo(e.target.value)}
          >
            {currencyAvailable.map((currency) => (
              <option key={currency} value={currency} className="text-gray-800">
                {currency}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        {data.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Chart</h2>
            <div className="text-center text-gray-800 mb-4">
              <p className="mb-2">
                Start Date: {dataStart.toISOString().split("T")[0]} - End Date:{" "}
                {dataEnd.toISOString().split("T")[0]}
              </p>
              <p>
                Currency 1: {valuteOne} - Currency 2: {valuteTwo}
              </p>
            </div>
            <div className="relative" style={{height: '400px'}}>
              <Line data={chartDataConversion} options={{
                responsive: true,
                maintainAspectRatio: false,
              }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
