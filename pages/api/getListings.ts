// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import objectsToCsv from "objects-to-csv";
import csvtojson from "csvtojson";
import fs from "fs";

type Data = {
  county: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  //get the county url param
  let { county } = req.query;
  county = county + " County";

  console.log("Starting to get listings for " + county);
  let $ = await getHtml(county);
  console.log("HTML Loaded");
  let data = parseTable($);
  console.log("Table Parsed");
  let object = await writeCsv(data);
  console.log("Initial CSV Written");
  let details = await getDetails(object, county);
  console.log("Details Added");

  // //make an api call to reload the cts
  await fetch("http://localhost:3000/api/cts");

  res.status(200).json({ county: county });
}

//get the raw html from the ./lib/table.txt file
const getHtml = async (county: string) => {
  return new Promise(async (resolve, reject) => {
    fs.readFile(
      `./lib/listingTables/${county}.txt`,
      "utf8",
      async (err, data) => {
        let $ = cheerio.load(data);
        resolve($);
      }
    );
  });
};

//parse the html and return an array of objects
const parseTable = ($: any) => {
  const getSpecificElements = ($: any, cell: any, rowData: any, i: number) => {
    if (i === 0) {
      let url = $(cell).find("a").attr("href");
      let pid = $(cell).find("a").attr("href");
      if (typeof pid === "string") {
        pid = pid.slice(30, 50);
      }
      rowData.url = url;
      rowData.pid = pid;
    }

    if (i === 1) {
      rowData.certificateOfSale = $(cell).text().trim();
    }

    if (i === 2) {
      rowData.ticketNumber = $(cell).text().trim();
    }

    if (i === 3) {
      rowData.district = $(cell).text().trim();
    }

    if (i === 4) {
      rowData.map = $(cell).text().trim();
    }

    if (i === 5) {
      rowData.parcel = $(cell).text().trim();
    }

    if (i === 6) {
      rowData.subParcel = $(cell).text().trim();
    }

    if (i === 7) {
      rowData.subSubParcel = $(cell).text().trim();
    }

    if (i === 8) {
      rowData.assessedName = $(cell).text().trim();
    }

    if (i === 9) {
      rowData.legalDescription = $(cell).text().trim();
    }

    if (i === 10) {
      rowData.minimumBid = $(cell).text().trim();
    }

    return rowData;
  };

  //for each row of the table aggregate all variables into an array of objects
  let tableData: any = [];
  $("tr").each((i: any, row: any) => {
    let rowData: any = {};

    //process each row of the table
    $(row)
      .find("td")
      .each((i: any, cell: any) => {
        rowData = getSpecificElements($, cell, rowData, i);
      });

    tableData.push(rowData);
  });

  return tableData;
};

//write object to csv file
const writeCsv = async (data: any) => {
  return new Promise(async (resolve, reject) => {
    const csv = new objectsToCsv(data);
    await csv.toDisk(`./lib/output.csv`, { allColumns: true });
    const obj = await csvtojson().fromFile("./lib/output.csv");
    resolve(obj);
  });
};

//get the data for each of the items in the table
const getDetails = async (data: any, county: string) => {
  return new Promise(async (resolve, reject) => {
    let details = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].url) {
        console.log("getting details for ", data[i].url);
        let webpage = await getWebPageHTML(data[i].url);
        if (webpage) {
          console.log("webpage loaded");
          let parsedWebpage = await parseWebpage(webpage);
          let newObj = combineObjects(data[i], parsedWebpage);
          await deleteRowFromOutput(data[i].pid);
          await writeNewPropertyToFinalOutput(newObj, county);
          console.log("Property Added ", i);
        }
        let random = Math.floor(Math.random());
        await sleep(random);

        if (i === data.length - 1) {
          resolve(null);
        }
      }
    }
  });
};

