const { calculateConfidenceIntervals } = require('./calculations'); 

function isStaleReport(reportDateString, now=new Date(), timeout=1000*60*10) {
    const reportDate = new Date(reportDateString);
    return (Math.abs(now - reportDate)) > timeout;
}

function buildReport(projectId, projectName, backlogIssues, countsByPeriod, now = new Date()) {

    console.log(`${projectId} building report`)
    const reportIssues = calculateConfidenceIntervals(backlogIssues, countsByPeriod);
  
    const report = {
      created_at: now,
      project_id: projectId,
      project_name: projectName,
      counts_by_period: {},
      lines: reportIssues
    }

    return report;
}

module.exports = { isStaleReport, buildReport }