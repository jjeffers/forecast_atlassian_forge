import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import ProjectSelect from './components/ProjectSelect';

const App = () => {
  const [projectData, setProjectData] = useState(null);
  const [projectId, setProjectId] = useState(null);

    useEffect(() => {
        invoke('getProjects').then(data => setProjectData(data));
    }, []);

    console.log("app mounted");
    return (
        <>
            {projectData ? <ProjectSelect  projects={projectData} 
              onChange={ (id) => {setProjectId(id)} } /> : 'Loading...'}   
            {projectId ? <Text>Selected project: {projectId}</Text> : null}
        </>
    );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
