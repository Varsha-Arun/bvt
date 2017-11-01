'use strict';

var setupTests = require('../../../setupTests.js');
var backoff = require('backoff');

var testSuite = 'SRV_SU_SYSINT';
var testSuiteDesc = 'System Integrations Setup';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var sysInts = [];
    var ghSysIntId = [];
    this.timeout(0);

    before(
      function (done) {
        setupTests().then(
          function () {
            return done();
          },
          function (err) {
            logger.error(testSuite, 'failed to setup tests. err:', err);
            return done(err);
          }
        );
      }
    );

    it('1. Github Auth System Integration',
      function (done) {
        var query = 'masterName=githubKeys&name=auth';
        global.suAdapter.getSystemIntegrations(query,
          function (err, systemIntegrations) {
            if (err) {
              assert.isNotOk(err, 'get sysInt failed with err');
              return done(true);
            }

            var si = _.first(systemIntegrations);
            assert.isOk(si, 'No System Integration found');
            assert.isOk(si.id, 'System Integration should be valid');
            ghSysIntId = si.id;
            sysInts.push(si);
            return done();
          }
        );
      }
    );

    it('2. Bitbucket Auth System Integration',
      function (done) {
        var query = 'masterName=bitbucketKeys&name=auth';
        global.suAdapter.getSystemIntegrations(query,
          function (err, systemIntegrations) {
            if (err) {
              assert.isNotOk(err, 'get sysInt failed with err');
              return done(true);
            }

            var si = _.first(systemIntegrations);
            assert.isOk(si, 'No System Integration found');
            assert.isOk(si.id, 'System Integration should be valid');
            sysInts.push(si);
            return done();
          }
        );
      }
    );

    after(
      function (done) {
        // save account id and apiToken
        global.saveTestResource('enabledSystemIntegrations', sysInts,
          function () {
            return done();
          }
        );
        global.saveTestResource('githubSystemIntegrationId', ghSysIntId,
          function () {
            return done();
          }
        );
      }
    );
  }
);
