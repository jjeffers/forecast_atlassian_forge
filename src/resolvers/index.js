import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";

const resolver = new Resolver();

resolver.define('generateReport', async (req) => {
  console.log(`Generating report for project id ${req.payload.projectId}...`);

  const response = await api.asUser()
    .requestJira(route`/rest/api/3/project/${req.payload.projectId}`, {
      headers: {
        'Accept': 'application/json'
      }
  });

  const projectData = await response.json();
  console.log(`Project data: ${projectData}`);

  const report = { 
    project_id: projectData.id,
    project_name: projectData.name,
    counts_by_period: {},
    lines: [
      { issueId: '1', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '2', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '3', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '4', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '5', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '6', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '7', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
      { issueId: '8', issueKey: 'ISSUE-1', summary: 'First issue', status: 'To Do', data: { "99": 1, "95":1, "85":1, "50":1 } },
    ]
  }

  return report;
})

resolver.define('getProjects', async (req) => {
  console.log('Fetching project information...');

  const response = await api.asUser().requestJira(route`/rest/api/3/project`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    const projectData = await response.json();
    console.log(projectData.map(project => ({ id: project.id, name: project.name })));

    return projectData;
})

export const handler = resolver.getDefinitions();
