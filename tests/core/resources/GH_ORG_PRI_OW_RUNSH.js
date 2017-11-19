'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_PRI_OW_RUNSH';
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

            testRunJob = _.findWhere(res, {"typeCode": runShCode, "name": 'test_run'});
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
      function () {
        return new Promise(
          function (resolve, reject) {

            var expBackoff = backoff.exponential(
              {
                initialDelay: 1000, // ms
                maxDelay: 6400, // max retry interval of 2 seconds
                failAfter: 30 // fail after 30 attempts(~60 sec)
              }
            );

            expBackoff.on('backoff',
              function (number, delay) {
                logger.info('rSync in progress. Retrying after ', delay, ' ms');
              }
            );

            expBackoff.on('ready',
              function () {
                var query = util.format('resourceIds=%s', testRunJob.id);
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

                    if (_.isEmpty(builds))
                      return expBackoff.backoff(); // wait till builds are created

                    var build = _.first(builds);
                    if (build.statusCode !== successStatusCode) {
                      expBackoff.backoff();
                    } else {
                      expBackoff.reset();
                      return resolve();
                    }
                  }
                );
              }
            );

            // max number of backoffs reached
            expBackoff.on('fail',
              function () {
                return reject(new Error('Max number of back offs reached'));
              }
            );

            expBackoff.backoff();
          }
        );
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
              _.findWhere(res, {"typeCode": runShCode, "name": 'test_param_run'});
            assert.isNotEmpty(testRunJob, 'User could not find runSh Job');

            return done();
          }
        );
      }
    );

    it('5. test_param_run build was triggered automatically and was successful',
      function () {
        return new Promise(
          function (resolve, reject) {

            var expBackoff = backoff.exponential(
              {
                initialDelay: 1000, // ms
                maxDelay: 6400, // max retry interval of 2 seconds
                failAfter: 30 // fail after 30 attempts(~60 sec)
              }
            );

            expBackoff.on('backoff',
              function (number, delay) {
                logger.info('rSync in progress. Retrying after ', delay, ' ms');
              }
            );

            expBackoff.on('ready',
              function () {
                var query = util.format('resourceIds=%s', testRunParamJob.id);
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

                    if (_.isEmpty(builds))
                      return expBackoff.backoff(); // wait till builds are created

                    var build = _.first(builds);
                    if (build.statusCode !== successStatusCode) {
                      expBackoff.backoff();
                    } else {
                      expBackoff.reset();
                      return resolve();
                    }
                  }
                );
              }
            );

            // max number of backoffs reached
            expBackoff.on('fail',
              function () {
                return reject(new Error('Max number of back offs reached'));
              }
            );

            expBackoff.backoff();
          }
        );
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

            testNoRunParamJob = _.findWhere(res, {"typeCode": runShCode, "name": 'test_param_norun'});
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
      function () {
        return new Promise(
          function (resolve, reject) {

            var expBackoff = backoff.exponential(
              {
                initialDelay: 1000, // ms
                maxDelay: 6400, // max retry interval of 2 seconds
                failAfter: 30 // fail after 30 attempts(~60 sec)
              }
            );

            expBackoff.on('backoff',
              function (number, delay) {
                logger.info('rSync in progress. Retrying after ', delay, ' ms');
              }
            );

            expBackoff.on('ready',
              function () {
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

                    if (_.isEmpty(builds))
                      return expBackoff.backoff(); // wait till builds are created

                    var build = _.first(builds);
                    if (build.statusCode !== successStatusCode) {
                      expBackoff.backoff();
                    } else {
                      expBackoff.reset();
                      return resolve();
                    }
                  }
                );
              }
            );

            // max number of backoffs reached
            expBackoff.on('fail',
              function () {
                return reject(new Error('Max number of back offs reached'));
              }
            );

            expBackoff.backoff();
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
