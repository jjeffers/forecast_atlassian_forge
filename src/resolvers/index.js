import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";

const resolver = new Resolver();

const getTrailing15WeeksClosedIssues = async (projectId) => {
  let results = [];
  let next = true;

  console.log("getting trailing 15 weeks closed issues...")
  const request_route = route`/rest/api/3/search?jql=project=${projectId} AND status=Done AND resolved >= -15w&limit=100&startAt=0`;

  while (next) {
    const response = await api.asUser()
      .requestJira(request_route, {
        headers: {
          'Accept': 'application/json'
        }
    });

    const data = await response.json();

    results = results.concat(data.issues);
    data.next? next = data.next : next = false;
  }

  return results;
}

resolver.define('generateReport', async (req) => {
  const projectId = req.payload.projectId;
  
  console.log(`Generating report for project id ${projectId}...`);

  const response = await api.asUser()
    .requestJira(route`/rest/api/3/project/${projectId}`, {
      headers: {
        'Accept': 'application/json'
      }
  });

  const projectData = await response.json();
  console.log(`Project data: ${projectData.name} id ${projectData.id}`);

  const trailing15WeeksIssuesClosed = await getTrailing15WeeksClosedIssues(projectId);

  console.log(`Trailing 15 weeks issues closed found ${trailing15WeeksIssuesClosed.length} issues.`);

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
