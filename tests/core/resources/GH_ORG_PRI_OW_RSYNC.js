'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_PRI_OW_RSYNC';
var testSuiteDesc = 'Github Organization owner private repo, rSync tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var syncRepo = {};
    var subscriptionIntegration = {};
    var syncRepoResource = {};
    var rSyncJob = {};
    var successStatusCode = null;
    var rSyncCode = null;
    var syncRepoCode = null;

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

            rSyncCode = _.findWhere(global.systemCodes,
              {name: 'rSync', group: 'resource'}).code;
            syncRepoCode = _.findWhere(global.systemCodes,
              {name: 'syncRepo', group: 'resource'}).code;

            ownerApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));
                syncRepo = _.first(
                  _.where(prjs, {isOrg: true, isPrivateRepository: true}
                  )
                );

                assert.isNotEmpty(syncRepo, 'User cannot find the rSync repo');
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Owner can get the subscriptionIntegration',
      function (done) {
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

    it('2. Owner can add a sync repo',
      function (done) {

        var body = {
          resourceName: syncRepo.name + '_master',
          projectId: syncRepo.id,
          subscriptionId: syncRepo.subscriptionId,
          branch: 'master',
          subscriptionIntegrationId: subscriptionIntegration.id
        };

        //TODO: response for this call is blank and pointless. we should return
        //TODO: the object
        ownerApiAdapter.postNewSyncRepo(body,
          function (err) {
            if (err)
              return done(
                new Error(
                  util.format('unable to post new sync repo with body: %s ' +
                    'err:%s', util.inspect(body), util.inspect(err))
                )
              );

            return done();
          }
        );
      }
    );

    it('3. Owner should be able to get sync Repo objects created',
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

            rSyncJob = _.findWhere(res, {"typeCode": rSyncCode});
            syncRepoResource = _.findWhere(res, {"typeCode": syncRepoCode});

            assert.isNotEmpty(rSyncJob, 'User could not find rSync Job');
            assert.isNotEmpty(syncRepoResource, 'User could not find syncRepo ' +
              'Resource');

            //TODO: Need to figure out how to make this successful
            // assert.strictEqual(syncRepoResource.isConsistent, true,
            //   'User syncRepo is not consistent');
            // assert.strictEqual(rSyncJob.isConsistent, 'User rSync ' +
            //   'is not consistent');

            syncRepoResource.test_resource_type = 'syncRepo';
            syncRepoResource.test_resource_name = 'ghOrgPrivateSyncRepo';

            global.saveTestResource(syncRepoResource.test_resource_name,
              syncRepoResource,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('4. Owner added syncRepo build was successful',
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
                var query = util.format('resourceIds=%s', rSyncJob.id);
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
