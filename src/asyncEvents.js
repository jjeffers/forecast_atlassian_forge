import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";
import { storage, startsWith } from "@forge/api";
import { Queue, JobDoesNotExistError } from '@forge/events';
import { getCountsPerPeriod } from "./resolvers/calculations";
import { buildReport } from "./resolvers/utils";

const asyncResolver = new Resolver();

const queue = new Queue({ key: 'reports' });

const getTrailing15WeeksClosedIssues = async (projectId) => {
  let results = [];
  let startAt = 0;
  let issuesReturned = 1;
  console.log("getting trailing 15 weeks closed issues...")
  
  while (issuesReturned > 0) {
    let request_route = route`/rest/api/3/search?jql=project=${projectId} AND status=Done AND resolved >= -15w&startAt=${startAt}`;
    const response = await api.asApp()
      .requestJira(request_route, {
        headers: {
          'Accept': 'application/json'
        }
    });

    const data = await response.json();

    startAt = startAt + data['total'];
    console.debug(`Response: ${response.status} ${response.statusText} index ${startAt}`);
    results = results.concat(data.issues);
    issuesReturned = data.issues.length;
  }

  return results;
}

const getCurrentBacklogIssues = async (projectId) => {
    let results = [];
    let startAt = 0;
    let issuesReturned = 1;
  
    console.log("getting current backlog issues...")
    
    while (issuesReturned > 0) {
      let request_route = route`/rest/api/3/search?jql=project=${projectId} AND Resolution is NULL ORDER BY Rank ASC&startAt=${startAt}&fields=issuetype`;
      const response = await api.asApp()
        .requestJira(request_route, {
          headers: {
            'Accept': 'application/json'
          }
      });
  
      const data = await response.json();

      console.debug(`Response: ${response.status} ${response.statusText} index ${startAt}`);
      results = results.concat(data.issues);
      issuesReturned = data.issues.length;
      startAt = startAt + issuesReturned;
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

    let report = buildReport(projectData.id, projectData.name, currentBacklogIssues, countsByPeriod);
   
    await storage.set(projectId, JSON.stringify(report));
    
});
  
  
export const asyncJobHandler = asyncResolver.getDefinitions();
  