import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Link from "next/link";
import path from "path";
import numeral from "numeral";
import { MouseEvent } from "react";

const csv = require("csvtojson");

export default function Home({ data }: { data: any }) {
  const [sortedData, setSortedData] = useState(data);
  const [county, setCounty] = useState("Brooke");

  useEffect(() => {
    let counties = Object.keys(data);
    setCounty(counties[0]);
  }, [data]);

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

  return (
    <main className={`min-h-screen p-12 `}>
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
          </tr>
        </thead>

        <tbody>
          {sortedData && sortedData[county]
            ? sortedData[county].map((row: any) => {
                let object = JSON.stringify(row);
                return (
                  <tr
                    className="hover:bg-slate-700 group hover:p-4 text-gray-200"
                    key={row.pid}
                  >
                    <DataElement
                      text="info"
                      link={`/property?data=${encodeURIComponent(object)}`}
                    />
                    <DataElement text={row.certificateOfSale} />
                    <DataElement text={row["Acreage (deed)"]} format="acres" />
                    <DataElement
                      text={row["Total Appraisal"]}
                      format="dollars"
                    />
                    <DataElement
                      text={row["Building Appraisal"]}
                      format="dollars"
                    />
                    <DataElement text={row["minimumBid"]} format="dollars" />
                    <DataElement
                      text={row["Pysical Address(often incomplete)"]}
                      format="addr"
                    />
                    <DataElement text={row["Land use"]} />
                    <DataElement text={row["pid"]} link={row["url"]} />
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
}: {
  text: string;
  format?: "s" | "sqft" | "acres" | "dollars" | "addr" | "pid";
  link?: string;
}) => {
  const hover = "group-hover:scale-100";

  if (format === "dollars") {
    text = numeral(text).format("$0,0");
    return <td className={`px-4 py-1 text-xs text-center ${hover}`}>{text}</td>;
  } else if (format === "sqft") {
    text = numeral(text).format("0,0");
    return <td className={`px-4 py-1 text-xs text-center ${hover}`}>{text}</td>;
  } else if (format === "acres") {
    text = numeral(text).format("0,0.0");
    return <td className={`px-4 py-1 text-xs text-center ${hover}`}>{text}</td>;
  } else if (format === "addr") {
    return <td className={`px-4 py-1 text-xs text-center ${hover}`}>{text}</td>;
  } else if (link) {
    return (
      <td className={`px-4 py-1 text-xs text-center ${hover}`}>
        <Link href={link} target="_blank" className="underline text-blue-200">
          {text}
        </Link>
      </td>
    );
  } else {
    return <td className={`px-4 py-1 text-xs text-center ${hover}`}>{text}</td>;
  }
};

//get server side props
export const getServerSideProps: GetServerSideProps = async (context) => {
  // get a list of all file names in ./countyData
  const fs = require("fs");
  const files = fs.readdirSync("./countyData");

  let obj: { [key: string]: any } = {};

  for (let i = 0; i < files.length; i++) {
    const csvFilePath = path.resolve(`./countyData/${files[i]}`);
    const jsonArray = await csv().fromFile(csvFilePath);
    obj[files[i].replace(".csv", "")] = jsonArray;
  }

  return {
    props: { data: obj },
  };
};
