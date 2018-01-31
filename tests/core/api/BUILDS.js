'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_BUILDS';
var testSuiteDesc = 'Github Organization build API tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var project = {};
    var buildSuccessStatusCode = null;
    var syncRepo = {};
    var subscriptionIntegration = {};
    var syncRepoResource = {};
    var rSyncJob = {};
    var builds = [];
    var buildId = {};
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
            collaboraterApiAdapter =
              global.newApiAdapterByStateAccount('ghCollaboratorAccount');
            memberApiAdapter =
              global.newApiAdapterByStateAccount('ghMemberAccount');
            unauthorizedApiAdapter =
              global.newApiAdapterByStateAccount('ghUnauthorizedAccount');

            buildSuccessStatusCode = _.findWhere(global.systemCodes,
              {group: 'status', name: 'success'}).code;

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

    it('4. SyncRepo build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', buildSuccessStatusCode, done);
      }
    );

    it('5. Owner can get all their builds',
      function (done) {
        ownerApiAdapter.getBuilds('',
          function (err, blds) {
            if (err || _.isEmpty(blds))
              return done(
                new Error(
                  util.format('User cannot get builds',
                    query, err)
                )
              );
            builds = blds;
            var build = _.first(builds);
            buildId = build.id;
            assert.isNotEmpty(builds, 'User cannot find the builds');
            return done();
          }
        );
      }
    );

    it('6. Member can get all their builds',
      function (done) {
        memberApiAdapter.getBuilds('',
          function (err, blds) {
            if (err || _.isEmpty(blds))
              return done(
                new Error(
                  util.format('User cannot get builds',
                    query, err)
                )
              );
            builds = builds;
            assert.isNotEmpty(blds, 'User cannot find the builds');
            return done();
          }
        );
      }
    );

    it('7. Collaborater can get all their builds',
      function (done) {
        collaboraterApiAdapter.getBuilds('',
          function (err, blds) {
            if (err || _.isEmpty(blds))
              return done(
                new Error(
                  util.format('User cannot get builds',
                    query, err)
                )
              );
            builds = builds;
            assert.isNotEmpty(blds, 'User cannot find the builds');
            return done();
          }
        );
      }
    );

    it('8. Public user user cannot get builds',
      function (done) {
        global.pubAdapter.getBuilds('',
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get build: ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('9. Unauthorized user can get all their builds',
      function (done) {
        unauthorizedApiAdapter.getBuilds('',
          function (err, blds) {
            if (err || _.isEmpty(blds))
              return done(
                new Error(
                  util.format('User cannot get builds',
                    query, err)
                )
              );
            builds = builds;
            assert.isNotEmpty(blds, 'User cannot find the builds');
            return done();
          }
        );
      }
    );

    it('10. Owner can get build by Id',
      function (done) {
        ownerApiAdapter.getBuildById(buildId,
          function (err, bld) {
            if (err || _.isEmpty(bld))
              return done(
                new Error(
                  util.format('User cannot get build by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(bld, 'User cannot find the build by Id');
            return done();
          }
        );
      }
    );

    it('11. Member can get build by Id',
      function (done) {
        memberApiAdapter.getBuildById(buildId,
          function (err, bld) {
            if (err || _.isEmpty(bld))
              return done(
                new Error(
                  util.format('User cannot get build by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(bld, 'User cannot find the build by Id');
            return done();
          }
        );
      }
    );

    it('12. Collaborater can get build by Id',
      function (done) {
        collaboraterApiAdapter.getBuildById(buildId,
          function (err, bld) {
            if (err || _.isEmpty(bld))
              return done(
                new Error(
                  util.format('User cannot get build by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(bld, 'User cannot find the build by Id');
            return done();
          }
        );
      }
    );

    it('13. Public user cannot get build by Id',
      function (done) {
        global.pubAdapter.getBuildById(buildId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get build by Id: %s ' +
                'err : %s, %s', buildId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('14. Unauthorized user cannot get buildJob by Id',
      function (done) {
        unauthorizedApiAdapter.getBuildById(buildId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get build by Id: %s ' +
                'err : %s, %s', buildId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('15. Owner can disable private syncrepo',
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

    it('16. Owner can hard delete private syncrepo',
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
