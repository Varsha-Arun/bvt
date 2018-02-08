'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_BUILDJOBS';
var testSuiteDesc = 'Github Organization buildJob API tests';
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
    var buildJobs = [];
    var buildJobId = null;
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

    it('5. Owner can get all their buildJobs',
      function (done) {
        ownerApiAdapter.getBuildJobs('',
          function (err, buildJobs) {
            if (err || _.isEmpty(buildJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            buildJobs = buildJobs;
            var buildJob = _.first(buildJobs);
            buildJobId = buildJob.id;
            assert.isNotEmpty(buildJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('6. Member can get all their buildJobs',
      function (done) {
        memberApiAdapter.getBuildJobs('',
          function (err, buildJobs) {
            if (err || _.isEmpty(buildJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            buildJobs = buildJobs;
            assert.isNotEmpty(buildJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('7. Collaborater can get all their buildJobs',
      function (done) {
        collaboraterApiAdapter.getBuildJobs('',
          function (err, buildJobs) {
            if (err || _.isEmpty(buildJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            buildJobs = buildJobs;
            assert.isNotEmpty(buildJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('8. Public user user cannot get all their buildJobs',
      function (done) {
        global.pubAdapter.getBuildJobs('',
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get buildJob: %s ' +
                'err : %s, %s', buildJobs, err, response)
            );
            return done();
          }
        );
      }
    );

    it('9. Unauthorized user can get all their buildJobs',
      function (done) {
        unauthorizedApiAdapter.getBuildJobs('',
          function (err, buildJobs) {
            if (err || _.isEmpty(buildJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            buildJobs = buildJobs;
            assert.isNotEmpty(buildJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('10. Owner can get buildJob by Id',
      function (done) {
        ownerApiAdapter.getBuildJobById(buildJobId,
          function (err, bldJob) {
            if (err || _.isEmpty(bldJob))
              return done(
                new Error(
                  util.format('User cannot get buildJob by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(bldJob, 'User cannot find the buildJob by Id');
            return done();
          }
        );
      }
    );

    it('11. Member can get buildJob by Id',
      function (done) {
        memberApiAdapter.getBuildJobById(buildJobId,
          function (err, bldJob) {
            if (err || _.isEmpty(bldJob))
              return done(
                new Error(
                  util.format('User cannot get buildJob by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(bldJob, 'User cannot find the buildJob by Id');
            return done();
          }
        );
      }
    );

    it('12. Collaborater can get buildJob by Id',
      function (done) {
        collaboraterApiAdapter.getBuildJobById(buildJobId,
          function (err, bldJob) {
            if (err || _.isEmpty(bldJob))
              return done(
                new Error(
                  util.format('User cannot get buildJob by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(bldJob, 'User cannot find the buildJob by Id');
            return done();
          }
        );
      }
    );

    it('13. Public user cannot get buildJob by Id',
      function (done) {
        global.pubAdapter.getBuildJobById(buildJobId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get buildJob by Id: %s ' +
                'err : %s, %s', buildJobId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('14. Unauthorized user cannot get buildJob by Id',
      function (done) {
        unauthorizedApiAdapter.getBuildJobById(buildJobId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get buildJob by Id: %s ' +
                'err : %s, %s', buildJobId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('15. Owner can disable syncrepo',
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

    it('16. Owner can hard delete syncrepo',
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
