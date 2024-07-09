import fs from "fs";
import http from "http";

const args = process.argv.slice(2);
const url = args[0];

console.log(`Fetching OpenAPI schema from ${url}`);

// load the url from the internet
http.get(url, (res) => {
  let data = "";

  // A chunk of data has been received.
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    const parsedData = JSON.parse(data);

    // Access the components property
    const schemas = parsedData.components.schemas;

    let result = "";

    for (const schema in schemas) {
      if (schemas[schema].type === "object") {
        result += `export interface ${schema} {\n`;

        // Access the schema properties
        const properties = schemas[schema].properties;

        for (const property in properties) {
          const type = properties[property].type;
          if (type === "array") {
            if (properties[property].items.type) {
              result += `  ${property}: ${properties[property].items.type}[];\n`;
            } else {
              result += `  ${property}: ${properties[property].items.$ref.split("/").pop()}[];\n`;
            }
          } else {
            let type = properties[property].type;

            if (type) {
              if (type === "integer") {
                type = "number";
              }

              result += `  ${property}: ${type};\n`;
            } else {
              result += `  ${property}: ${properties[property].$ref.split("/").pop()};\n`;
            }
          }
        }

        result += "}\n\n";
      } else if (schemas[schema].type === "integer") {
        result += `export enum ${schema} {\n`;

        // Access the schema properties
        const properties = schemas[schema].enum;
        for (const property in properties) {
          result += `  ${schema}${property},\n`;
        }

        result += "}\n\n";
      }
    }

    // Write the result to a new TypeScript file
    fs.writeFile("types.ts", result, "utf8", (err) => {
      if (err) {
        console.error(`Error writing file: ${err}`);
      } else {
        console.log("Types have been written to types.ts");
      }
    });
  });
});
