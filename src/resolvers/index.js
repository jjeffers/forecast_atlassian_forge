import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";
import { storage, startsWith } from "@forge/api";
import { Queue, JobDoesNotExistError } from '@forge/events';

import { calculateConfidenceIntervals, getCountsPerPeriod } from "./calculations";
import { isStaleReport } from "./utils";
import { invoke } from '@forge/bridge';

const resolver = new Resolver();
const queueName = 'reports';
const queue = new Queue({ key: queueName});

const getTrailing15WeeksClosedIssues = async (projectId) => {
  let results = [];
  let next = true;

  console.log("getting trailing 15 weeks closed issues...")
  const request_route = route`/rest/api/3/search?jql=project=${projectId} AND status=Done AND resolved >= -15w&limit=100&startAt=0`;

  while (next) {
    const response = await api.asApp()
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

const getCurrentBacklogIssues = async (projectId) => {
    let results = [];
    let next = true;
  
    console.log("getting current backlog issues...")
    const request_route = route`/rest/api/3/search?jql=project=${projectId} AND Resolution is NULL ORDER BY Rank ASC&limit=100&startAt=0`;
  
    while (next) {
      const response = await api.asApp()
        .requestJira(request_route, {
          headers: {
            'Accept': 'application/json'
          }
      });
  
      const data = await response.json();
      console.log(`Response: ${response.status} ${response.statusText}`);
      results = results.concat(data.issues);
      next = false;
    }
  
    return results;
}

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
    generateCurrentReport(projectId);
  }
  else if (isStaleReport(currentReport.created_at)) {
    console.log(`Cached report found for project id ${projectId}, created at ${new Date(currentReport.created_at)} is stale, generating a new one...`);
    generateCurrentReport(projectId);
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

resolver.define("event-listener", async ({ payload, context }) => {

  const projectId = payload.projectId;

  console.log(`Checking storage for current report jobs...`);
  const currentJobs = await storage.query().limit(19)
    .where('key', startsWith('job:' + projectId))
    .getMany();


  currentJobs.results.map((job) => {
    const jobId = job.key.split(':')[2];
    console.log(`Current job id ${jobId} found in storage.`);

    try {
      const jobProgress = queue.getJob(jobId);
      const response = jobProgress.getStats();
      const {success, inProgress, failed} = response.json();
      console.log(`Job progress: ${success} success, ${inProgress} in progress, ${failed} failed.`);
    }
    catch(error) {
      if (error instanceof JobDoesNotExistError) {
        console.log(`Job ${jobId} does not exist in the queue. Removing from storage...`);
        storage.delete(currentJob.key);
      }
      else {
        console.log(error)
      }
    }
 
    return
  });
  
  const response = await api.asApp()
    .requestJira(route`/rest/api/3/project/${projectId}`, {
      headers: {
        'Accept': 'application/json'
      }
  });

  const projectData = await response.json();

  console.log(`Project data: ${projectData.name} id ${projectData.id}`);

  const trailing15WeeksIssuesClosed = await getTrailing15WeeksClosedIssues(projectId);
  console.log(`Trailing 15 weeks issues closed found ${trailing15WeeksIssuesClosed.length} issues.`);

  const countsByPeriod = getCountsPerPeriod(trailing15WeeksIssuesClosed, 1);
  console.log(`Counts by period: ${JSON.stringify(countsByPeriod)}`);

  const currentBacklogIssues = await getCurrentBacklogIssues(projectId);
  console.log(`Current backlog issues found ${currentBacklogIssues.length} issues.`);
  console.log(`example issue: ${JSON.stringify(currentBacklogIssues[0])}`)
  const reportIssues = calculateConfidenceIntervals(currentBacklogIssues, countsByPeriod);
  console.log(`Confidence intervals: ${JSON.stringify(confidenceIntervals)}`);

  
  const report = {
    created_at: new Date(),
    project_id: projectData.id,
    project_name: projectData.name,
    counts_by_period: {},
    lines: reportIssues
  }

  const currentReport = await storage.set(projectId, JSON.stringify(report));
});


export const handler = resolver.getDefinitions();
