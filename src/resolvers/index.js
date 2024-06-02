import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";
import { storage, startsWith } from "@forge/api";
import { Queue } from '@forge/events';

import { isStaleReport } from "./utils";

const resolver = new Resolver();
const queueName = 'reports';
const queue = new Queue({ key: queueName });

async function generateCurrentReport(projectId) {
  console.log(`Queing new report for ${projectId}...`);

  const jobId = await queue.push({projectId: projectId});

  console.log(`Job id ${jobId} queued for project id ${projectId}.`);
  console.log(`Storing key \"${'job' + ':' + projectId + ':' + jobId}\" in storage...`);

  storage.set('job' + ':' + projectId + ':' + jobId, {});

  return jobId;
}

resolver.define('getCurrentReport', async (req) => {
  const projectId = req.payload.projectId;

  console.log(`Checking for cached report for project id ${projectId}...`);
  const currentReportData = await storage.get(projectId);
  const currentReport = currentReportData? JSON.parse(currentReportData) : {};

  if (Object.keys(currentReport).length === 0) {
    console.log(`No cached report found for project id ${projectId}, generating one now...`);
    await generateCurrentReport(projectId);
  }
  else if (isStaleReport(currentReport.created_at)) {
    console.log(`Cached report found for project id ${projectId}, created at ${new Date(currentReport.created_at)} is stale, generating a new one...`);
    await generateCurrentReport(projectId);
  }

  if (currentReport) {
    console.log(`Cached report found for project id ${projectId}`);
  }
  else {
    console.log(`No cached report found for project id ${projectId}`);
  }

  return currentReport;
});

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
