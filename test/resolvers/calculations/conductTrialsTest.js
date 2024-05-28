const test = require('node:test');
const assert = require('assert');
const { before, describe, it } = require('node:test');

const { conductTrials } = require('../../../src/resolvers/calculations');

describe('conductTrials', () => {
    let countsDict = { "5": 1, "4": 4, "3": 3, "2": 2, "1": 1 };
    let confidence_intervals = null;

    before(() => 
        {
            confidence_intervals = conductTrials(countsDict, 10, 1.0);
        });

    it('should a hash of confidence intervals with a 99 quantile', () => {
        assert(confidence_intervals['99']);
    });

    it('should a hash of confidence intervals with a 95 quantile', () => {
        assert(confidence_intervals['95']);
    });

    it('should a hash of confidence intervals with a 85 quantile', () => {
        assert(confidence_intervals['85']);
    });

    it('should a hash of confidence intervals with 50 quantile', () => {
        assert(confidence_intervals['50']);
    });
    
});
