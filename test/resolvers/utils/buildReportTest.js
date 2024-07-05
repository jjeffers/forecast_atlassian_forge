const test = require('node:test');
const assert = require('assert');
const { before, describe, it } = require('node:test');

const { buildReport } = require('../../../src/resolvers/utils');

describe('buildReport', () => {
    it('should build an empty report with no issues and no counts', () => {
        let report = buildReport(1001, "Kanban Test", [], {})
        assert(Object.keys(report).length > 0);
    });

    it('should build an empty report with some issues and no counts', () => {
        let issues = [];

        Array.from({ length: 5 }, (x, i) => {
            issues.push({ id: i})
        });
        
        let report = buildReport(1001, "Kanban Test", [], {})
        assert(Object.keys(report).length > 0);
    });
});
