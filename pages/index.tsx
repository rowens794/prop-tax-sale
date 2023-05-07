import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Link from "next/link";
import path from "path";
import numeral from "numeral";
import { MouseEvent } from "react";
import fs from "fs";

const csv = require("csvtojson");

export default function Home({ data, certs }: { data: any; certs: any }) {
  const [sortedData, setSortedData] = useState(data);
  const [county, setCounty] = useState("Brooke");
  const [savedCerts, setSavedCerts] = useState([]);

  useEffect(() => {
    let counties = Object.keys(data);
    setCounty(counties[0]);
  }, [data]);

  useEffect(() => {
    //get savedCerts from local storage
    let savedCerts = localStorage.getItem("savedCerts");
    if (!savedCerts) {
      savedCerts = "[]";
    }
    let savedCertsArr: [] = JSON.parse(savedCerts);
    setSavedCerts(savedCertsArr);
  }, []);

  const handleSort = (e: any) => {
    const keys: { [key: string]: any } = {
      "Cert ID": "certificateOfSale",
      Acreage: "Acreage (deed)",
      "Tot. Appraisal": "Total Appraisal",
      "Building Appr.": "Building Appraisal",
      "Min Bid": "minimumBid",
      Address: "Pysical Address(often incomplete)",
      "Land use": "Land use",
      Parcel: "pid",
    };

    let key = keys[e.target.innerText];
    let sorted = [...sortedData[county]];

    sorted = sorted.sort((a: any, b: any) => {
      let sortA = a[key];
      let sortB = b[key];

      //check if a or b are numbers
      if (numeral(a[key]).value() || numeral(b[key]).value()) {
        sortA = numeral(a[key]).value();
        sortB = numeral(b[key]).value();
      }

      if (isNaN(sortA) && isNaN(sortB)) {
        return 0;
      } else if (isNaN(sortA) && !isNaN(sortB)) {
        return 1;
      } else if (!isNaN(sortA) && isNaN(sortB)) {
        return -1;
      } else if (sortA < sortB) {
        return 1;
      } else if (sortA > sortB) {
        return -1;
      } else {
        return 0;
      }
    });

    //update the sorted county
    let updatedParent = { ...sortedData };
    updatedParent[county] = sorted;

    setSortedData(updatedParent);
  };

  const saveCertToLocal = (cert: string) => {
    //get savedCerts from local storage
    let savedCerts = localStorage.getItem("savedCerts");
    if (!savedCerts) {
      savedCerts = "[]";
    }
    let savedCertsArr: [] = JSON.parse(savedCerts);

    let certString = `${county}-${cert}`;

    //check if cert is already saved remove it
    //@ts-ignore
    let index = savedCertsArr.indexOf(certString);
    if (index > -1) savedCertsArr.splice(index, 1);
    //@ts-ignore
    else savedCertsArr.push(certString);

    //save to local storage
    localStorage.setItem("savedCerts", JSON.stringify(savedCertsArr));
    setSavedCerts(savedCertsArr);
  };

  console.log(savedCerts);

  return (
    <main className={`min-h-screen p-12 bg-gray-800`}>
      <Link
        href="https://www.wvsao.gov/CountyCollections/Default#SB552LandSalesListings"
        className="text-gray-400 underline text-sm mr-4"
      >
        Auditor Land Sale Listings
      </Link>
      <Link
        href="https://www.wvsao.gov/CountyCollections/Default#SB552LandSalesListings"
        className="text-gray-400 underline text-sm mr-4"
      >
        Auditor Land Sale Listings
      </Link>
      <div className="flex flex-row gap-4 font-light">
        {Object.keys(data).map((countyName) => {
          return (
            <button
              key={countyName}
              className={`${
                county === countyName ? "text-gray-200" : "text-gray-400"
              }`}
              onClick={() => setCounty(countyName)}
            >
              {countyName}
            </button>
          );
        })}
      </div>

      <table className="mt-12">
        <thead>
          <tr>
            <HeaderElement text="" onClick={handleSort} />
            <HeaderElement text="Cert ID" onClick={handleSort} />
            <HeaderElement text="Acreage" onClick={handleSort} />
            <HeaderElement text="Tot. Appraisal" onClick={handleSort} />
            <HeaderElement text="Building Appr." onClick={handleSort} />
            <HeaderElement text="Min Bid" onClick={handleSort} />
            <HeaderElement text="Address" onClick={handleSort} />
            <HeaderElement text="Land use" onClick={handleSort} />
            <HeaderElement text="Parcel" onClick={handleSort} />
            <HeaderElement text="Date" onClick={handleSort} />
          </tr>
        </thead>

        <tbody>
          {sortedData && sortedData[county]
            ? sortedData[county].map((row: any) => {
                let object = JSON.stringify(row);
                let certID = row.certificateOfSale;
                let certRecord = certs[county][certID];
                return (
                  <tr
                    className="hover:bg-slate-700 group hover:p-4 text-gray-200"
                    key={row.pid}
                  >
                    <DataElement
                      text="info"
                      link={`/property?data=${encodeURIComponent(object)}`}
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row.certificateOfSale}
                      onClick={() => saveCertToLocal(row.certificateOfSale)}
                      format="cert"
                      status={certRecord.parcel === "CERTIFIED"}
                      savedCerts={savedCerts}
                      county={county}
                    />
                    <DataElement
                      text={row["Acreage (deed)"]}
                      format="acres"
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row["Total Appraisal"]}
                      format="dollars"
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row["Building Appraisal"]}
                      format="dollars"
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row["minimumBid"]}
                      format="dollars"
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row["Pysical Address(often incomplete)"]}
                      format="addr"
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row["Land use"]}
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={row["pid"]}
                      link={row["url"]}
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={certRecord.saleDate}
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                    <DataElement
                      text={certRecord.parcel}
                      format="status"
                      status={certRecord.parcel === "CERTIFIED"}
                    />
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
    </main>
  );
}

