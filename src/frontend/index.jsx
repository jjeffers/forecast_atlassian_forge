import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import ProjectSelect from './components/ProjectSelect';
import ForecastReport from './components/ForecastReport';

const App = () => {
  const [projectData, setProjectData] = useState(null);
  const [projectId, setProjectId] = useState(null);
  
  useEffect(() => {
      invoke('getProjects').then(data => setProjectData(data));
  }, []);

  function handleProjectSelecton(id) {
    setProjectId(id);
  }

  return (
      <>
          {projectData ? <ProjectSelect  projects={projectData} 
            onChange={ handleProjectSelecton } /> : 'Loading...'}   
          {projectId ? <Text>Selected project: {projectId}</Text> : null}
          {projectId ? <ForecastReport projectId={projectId} /> :null}
      </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
