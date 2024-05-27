const test = require('node:test');
const assert = require('assert');
const { describe, it } = require('node:test');

const { getCountsPerPeriod } = require('../../../src/resolvers/calculations');

describe('getCountsPerPriod', () => {
    it('should generate a hash of counts by period (in time elapsed)', () => {

        issues = [
            { resolutiondate: "2021-07-06" }
        ]
        let counts = getCountsPerPeriod(issues, 1, new Date("2021-07-01"));
        
        assert.strictEqual(Object.keys(counts).length, 1);
    });

    it('should throw an exception if period < 0', () => {

        issues = [
            { resolutiondate: "2021-07-06" }
        ]

        assert.throws(function() { getCountsPerPeriod(issues, -1, new Date("2021-07-01"))}, Error);
    });
});