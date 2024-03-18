import { Browser, chromium } from "playwright";
import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import fs from "fs";
import {CsvDataEntry} from "./models/excelTypes";


@GenezioDeploy()
export class BackendService {
  constructor() {
    console.log("Backend initialized");
  }

  /**
   * @method downloadCsv
   * @description This method is responsible for downloading a csv file from a website.
   * @param link - The link to the website.
   * @param inputId - The id of the input that will be clicked to download the file.
   * @param inputDownload - The id of the input that will be clicked to download the file.
   * @param nameFile - The name of the file that will be downloaded.
   * @returns A boolean indicating if the file was downloaded successfully.
   * @example downloadCsv("https://www.bnro.ro/Cursul-de-schimb--7372.aspx", "btnGenereaza_668", "ctl00_ctl00_CPH1_CPH1_STATISTICS_REP_5_imgCsv")
   */
  @GenezioMethod()
  async downloadCsv(
    link: string,
    inputId: string,
    inputDownload: string,
    nameFile: string,
  ): Promise<void> {
    console.log("Downloading file...");
    const browser: Browser = await chromium.launch({
      headless: false,
    });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(link);
      await page.waitForLoadState();
      await page.waitForSelector(`#${inputId}`, { state: "visible" });
      await page.click(`#${inputId}`);
      await page.waitForTimeout(3000);
      await page.waitForSelector(`#${inputDownload}`, { state: "visible" });
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.click(`#${inputDownload}`),
      ]);
      await download.saveAs(nameFile).then(() => {
        console.log("File downloaded");
      });
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    }
  }

  /**
   * @method generateCsvCronJob
   * @description This method is responsible for generating a csv file from a website using a cron job.
   * @returns A boolean indicating if the file was generated successfully.
   * @example generateCsvCronJob()
   */
  @GenezioMethod({ type: "cron", cronString: "0 2 * * *" })
  async generateCsvCronJob(): Promise<void> {
    console.log("Cron job started at: ", new Date());
    const link = "https://www.bnro.ro/Cursul-de-schimb--7372.aspx";
    const inputId = "btnGenereaza_668";
    const inputDownload = "ctl00_ctl00_CPH1_CPH1_STATISTICS_REP_5_imgCsv";
    const inputIdArchive = "btnGenereaza_702";
    const inputDownloadArchive =
      "ctl00_ctl00_CPH1_CPH1_STATISTICS_REP_5_imgCsv";
    try {
      await this.downloadCsv(link, inputId, inputDownload, "dailySeries.csv");
      await this.downloadCsv(
        link,
        inputIdArchive,
        inputDownloadArchive,
        "archive.csv",
      );
      const dataDailySeries = await this.readCsv("dailySeries.csv");
      const dataArchive = await this.readCsv("archive.csv");
      console.log(dataDailySeries);
      console.log(dataArchive);
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    }
  }

  @GenezioMethod()
  async readCsv(csvFileName: string): Promise<CsvDataEntry[]> {
    console.log("Reading csv file...");
    const dataCsv: string[] = fs.readFileSync(csvFileName, "utf8").split("\n");
    const nameColumns: string[] = dataCsv[5].split(";");

    return dataCsv.slice(6).map((row: string) => {
      const rowValues: string[] = row.split(";");
      const entry: CsvDataEntry = {};
      nameColumns.forEach((column: string, index: number) => {
        entry[column] = rowValues[index];
      });
      return entry;
    });
  }
}
