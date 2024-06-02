const test = require('node:test');
const assert = require('assert');
const { before, describe, it } = require('node:test');

const { isStaleReport } = require('../../../src/resolvers/utils');

describe('isStaleReport', () => {
    it('should return true if difference is greater than timeout', () => {
        assert(isStaleReport('2024-05-30T11:55:57.727Z', new Date('Sun Jun 02 2024 13:46:34 GMT+0000'), 1000*60*10));
    });

    it('should return false if difference is less than timeout', () => {
        assert(!isStaleReport('2024-06-02T13:45:57.727Z', new Date('Sun Jun 02 2024 13:46:34 GMT+0000'), 1000*60*10));
    });

});
