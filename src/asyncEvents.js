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
  console.log(`${projectId} getting trailing 15 weeks closed issues...`);
  
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
    console.debug(`${projectId} Response: ${response.status} ${response.statusText} index ${startAt}`);
    results = results.concat(data.issues);
    issuesReturned = data.issues.length;
  }

  return results;
}

const getCurrentBacklogIssues = async (projectId) => {
    let results = [];
    let startAt = 0;
    let issuesReturned = 1;
  
    console.log(`${projectId} Fetching current backlog issues...`)
    
    while (issuesReturned > 0) {
      const queryParams = new URLSearchParams({
        jql: `project=${projectId} AND Resolution is NULL ORDER BY Rank ASC`,
        startAt: startAt,
        fields: 'issuetype'
      });

      let requestRouteString = `/rest/api/3/search?${queryParams}`;
      console.debug(`${projectId} requestJIRA path ${requestRouteString}`);

      const response = await api.asApp()
        .requestJira(route`/rest/api/3/search?${queryParams}`, {
          headers: {
            'Accept': 'application/json'
          }
      });
  
      const data = await response.json();

      console.debug(`${projectId} Response: ${response.status} ${response.statusText} index ${startAt}`);

      if (response.status == 200) {
        results = results.concat(data.issues);
        issuesReturned = data.issues.length;
        startAt = startAt + issuesReturned;
      }
      else {
        console.error(`${projectId} Current issue fetch request error: response: ${response.status} ${response.statusText}`);
        issuesReturned = 0;
      }
    }
  
    return results;
}

asyncResolver.define("event-listener", async ({ payload, context }) => {

    const projectId = payload.projectId;
    console.log(`${projectId} Received event-listener event`);
    console.log(`${projectId} Checking storage for current report jobs...`);
    const currentJobs = await storage.query().limit(19)
      .where('key', startsWith('job:' + projectId))
      .getMany();
  
    await currentJobs.results.map(async (job) => {
      const jobId = job.key.split(':')[2];
      console.log(`${projectId} Current job id ${jobId} found in storage.`);
  
      try {
        const jobProgress = queue.getJob(jobId);
        const response = await jobProgress.getStats();
        const {success, inProgress, failed} = await response.json();
        console.log(`${projectId} Job progress: ${success} success, ${inProgress} in progress, ${failed} failed.`);
        if (success || failed) {
          console.log(`${projectId} Job ${jobId} complete. Removing from storage...`);
          storage.delete(job.key);
        }
      }
      catch(error) {
        if (error instanceof JobDoesNotExistError) {
          console.log(`${projectId} Job ${jobId} does not exist in the queue. Removing from storage...`);
          storage.delete(job.key);
        }
        else {
          console.log(error)
        }
      }
    });
    
    console.log(`${projectId} Completed checking storage for current report jobs`);
    
    console.log(`${projectId} Preparing to generate a new report. `)
    console.log(`${projectId} Pulling project data`);
    const response = await api.asApp()
      .requestJira(route`/rest/api/3/project/${projectId}`, {
        headers: {
          'Accept': 'application/json'
        }
    });
  
    const projectData = await response.json();
  
    console.log(`${projectId} Project data: ${projectData.name}`);
  
    const trailing15WeeksIssuesClosed = await getTrailing15WeeksClosedIssues(projectId);
    console.log(`${projectId} Trailing 15 weeks issues closed found ${trailing15WeeksIssuesClosed.length} issues.`);
  
    const countsByPeriod = getCountsPerPeriod(trailing15WeeksIssuesClosed, 1);
    console.log(`${projectId} Counts by period: ${JSON.stringify(countsByPeriod)}`);
  
    const currentBacklogIssues = await getCurrentBacklogIssues(projectId);
    console.log(`${projectId} Current backlog issues found ${currentBacklogIssues.length} issues.`);

    let report = buildReport(projectData.id, projectData.name, currentBacklogIssues, countsByPeriod);
   
    console.log(`${projectId} Report data: ${JSON.stringify(report)}`);
    await storage.set(projectId, JSON.stringify(report));
    
});
  
  
export const asyncJobHandler = asyncResolver.getDefinitions();
  