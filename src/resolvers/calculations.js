

function getCountsPerPeriod(issues, period_length_in_days=1, now=Date.now()) {
    
    if (period_length_in_days < 0) {
        throw new Error("Period length must be greater than zero");
    }

    counts = {}

    let date = null;
    let daysAgo = null;


    issues.map((issue) => {
        date = new Date(issue.resolutiondate);
        let differenceInTime = date.getTime() - now.getTime();

        let differenceInDays = Math.round
            (differenceInTime / (1000 * 3600 * 24))

        daysAgo = Math.round(differenceInDays/period_length_in_days)

        index = daysAgo

        if (!(index in counts)) {
            counts[index] = 1
        }
        else {
            counts[index] += 1
        }
    });

    return counts;
}

module.exports = { getCountsPerPeriod }