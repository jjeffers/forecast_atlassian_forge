var ss = require('simple-statistics')

function getCountsPerPeriod(issues, period_length_in_days=1, now=new Date()) {
    if (period_length_in_days < 0) {
        throw new Error("Period length must be greater than zero");
    }

    let counts = {};
    let date = null;
    let daysAgo = null;

    //console.debug(`Calculating counts per period for ${issues.length} issues`);

    issues.map((issue) => {

        date = new Date(issue.fields.resolutiondate);
        let differenceInTime = date.getTime() - now.getTime();

        let differenceInDays = Math.round
            (differenceInTime / (1000 * 3600 * 24))

        daysAgo = Math.abs(Math.round(differenceInDays/period_length_in_days))

        if (!(daysAgo in counts)) {
            counts[daysAgo] = 1
        }
        else {
            counts[daysAgo] += 1
        }
    });

    return counts;
}

function conductTrial(countsByPeriodDictionary, issueDepth, growthRate) {
    let trialDepth = issueDepth * growthRate;
    let trial_history = [];
        
    while (trialDepth > 0) {
        var keys = Object.keys(countsByPeriodDictionary);
        countIndex = keys[Math.floor(keys.length * Math.random())];
        //console.debug(`Simulating pace for trial depth ${trialDepth}, countIndex ${countIndex}`);
        let simulatedPace = countsByPeriodDictionary[countIndex];
        //console.debug(`Simulated pace: ${simulatedPace}`)
            
        trial_history.push(simulatedPace)
        trialDepth -= simulatedPace
    }

    return { periods: trial_history.length, history: trial_history }
}

function conductTrials(countsByPeriodDictionary, issueDepth, growthRate) {

    trials = {}
    
    numberOfTrials = 100

    if (Object.keys(countsByPeriodDictionary).length <= 0) {
        return {};
    }

    for(let i = 0; i < numberOfTrials ; i++) {
        trials [i] = conductTrial(countsByPeriodDictionary, issueDepth, growthRate)
    }

    //console.debug(`Trials: ${JSON.stringify(trials)}`)
    //console.debug(`Trial values: ${Object.values(trials)}`)
    periods = Object.values(trials).map((trial) => trial['periods'] )

    //console.log(`Periods: ${JSON.stringify(periods)}`);
    //console.log(ss.quantile(periods, 0.99))
    confidenceIntervals = {
        "99": Math.round(ss.quantile(periods, 0.99)),
        "95": Math.round(ss.quantile(periods, 0.95)),
        "85": Math.round(ss.quantile(periods, 0.85)),
        "50": Math.round(ss.quantile(periods, 0.50))
    } 

    return confidenceIntervals;
}

function calculateConfidenceIntervals(unresolvedIssues, countsByPeriodDictionary, growthRate = 1.0){
    reportIssues = []

    totalIssueDepth = unresolvedIssues.length;

    //console.debug(`Calculating confidence intervals, ${totalIssueDepth} issues to run trials for.`);

    unresolvedIssues.map((issue, index) => {

      //console.debug(`Conducting trials for issue #{issue.key}`);
      let trial_data = conductTrials(countsByPeriodDictionary, index+1, growthRate)

      let issue_data = {
          issue_external_id: issue.issue_id,
          issue_key: issue.key,
          issue_type: issue.fields.issuetype.name,
          data: trial_data,
      }

      reportIssues.push(issue_data);
        
    });

    return reportIssues;
}

module.exports = { getCountsPerPeriod, calculateConfidenceIntervals, conductTrials, conductTrial }