const getWebPageHTML = async (url: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Launch a new browser instance
      const browser = await puppeteer.launch({ headless: "new" });

      const page = await browser.newPage();

      // Navigate to the URL
      await page.goto(url, { timeout: 5000 });

      // Wait for a specific element or selector that indicates the data has loaded
      await page.waitForSelector(".table-condensed", { timeout: 5000 });

      // Get the page content
      const content = await page.content();

      // Close the browser
      await browser.close();
      resolve(content);
    } catch {
      resolve(null);
    }
  });
};

const parseWebpage = (webpage: any) => {
  let $ = cheerio.load(webpage);
  const propertyDetails: { [key: string]: string } = {};

  //get the #descContent in the description div
  let descContent = $("#descContent");
  let table = descContent.find("table").find("tbody");
  table.find("tr").each((i: any, row: any) => {
    $(row)
      .find("td")
      .each((i: any, cell: any) => {
        let text = $(cell).text().trim();
        let value = $(cell).next().text().trim();
        if (text && value) propertyDetails[text] = value;
      });
  });

  //get the #addrContent in the description div
  descContent = $("#addrContent");
  table = descContent.find("table").find("tbody");
  table.find("tr").each((i: any, row: any) => {
    $(row)
      .find("td")
      .each((i: any, cell: any) => {
        let text = $(cell).text().trim();
        let value = $(cell).next().text().trim();
        if (text && value) propertyDetails[text] = value;
      });
  });

  //get the #buildContent in the description div
  descContent = $("#buildContent");
  table = descContent.find("table").find("tbody");
  table.find("tr").each((i: any, row: any) => {
    $(row)
      .find("td")
      .each((i: any, cell: any) => {
        let text = $(cell).text().trim();
        let value = $(cell).next().text().trim();
        if (text && value) propertyDetails[text] = value;
      });
  });

  //get the #costVContent in the description div
  descContent = $("#costVContent");
  table = descContent.find("table").find("tbody");
  table.find("tr").each((i: any, row: any) => {
    $(row)
      .find("td")
      .each((i: any, cell: any) => {
        let text = $(cell).text().trim();
        let value = $(cell).next().text().trim();
        if (text && value) propertyDetails[text] = value;
      });
  });

  //get the #apprVContent in the description div
  descContent = $("#apprVContent");
  table = descContent.find("table").find("tbody");
  table.find("tr").each((i: any, row: any) => {
    $(row)
      .find("td")
      .each((i: any, cell: any) => {
        let text = $(cell).text().trim();
        let value = $(cell).next().text().trim();
        if (text && value) propertyDetails[text] = value;
      });
  });

  return propertyDetails;
};

const combineObjects = (data: any, parsedWebpage: any) => {
  //combine the data and parsedWebpage into a new object
  let newObj = {
    ...data,
    ...parsedWebpage,
  };

  return newObj;
};

const deleteRowFromOutput = async (pid: string) => {
  return new Promise(async (resolve, reject) => {
    //delete the row from the output.csv file that contains the pid
    const jsonArray = await csvtojson().fromFile("./lib/output.csv");
    const filteredJsonArray = jsonArray.filter((item: any) => {
      return item.pid !== pid;
    });
    const csv = new objectsToCsv(filteredJsonArray);
    await csv.toDisk("./lib/output.csv", { allColumns: true });
    resolve(null);
  });
};

const writeNewPropertyToFinalOutput = async (data: any, county: string) => {
  return new Promise(async (resolve, reject) => {
    //if the county file doesnt exist, create it
    if (!fs.existsSync(`./countyData/${county}.csv`)) {
      fs.writeFileSync(`./countyData/${county}.csv`, "");
    }

    //add the new property to the finalOutput.csv file
    const jsonArray = await csvtojson().fromFile(`./countyData/${county}.csv`);
    jsonArray.push(data);
    const csv = new objectsToCsv(jsonArray);
    await csv.toDisk(`./countyData/${county}.csv`, { allColumns: true });
    resolve(null);
  });
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