const HeaderElement = ({
  text,
  onClick,
}: {
  text: string;
  onClick?: (event: MouseEvent<HTMLParagraphElement>) => void;
}) => {
  return (
    <th className="px-4 py-2 text-sm text-gray-200 cursor-pointer">
      <p onClick={onClick}>{text}</p>
    </th>
  );
};

const DataElement = ({
  text,
  format,
  link,
  status,
  onClick,
  savedCerts,
  county,
}: {
  text: string;
  format?:
    | "s"
    | "sqft"
    | "acres"
    | "dollars"
    | "addr"
    | "pid"
    | "status"
    | "cert";
  link?: string;
  status?: boolean;
  savedCerts?: string[];
  county?: string;
  onClick?: (event: MouseEvent<HTMLParagraphElement>) => void;
}) => {
  const hover = "group-hover:scale-100";

  if (format === "dollars") {
    text = numeral(text).format("$0,0");
    return (
      <td
        className={`px-4 py-1 text-xs text-center ${hover} ${
          !status && "text-gray-500"
        }`}
      >
        {text}
      </td>
    );
  } else if (format === "sqft") {
    text = numeral(text).format("0,0");
    return (
      <td
        className={`px-4 py-1 text-xs text-center ${hover} ${
          !status && "text-gray-500"
        }`}
      >
        {text}
      </td>
    );
  } else if (format === "acres") {
    text = numeral(text).format("0,0.0");
    return (
      <td
        className={`px-4 py-1 text-xs text-center ${hover} ${
          !status && "text-gray-500"
        }`}
      >
        {text}
      </td>
    );
  } else if (format === "addr") {
    return (
      <td
        className={`px-4 py-1 text-xs text-center ${hover} ${
          !status && "text-gray-500"
        }`}
      >
        <p className="w-[250px] overflow-ellipsis overflow-hidden whitespace-nowrap">
          {text}
        </p>
      </td>
    );
  } else if (format === "status") {
    return (
      <td
        className={`px-4 py-1 text-xs text-center ${hover} ${
          status ? "text-green-500" : "text-red-500"
        }`}
      >
        {text}
      </td>
    );
  } else if (format === "cert") {
    let activeCertFormatting = "text-blue-600 px-6";
    let testString = `${county}-${text}`;
    if (savedCerts && savedCerts.includes(testString)) {
      activeCertFormatting = "text-yellow-500 font-bold px-4";
    }

    return (
      <td
        className={` py-1 text-xs text-center cursor-pointer ${activeCertFormatting} ${hover} ${
          !status && "text-gray-500"
        }`}
        // @ts-ignore
        onClick={() => onClick(text)}
      >
        {text}
      </td>
    );
  } else if (link) {
    return (
      <td className={`px-4 py-1 text-xs text-center ${hover} `}>
        <Link
          href={link}
          target="_blank"
          className={`underline ${!status ? "text-gray-500" : "text-blue-200"}`}
        >
          {text}
        </Link>
      </td>
    );
  } else {
    return (
      <td
        className={`px-4 py-1 text-xs text-center ${hover} ${
          !status && "text-gray-500"
        }`}
      >
        {text}
      </td>
    );
  }
};

//get server side props
export const getServerSideProps: GetServerSideProps = async (context) => {
  // get a list of all csv file names in ./countyData
  let counties = fs.readdirSync("./countyData");

  //remove the .csv from the file names
  counties = counties.map((county) => {
    return county.slice(0, -4);
  });

  //remove propertyCertifica from the list
  counties = counties.filter((county) => {
    return county !== "propertyCertifica";
  });

  let obj: { [key: string]: any } = {};
  let certs: { [key: string]: any } = {};

  //create an object for each county
  counties.forEach((county) => {
    certs[county] = {};
  });

  for (let i = 0; i < counties.length; i++) {
    //get the data from each file
    const csvFilePath = path.resolve(`./countyData/${counties[i]}.csv`);
    let jsonArray = await csv().fromFile(csvFilePath);
    obj[counties[i]] = jsonArray;

    //get the certificate of sale data
    const certFilePath = path.resolve(
      `./countyData/propertyCertification/${counties[i]}.csv`
    );

    jsonArray = await csv().fromFile(certFilePath);
    jsonArray.forEach((row: any) => {
      certs[counties[i]][row["certificateOfSale"]] = {
        parcel: row["parcel"],
        saleDate: row["saleDate"],
      };
    });
  }

  return {
    props: { data: obj, certs: certs },
  };
};
