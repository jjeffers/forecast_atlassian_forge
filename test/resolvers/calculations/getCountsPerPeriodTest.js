const test = require('node:test');
const assert = require('assert');
const { describe, it } = require('node:test');

const { getCountsPerPeriod } = require('../../../src/resolvers/calculations');

describe('getCountsPerPriod', () => {
    it('should generate a hash of counts by period (in time elapsed) with default time (now)', () => {

        issues = [
            { fields: { resolutiondate: "2023-07-05T20:00:00.000-0400" }},
            { fields: { resolutiondate: "2023-07-05T20:00:00.000-0400" }},
            { fields: { resolutiondate: "2023-07-08T20:00:00.000-0400" }},
            { fields: { resolutiondate: "2023-07-10T20:00:00.000-0400" }},
            { fields: { resolutiondate: "2023-07-12T20:00:00.000-0400" }},
            { fields: { resolutiondate: "2023-07-13T20:00:00.000-0400" }},
            { fields: { resolutiondate: "2023-07-15T20:00:00.000-0400" }}
        ]
        let counts = getCountsPerPeriod(issues, 1);
        
        assert.strictEqual(Object.keys(counts).length, 6);
    });


    it('should generate a hash of counts by period (in time elapsed)', () => {

        issues = [
            { fields: { resolutiondate: "2023-07-15T20:00:00.000-0400" }}
        ]
        let counts = getCountsPerPeriod(issues, 1, new Date("2021-07-01"));
        
        assert.strictEqual(Object.keys(counts).length, 1);
    });

    it('should throw an exception if period < 0', () => {

        issues = [
            { fields: { resolutiondate: "2023-07-15T20:00:00.000-0400" }}
        ]

        assert.throws(function() { getCountsPerPeriod(issues, -1, new Date("2021-07-01"))}, Error);
    });

    
});