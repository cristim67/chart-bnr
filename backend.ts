import { chromium, Browser } from "playwright";
import { GenezioDeploy, GenezioMethod } from "@genezio/types";

@GenezioDeploy()
export class Backend {
  /**
   * @method downloadCsv
   * @description This method is responsible for downloading a csv file from a website.
   * @param link - The link to the website.
   * @param inputId - The id of the input that will be clicked to download the file.
   * @param inputDownload - The id of the input that will be clicked to download the file.
   * @returns A boolean indicating if the file was downloaded successfully.
   * exemple: downloadCsv("https://www.bnro.ro/Cursul-de-schimb--7372.aspx", "btnGenereaza_668", "ctl00_ctl00_CPH1_CPH1_STATISTICS_REP_5_imgCsv")
   */
  @GenezioMethod()
  async downloadCsv(
    link: string,
    inputId: string,
    inputDownload: string,
  ): Promise<boolean> {
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
      await download.saveAs("dailySeries.csv").then(() => {
        console.log("File downloaded");
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
