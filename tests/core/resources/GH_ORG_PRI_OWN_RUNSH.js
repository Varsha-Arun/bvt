'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_PRI_OWN_RUNSH';
var testSuiteDesc = 'Github Organization owner private repo, runSh tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var subscriptionIntegration = {};
    var successStatusCode = null;
    var runShCode = null;
    var testRunJob = {};
    var testRunParamJob = {};
    var testNoRunParamJob = {};
    var testRunSSH = {};
    var testCommitRun = {};
    var testOutRun = {};

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
            ownerApiAdapter =
              global.newApiAdapterByStateAccount('ghOwnerAccount');

            successStatusCode = _.findWhere(global.systemCodes,
              {name: 'success', group: 'status'}).code;

            runShCode = _.findWhere(global.systemCodes,
              {name: 'runSh', group: 'resource'}).code;

            var query = {name: global.GH_ORG_SUB_INT_GH};
            ownerApiAdapter.getSubscriptionIntegrations(query,
              function (err, si) {
                if (err)
                  return done(
                    new Error(
                      util.format('User cannot get subscriptionIntegration %s, ' +
                        'err: %s', global.GH_ORG_SUB_INT_GH, err)
                    )
                  );
                // check if build triggered in previous test case is present
                assert.isNotEmpty(si, 'Subscription Integration cannot be empty');

                subscriptionIntegration = _.first(si);
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Owner should be able to get test_run runSh job',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(res, 'User resources cannot be empty');

            testRunJob = _.findWhere(res, {
              "typeCode": runShCode,
              "name": 'test_run'
            });
            assert.isNotEmpty(testRunJob, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('2. Owner should be able to trigger test_run runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testRunJob.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('3. test_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testRunJob,
          'test_run', successStatusCode, done);
      }
    );

    it('4. Owner should be able to get test_param_run runSh job',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(res, 'User resources cannot be empty');

            testRunParamJob =
              _.findWhere(res, {
                "typeCode": runShCode,
                "name": 'test_param_run'
              });
            assert.isNotEmpty(testRunJob, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('5. test_param_run build was triggered automatically and was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testRunParamJob,
          'test_param_run', successStatusCode, done);
      }
    );

    it('6. Owner should be able to get test_param_norun runSh job',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(res, 'User resources cannot be empty');

            testNoRunParamJob = _.findWhere(res, {
              "typeCode": runShCode,
              "name": 'test_param_norun'
            });
            assert.isNotEmpty(testRunJob, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('7. test_param_norun was not triggered automatically',
      function (done) {
        var query = util.format('resourceIds=%s', testNoRunParamJob.id);
        ownerApiAdapter.getBuilds(query,
          function (err, builds) {
            if (err)
              return reject(
                new Error(
                  util.format('Failed to get builds for query %s with ' +
                    'err %s', util.inspect(query), util.inspect(err)
                  )
                )
              );

            assert.isEmpty(builds, 'Builds were not triggered automatically');
            return done();
          }
        );
      }
    );

    it('8. Owner should be able to trigger test_param_norun runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testNoRunParamJob.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('9. test_param_norun build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testNoRunParamJob,
          'test_param_norun', successStatusCode, done);
      }
    );

    it('10. Owner should be able to get test_ssh runSh job',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(res, 'User resources cannot be empty');

            testRunSSH = _.findWhere(res, {
              "typeCode": runShCode,
              "name": 'test_ssh'
            });
            assert.isNotEmpty(testRunSSH, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('11. Owner should be able to trigger test_ssh runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testRunSSH.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('12. test_ssh build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testRunSSH,
          'test_ssh', successStatusCode, done);
      }
    );

    it('13. Owner should be able to get test_commit_run runSh job',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(res, 'User resources cannot be empty');

            testCommitRun = _.findWhere(res, {
              "typeCode": runShCode,
              "name": 'test_commit_run'
            });
            assert.isNotEmpty(testCommitRun, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('14. test_commit_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testCommitRun,
          'test_commit_run', successStatusCode, done);
      }
    );

    it('15. Owner should be able to get test_out_run runSh job',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(res, 'User resources cannot be empty');

            testOutRun = _.findWhere(res, {
              "typeCode": runShCode,
              "name": 'test_out_run'
            });
            assert.isNotEmpty(testOutRun, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('16. test_out_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testOutRun,
          'test_out_run', successStatusCode, done);
      }
    );

    after(
      function (done) {
        return done();
      }
    );
  }
);
