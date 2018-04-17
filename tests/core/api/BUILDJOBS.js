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

    it('4. Owner should be able to trigger build',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(rSyncJob.id, {},
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('user cannot trigger manual build for ' +
                    'job id: %s, err: %s, %s', rSyncJob.id, err,
                    util.inspect(response)
                  )
                )
              );
            assert.isNotEmpty(response, 'User cannot trigger a build');
            return done();
          }
        );
      }
    );

    it('5. SyncRepo build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', buildSuccessStatusCode, done);
      }
    );

    it('6. Owner can get all their buildJobs',
      function (done) {
        ownerApiAdapter.getBuildJobs('',
          function (err, bldJobs) {
            if (err || _.isEmpty(bldJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            buildJobs = bldJobs;
            assert.isNotEmpty(buildJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('7. Member can get all their buildJobs',
      function (done) {
        memberApiAdapter.getBuildJobs('',
          function (err, bldJobs) {
            if (err || _.isEmpty(bldJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            assert.isNotEmpty(bldJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('8. Collaborater can get all their buildJobs',
      function (done) {
        collaboraterApiAdapter.getBuildJobs('',
          function (err, bldJobs) {
            if (err || _.isEmpty(bldJobs))
              return done(
                new Error(
                  util.format('User cannot get buildJobs',
                    query, err)
                )
              );
            assert.isNotEmpty(bldJobs, 'User cannot find the buildJobs');
            return done();
          }
        );
      }
    );

    it('9. Public user user cannot get all their buildJobs',
      function (done) {
        global.pubAdapter.getBuildJobs('',
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get buildJob' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('10. Unauthorized user can get their buildJobs',
      function (done) {
        unauthorizedApiAdapter.getBuildJobs('',
          function (err, bldJobs) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get build jobs',
                    bldJobs, err)
                )
              );
            return done();
          }
        );
      }
    );

    it('11. Owner can get buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
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

    it('12. Member can get buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
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

    it('13. Collaborater can get buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
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

    it('14. Public user cannot get buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
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

    it('15. Unauthorized user cannot get buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
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

    it('16. Member cannot delete buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
        memberApiAdapter.deleteBuildJobById(buildJobId,
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

    it('17. Public user cannot delete buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
        global.pubAdapter.deleteBuildJobById(buildJobId,
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

    it('18. Unauthorized user cannot delete buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
        unauthorizedApiAdapter.deleteBuildJobById(buildJobId,
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

    it('19. Owner can delete buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
        ownerApiAdapter.deleteBuildJobById(buildJobId,
          function (err) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete buildJob by Id %s err %s',
                    buildJobId, err)
                )
              );
            buildJobs = _.reject(buildJobs,
              function(buildJob) {
                return buildJob.id === buildJobId;
              }
            );
            return done();
          }
        );
      }
    );

    it('20. Collaborater can delete buildJob by Id',
      function (done) {
        var buildJob = _.first(buildJobs);
        buildJobId = buildJob.id;
        collaboraterApiAdapter.deleteBuildJobById(buildJobId,
          function (err) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete buildJob by Id %s err %s',
                    buildJobId, err)
                )
              );
            buildJobs = _.reject(buildJobs,
              function(buildJob) {
                return buildJob.id === buildJobId;
              }
            );
            return done();
          }
        );
      }
    );

    it('21. Owner can disable syncrepo',
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

    it('22. Owner can hard delete syncrepo',
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
