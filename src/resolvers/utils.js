function isStaleReport(reportDateString, now=new Date(), timeout=1000*60*10) {
    const reportDate = new Date(reportDateString);
    return (Math.abs(now - reportDate)) > timeout;
}


module.exports = { isStaleReport }