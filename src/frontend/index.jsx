import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import { storage } from '@forge/api';

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
    if (projectId) {
      invoke('getCurrentReport', { projectId: projectId })
      .then((data) => {
        if (Object.keys(data).length === 0) {
          console.log("no report found")
          invoke('generateCurrentReport', { projectId: projectId })
          .then((data) => {
            console.log(`Current report is being generated, job id ${data}`);
          });
        }
        else {
          console.log(`Current report found`);
          console.log(data);
          setCurrentReport(data);
        }
      })
    }
  }, [projectId]);

  function handleProjectSelecton(id) {
    setProjectId(id);
  }

  return (
      <>
          {projectData ? <ProjectSelect  projects={projectData} 
            onChange={ handleProjectSelecton } /> : 'Loading...'}   
          {projectId ? <Text>Selected project: {projectId}</Text> : null}
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
