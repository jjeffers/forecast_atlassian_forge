import React, { useEffect, useState, Fragment } from 'react';
import { Select } from '@forge/react';
import { Text } from '@forge/react';

function selectProject(value) {
    console.log(value);
}

function ProjectSelect({projects, onChange}) {
    useEffect(() => {
        console.log('ProjectSelect mounted');
    });
    
    const projectOptions = projects.map((project) => ({ value: project.id, label: project.name }));
    const [selectedOption, setSelectedOption] = useState([projectOptions[0]]);

    const handleSelection = (selection) => {
        console.log(selection);
        setSelectedOption(projectOptions.find(option => option.value === selection.value));
        onChange(selection.value);
    };

    return (
        <Text>
            Select project:
        <Select
            appearance="default"
            options={
                projects.map((project) => ({ value: project.id, label: project.name }))
            }
            value={selectedOption}
            onChange={handleSelection}
        />
        </Text>
    );
  }

  export default ProjectSelect;

