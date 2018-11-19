'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_IND_PRI_OWN_RUNSH_SHIPCTL';
var testSuiteDesc = 'Github Individual private project to test shipctl commands in runsh job';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var successStatusCode = null;
    var runShCode = null;
    var syncRepo = {};
    var subscriptionIntegration = {};
    var syncRepoResource = {};
    var rSyncJob = {};
    var testShipctlJob1 = {};
    var testShipctlJob2 = {};
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
              {group: 'status', name: 'success'}).code;
            rSyncCode = _.findWhere(global.systemCodes,
              {name: 'rSync', group: 'resource'}).code;
            syncRepoCode = _.findWhere(global.systemCodes,
              {name: 'syncRepo', group: 'resource'}).code;
            runShCode = _.findWhere(global.systemCodes,
              {name: 'runSh', group: 'resource'}).code;

            ownerApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));

                syncRepo = _.first(
                  _.where(prjs, {isOrg: false, isPrivateRepository: true}
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

    it('1. Owner gets the subscriptionIntegration',
      function (done) {
        ownerApiAdapter.getSubscriptionIntegrations('',
          function (err, sis) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get subscriptionIntegrations', err)
                )
              );
            assert.isNotEmpty(sis, 'Subscription Integration cannot be empty');

            subscriptionIntegration =
              _.findWhere(sis,{name: global.GH_ORG_SUB_INT_GH});
            return done();
          }
        );
      }
    );

    it('2. Owner adds a sync repo',
      function (done) {
        var body = {
          resourceName: syncRepo.name + '_master',
          projectId: syncRepo.id,
          subscriptionId: syncRepo.subscriptionId,
          branch: 'master',
          subscriptionIntegrationId: subscriptionIntegration.id
        };

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

    it('3. Owner gets sync Repo object created',
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
            assert.isNotEmpty(res, 'User resources cannot be empty');

            rSyncJob = _.findWhere(res, {"typeCode": rSyncCode});
            syncRepoResource = _.findWhere(res, {"typeCode": syncRepoCode});

            assert.isNotEmpty(rSyncJob, 'User could not find rSync Job');
            assert.isNotEmpty(syncRepoResource, 'User could not find syncRepo ' +
              'Resource');

            syncRepoResource.test_resource_type = 'syncRepo';
            syncRepoResource.test_resource_name = 'ghIndPrivateSyncRepo';
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

    it('5. SyncRepo build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', successStatusCode, done);
      }
    );

    it('6. Owner should be able to get test_shipctl_job1 runSh job. This is the root ' +
      'trigger job to test other runSh cases',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_shipctl_job1',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testShipctlJob1 = response.resource;
            assert.isNotEmpty(testShipctlJob1, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('7. Owner should be able to trigger test_shipctl_job1 runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testShipctlJob1.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('8. test_shipctl_job1 build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testShipctlJob1,
          'test_shipctl_job1', successStatusCode, done);
      }
    );

    it('9. Owner should be able to get test_shipctl_job2 runSh job. This runs ' +
      'automatically when test_shipctl_job1 finishes',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_shipctl_job2',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testShipctlJob2 = response.resource;
            assert.isNotEmpty(testShipctlJob2, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('10. test_shipctl_job2 build was triggered automatically and was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testShipctlJob2,
          'test_shipctl_job2', successStatusCode, done);
      }
    );

    it('11. Owner can disable syncrepo',
      function (done) {
        var query = '';
        ownerApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete sync repo id: %s, err: %s, %s',
                    syncRepoResource.id, err, response)
                )
              );

            global.removeTestResource(syncRepoResource.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('12. Owner can hard delete syncrepo',
      function (done) {
        var query = 'hard=true';
        ownerApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete sync repo id: %s, err: %s, %s',
                    syncRepoResource.id, err, response)
                )
              );

            global.removeTestResource(syncRepoResource.test_resource_name,
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
