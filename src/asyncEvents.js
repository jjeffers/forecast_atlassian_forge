import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";
import { storage, startsWith } from "@forge/api";
import { Queue, JobDoesNotExistError } from '@forge/events';
import { calculateConfidenceIntervals, getCountsPerPeriod } from "./resolvers/calculations";

const asyncResolver = new Resolver();

const queue = new Queue({ key: 'reports' });

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
    const request_route = route`/rest/api/3/search?jql=project=${projectId} AND Resolution is NULL ORDER BY Rank ASC&limit=100&startAt=0&fields=issuetype`;
  
    while (next) {
      const response = await api.asApp()
        .requestJira(request_route, {
          headers: {
            'Accept': 'application/json'
          }
      });
  
      const data = await response.json();
      console.log(`Response: ${response.status} ${response.statusText}`);
      console.log(data.issues[0]);
      results = results.concat(data.issues);
      next = false;
    }
  
    return results;
}

asyncResolver.define("event-listener", async ({ payload, context }) => {

    const projectId = payload.projectId;
    console.log(`Received event-listener event for project ${projectId}...`);
    console.log("Building report for project id " + projectId); 
    console.log(`Checking storage for current report jobs...`);
    const currentJobs = await storage.query().limit(19)
      .where('key', startsWith('job:' + projectId))
      .getMany();
  
    await currentJobs.results.map(async (job) => {
      const jobId = job.key.split(':')[2];
      console.log(`Current job id ${jobId} found in storage.`);
  
      try {
        const jobProgress = queue.getJob(jobId);
        const response = await jobProgress.getStats();
        const {success, inProgress, failed} = await response.json();
        console.log(`Job progress: ${success} success, ${inProgress} in progress, ${failed} failed.`);
        if (success || failed) {
          console.log(`Job ${jobId} complete. Removing from storage...`);
          storage.delete(job.key);
        }
      }
      catch(error) {
        if (error instanceof JobDoesNotExistError) {
          console.log(`Job ${jobId} does not exist in the queue. Removing from storage...`);
          storage.delete(job.key);
        }
        else {
          console.log(error)
        }
      }
    });
    
    
    console.log(`Pulling project data for project id ${projectId}... `);
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
  
    await storage.set(projectId, JSON.stringify(report));
    
});
  
  
export const asyncJobHandler = asyncResolver.getDefinitions();
  