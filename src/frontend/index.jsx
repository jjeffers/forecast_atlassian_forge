import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke, events } from '@forge/bridge';

import ProjectSelect from './components/ProjectSelect';
import ForecastReport from './components/ForecastReport';

const App = () => {
  const [projectData, setProjectData] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => {
      invoke('getProjects').then(data => setProjectData(data));
  }, []);

  useEffect(() => {
    console.log(`Project ID was set to ${projectId}`)
    fetchCurrentReport();
    setInterval(checkForUpdatedReport, 1000*60*1);
  }, [projectId]);

  function fetchCurrentReport() {
    console.log('fetchCurrentReport()');
    if (projectId) {
      console.log(`Fetching current report for project id ${projectId}...`);
      invoke('getCurrentReport', { projectId: projectId })
        .then((data) => {
          if (Object.keys(data).length === 0) {
            console.log("no report found");
          }
          else {
            console.log(`Current report found`);
            console.log(data);
            setCurrentReport(data);
          }
        })
    }
    else {
      console.log("No project selected");
    }
  }

  function checkForUpdatedReport() {
    console.log("checkForUpdatedReport()");
    fetchCurrentReport();
  }

  function handleProjectSelecton(id) {
    console.log(`Project selected: ${id}`);
    setProjectId(id);
  }

  return (
      <>
          {projectData ? <ProjectSelect  projects={projectData} 
            onChange={ handleProjectSelecton } /> : 'Loading...'}   
          {projectId ? 
            currentReport ? <ForecastReport reportData={currentReport} /> :null
            : null }
      </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
