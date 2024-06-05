import { Browser, chromium } from "playwright";
import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import fs from "fs";
import path from 'path';
import { CsvDataEntry } from "./models/excelTypes";
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  keyFilename: "./config/thinking-glass-425111-v0-c4932ebb81d9.json",
});

const tmpDir = '/tmp/';
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

@GenezioDeploy()
export class BackendService {
  private readonly bucketName: string;

  constructor() {
    console.log("Backend initialized");
    this.bucketName = 'bucket-cristimiloiu';
  }

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
      const filePath = path.join(tmpDir, nameFile);
      await download.saveAs(filePath).then(() => {
        console.log("File downloaded");
      });
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    } finally {
      await browser.close();
    }
  }

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
      await this.uploadCsvToGCS("dailySeries.csv");
      await this.uploadCsvToGCS("archive.csv");
      console.log("Successfully downloaded and uploaded csv files to GCS.")
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    }
  }

  @GenezioMethod()
  async readCsv(csvFileName: string): Promise<CsvDataEntry[]> {
    console.log(`Reading csv file ${csvFileName}...`);
    const filePath = path.join(tmpDir, csvFileName);
    if (!fs.existsSync(filePath)) {
      const csvFileNameDownload = csvFileName.replace("/tmp/", "");
      console.log(`File ${csvFileName} not found. Downloading from GCS...`);
      await this.downloadCsvFromGCS(csvFileNameDownload);
    }

    const dataCsv: string[] = fs.readFileSync(filePath, "utf8").split("\n");
    console.log(dataCsv.length);
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

  @GenezioMethod()
  async uploadCsvToGCS(csvFileName: string): Promise<void> {
    console.log(`Uploading ${csvFileName} to GCS...`);
    try {
      const bucket = storage.bucket(this.bucketName);
      const filePath = path.join(tmpDir, csvFileName);
      await bucket.upload(filePath, {
        destination: csvFileName,
      });
      console.log(`Successfully uploaded ${csvFileName} to GCS`);
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    }
  }

  @GenezioMethod()
  async downloadCsvFromGCS(csvFileName: string): Promise<void> {
    console.log(`Downloading ${csvFileName} from GCS...`);
    try {
      const bucket = storage.bucket(this.bucketName);
      const filePath = path.join(tmpDir, csvFileName);
      await bucket.file(csvFileName).download({ destination: filePath });
      if (!fs.existsSync(filePath)) {
        throw new Error(`File ${csvFileName} not found in GCS`);
      }
      console.log(`Successfully downloaded ${csvFileName} from GCS`);
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    }
  }
}
