'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'SRV_SU_SETUP';
var testSuiteDesc = 'Server Setup Tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    this.timeout(0);

    before(
      function (done) {

        async.series(
          [
            testSetup.bind(null)
          ],
          function (err) {
            if (err) {
              logger.error(test, 'Failed to setup tests. err:', err);
              return done(err);
            }
            logger.debug(test, 'Completed');
            return done();
          }
        );
      }
    );

    it('1. Get Github Auth System Integration',
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

            global.saveTestResource('ghSystemIntegration', si,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('2. Get Bitbucket Auth System Integration',
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
            global.saveTestResource('bbSystemIntegration', si,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    after(
      function (done) {
        return done();
      }
    );
  }
);
