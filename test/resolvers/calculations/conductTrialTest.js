const test = require('node:test');
const assert = require('assert');
const { before, describe, it } = require('node:test');

const { conductTrial } = require('../../../src/resolvers/calculations');

describe('conductTrial', () => {
    let countsDict = { "5": 1, "4": 4, "3": 3, "2": 2, "1": 1 };
    let counts = null;

    before(() => 
        {
            counts = conductTrial(countsDict, 1, 1.0);
        });

    it('should generate a hash containing a periods value', () => {
        assert(Object.keys(counts['periods']));
    });

    it('should generate a hash containing a history value', () => {
        assert(Object.keys(counts['history']));
    });

    
});
