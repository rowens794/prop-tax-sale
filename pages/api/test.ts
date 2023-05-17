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

  let object: { [key: string]: any } = {};

  for (let i = 0; i < counties.length; i++) {
    let targetCounty = counties[i];
    let data = await readCsv(targetCounty);
    //@ts-ignore
    data.forEach((row: any) => {
      console.log(row["Land use"]);
      object[row["Land use"]] = 1;
    });
  }

  console.log(Object.keys(object));

  res.status(200).json({ name: "John Doe" });
}

//read to csv file to object
const readCsv = async (county: string) => {
  return new Promise(async (resolve, reject) => {
    let csv = await csvtojson().fromFile(`./countyData/${county}.csv`);
    resolve(csv);
  });
};
