import React, { useEffect, useState, Fragment } from 'react';
import { DynamicTable } from "@forge/react";
import { Text } from "@forge/react";

export default function ForecastReport({reportData}) {
    
    const head = {
        cells: [
          {
            key: "key",
            content: "Name",
          },
          {
            key: "type",
            content: "Type",
          },
          {
            key: "icon",
          },
          {
            key: "ci99",
            content: "99%",
          },
          {
            key: "ci95",
            content: "95%",   
          },
          {
            key: "ci85",
            content: "85%",
          },
          {
            key: "ci50",
            content: "50%",
          },
        ],
      };

    const createKey = (input) => {
      return input ? input.replace(/^(the|a|an)/, "").replace(/\s/g, "") : input;
    }

    const rows = reportData.lines.map((line, index) => ({
        key: `row-${index}-${line.issueId}`,
        cells: [
          {
            content: <Text>{line.issueKey}</Text>
          },
          {
            content: <Text>{line.status}</Text>,
          },
          {
            content: <Text>icon here</Text>,
          },
          {
            content: <Text>{line.data["99"]}</Text>,
          },
          {
              content: <Text>{line.data["95"]}</Text>,
          },
          {
              content: <Text>{line.data["85"]}</Text>,
          },
          {
              content: <Text>{line.data["50"]}</Text>,
          },
        ],
      }));

    return (
        <>
          <DynamicTable
            caption={`Forecast Report for ${reportData.projectName}`}
            head={head}
            rows={rows}
          />
        </>
    );
}