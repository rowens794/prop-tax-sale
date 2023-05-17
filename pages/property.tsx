import { GetServerSideProps } from "next";
import Link from "next/link";
import numeral from "numeral";

export default function Home({ data }: { data: any }) {
  return (
    <main className={`min-h-screen p-12 bg-black`}>
      <h1 className="text-gray-300 pt-4 pb-2 underline text-lg">
        Property Identification
      </h1>
      <div>
        <RowElement
          title="Address"
          text={data["Pysical Address(often incomplete)"]}
        />
        <RowElement title="Legal Name" text={data["legalDescription"]} />
        <RowElement title="District Name" text={data["District Name"]} />
        <RowElement title="County ID" text={data["County ID"]} />
        <RowElement title="Map" text={data["map"]} />
        <RowElement title="Deed Book" text={data["Deed Book"]} />
        <RowElement title="Deed Page" text={data["Deed Page"]} />
        <RowElement title="Parcel Number" text={data["Parcel Number"]} />
        <RowElement title="Parcel Suffix" text={data["Parcel Suffix"]} />
        <RowElement title="Parcel ID" text={data["pid"]} />
        <RowElement title="Ticket Number" text={data["ticketNumber"]} />
        <RowElement
          title="Certificate of Sale"
          text={data["certificateOfSale"]}
        />
        <RowElement title="Tax Class" text={data["Tax Class"]} />
        <RowElement title="Tax Year" text={data["Tax Year"]} />
      </div>

      <h1 className="text-gray-300 pt-6 pb-2 underline text-lg">Valuation</h1>
      <div>
        <RowElement title="Total Appraisal" text={data["Total Appraisal"]} />
        <RowElement
          title="Building Appraisal"
          text={data["Building Appraisal"]}
        />
        <RowElement title="Land Appraisal" text={data["Land Appraisal"]} />
        <RowElement title="Dwelling Value" text={data["Dwelling Value"]} />
        <RowElement title="Commercial Value" text={data["Commercial Value"]} />
        <RowElement title="Minimum Bid" text={data["minimumBid"]} />
      </div>

      <h1 className="text-gray-300 pt-6 pb-2 underline text-lg">
        Property Details
      </h1>
      <div>
        <RowElement title="Acreage (deed)" text={data["Acreage (deed)"]} />
        <RowElement title="Land Use" text={data["Land use"]} />
        <RowElement title="Year built" text={data["Year built"]} />
        <RowElement
          title="Architectural Style"
          text={data["Architectural style"]}
        />
        <RowElement
          title="# of main BLDGs"
          text={data["# of main BLDGs (cards)"]}
        />
        <RowElement title="# of units" text={data["# of units"]} />
        <RowElement title="Cubic feet" text={data["Cubic feet"]} />
        <RowElement
          title="Business Living Area"
          text={data["Business Living Area"]}
        />
        <RowElement title="Basement Type" text={data["Basement Type"]} />
        <RowElement title="Basement" text={data["Basement"]} />
        <RowElement
          title="Construction Type"
          text={data["Construction Type"]}
        />
        <RowElement title="Exterior wall" text={data["Exterior wall"]} />
        <RowElement
          title="Property Class Type"
          text={data["Property Class Type"]}
        />
        <RowElement title="Story height" text={data["Story height"]} />
        <RowElement title="Total rooms" text={data["Total rooms"]} />
        <RowElement title="Story height" text={data["Story height"]} />
        <RowElement title="Owner" text={data["assessedName"]} />
      </div>
    </main>
  );
}

const RowElement = ({
  title,
  text,
  format,
}: {
  title: string;
  text: string;
  format?: string;
}) => {
  return (
    <div className=" text-gray-200">
      <DataElement text={title} format={"left"} />
      <DataElement text={text} format={format} />
    </div>
  );
};

const DataElement = ({
  text,
  format,
  link,
}: {
  text: string;
  format?: "s" | "sqft" | "acres" | "dollars" | "addr" | "pid" | "left" | any;
  link?: string;
}) => {
  if (format === "dollars") {
    text = numeral(text).format("$0,0");
    return (
      <p className={`px-4  text-center inline-block text-gray-300`}>{text}</p>
    );
  } else if (format === "sqft") {
    text = numeral(text).format("0,0");
    return (
      <p className={`px-4  text-center inline-block text-gray-300`}>{text}</p>
    );
  } else if (format === "acres") {
    text = numeral(text).format("0,0.0");
    return (
      <p className={`px-4  text-center inline-block text-gray-300`}>{text}</p>
    );
  } else if (format === "addr") {
    return (
      <p className={`px-4  text-center inline-block text-gray-300`}>{text}</p>
    );
  } else if (format === "left") {
    return (
      <p className={`pr-4 w-64  text-left inline-block text-gray-300`}>
        {text}
      </p>
    );
  } else if (link) {
    return (
      <p className={`px-4  text-center inline-block text-gray-300`}>
        <Link href={link} target="_blank" className="underline text-blue-200">
          {text}
        </Link>
      </p>
    );
  } else {
    return (
      <p className={`px-4  text-center inline-block text-gray-300`}>{text}</p>
    );
  }
};

//get server side props
export const getServerSideProps: GetServerSideProps = async (context) => {
  // get the data element from the url
  const data = context.query.data;
  //parse the data element into a json object
  const obj = JSON.parse(data as string);

  return {
    props: { data: obj },
  };
};
