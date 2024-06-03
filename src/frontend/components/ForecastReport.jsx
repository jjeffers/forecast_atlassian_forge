import React, { useEffect, useState, Fragment } from 'react';
import { DynamicTable, Text, } from "@forge/react";

function formatReportCreationDate(date) {
    return new Date(date).toLocaleString('en-US');
}

function formatCIDatatoDate(daysFromNow) {
    var date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toLocaleDateString('en-US');
}

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
            content: <Text>{line.issue_key}</Text>
          },
          {
            content: <Text>{line.issue_type}</Text>,
          },
          {
            content: <Text>{formatCIDatatoDate(line.data["99"])}</Text>,
          },
          {
              content: <Text>{formatCIDatatoDate(line.data["95"])}</Text>,
          },
          {
              content: <Text>{formatCIDatatoDate(line.data["85"])}</Text>,
          },
          {
              content: <Text>{formatCIDatatoDate(line.data["50"])}</Text>,
          },
        ],
      }));

    return (
        <>
          <DynamicTable
            caption={`Forecast Report for ${reportData.project_name}, generated at ${formatReportCreationDate(reportData.created_at)}`}
            head={head}
            rows={rows}
          />
        </>
    );
}