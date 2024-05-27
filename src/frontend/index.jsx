import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import ProjectSelect from './components/ProjectSelect';
import ForecastReport from './components/ForecastReport';

const App = () => {
  const [projectData, setProjectData] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => {
      invoke('getProjects').then(data => setProjectData(data));
  }, []);

  function handleProjectSelecton(id) {
    setProjectId(id);
    invoke('generateReport', { projectId: id })
      .then((data) => {
        console.log("Current report: ");
        console.log(data);
        setCurrentReport(data);
      });
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
