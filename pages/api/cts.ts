// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import objectsToCsv from "objects-to-csv";
import csvtojson from "csvtojson";
import fs from "fs";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let counties = [
    "Kanawha County",
    "Ohio County",
    "Brooke County",
    "Mon County",
    "Fayette County",
    "Summers County",
    "Monroe County",
    "Greenbrier County",
  ];

  for (let i = 0; i < counties.length; i++) {
    let targetCounty = counties[i];
    let $ = await getHtml(targetCounty);
    let data = parseTable($);
    await writeCsv(data, targetCounty);
    console.log("CTS CSV written for " + targetCounty);
  }

  res.status(200).json({ name: "John Doe" });
}

//get the raw html from the ./lib/table.txt file
const getHtml = async (location: string) => {
  return new Promise(async (resolve, reject) => {
    fs.readFile(
      `./lib/certifiedToState/${location}.txt`,
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
      rowData.certificateOfSale = $(cell).find("a").text().trim();
    }

    if (i === 5) {
      let containsCertified = $(cell).text().trim().indexOf("CERTIFIED");
      if (containsCertified === 0) {
        rowData.parcel = $(cell).text().trim();
        let locationStart = rowData.parcel.indexOf("Upcoming Land Sale") + 19;
        rowData.saleDate = rowData.parcel.slice(
          locationStart,
          locationStart + 10
        );
        rowData.parcel = "CERTIFIED";
      } else {
        rowData.saleDate = null;
        rowData.parcel = "REDEEMED";
      }
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

    //push the row data to the table data array
    tableData.push(rowData);
  });

  return tableData;
};

//write object to csv file
const writeCsv = async (data: any, county: string) => {
  return new Promise(async (resolve, reject) => {
    const csv = new objectsToCsv(data);
    await csv.toDisk(`./countyData/propertyCertification/${county}.csv`, {
      allColumns: true,
    });
    const obj = await csvtojson().fromFile(
      `./countyData/propertyCertification/${county}.csv`
    );
    resolve(obj);
  });
};
