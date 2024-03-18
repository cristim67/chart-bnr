import { BackendService } from "@genezio-sdk/chart";
import { CsvDataEntry } from "@genezio-sdk/chart";
import "./App.css";
import { useEffect, useState } from "react";

export default function InteractiveChart() {
  const [data, setData] = useState<CsvDataEntry[]>([]);
  const [currencyAvailable, setCurrencyAvailable] = useState<string[]>([]);
  const [dataStart, setDataStart] = useState(new Date());
  const [dataEnd, setDataEnd] = useState(new Date());
  const [valuteOne, setValuteOne] = useState("");
  const [valuteTwo, setValuteTwo] = useState("");

  useEffect(() => {
    async function fetchData() {
      const result = await BackendService.readCsv("./server/dailySeries.csv");
      console.log(result);
      setData(result);
      setCurrencyAvailable(Object.keys(result[0]));
    }

    fetchData();
  }, []);



  return (
   <div className="App">
   </div>
  );
}
