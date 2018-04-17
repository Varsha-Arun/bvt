'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_RESOURCES';
var testSuiteDesc = 'Github Organization Resource API tests';
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
    var reso = {};
    var rSyncJob = {};
    var resources = [];
    var resourceId = null;
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
  
    it('4. Owner can get all their resources',
      function (done) {
        ownerApiAdapter.getResources('',
          function (err, res) {
            if (err || _.isEmpty(res))
              return done(
                new Error(
                  util.format('User cannot get resources',
                    query, err)
                )
              );
            resources = res;
            var resource = _.first(resources);
            resourceId = resource.id;
            assert.isNotEmpty(resources, 'User cannot find the resources');

            return done();
          }
        );
      }
    );

    it('5. Member can get all their resources',
      function (done) {
        memberApiAdapter.getResources('',
          function (err, res) {
            if (err || _.isEmpty(res))
              return done(
                new Error(
                  util.format('User cannot get resources',
                    query, err)
                )
              );
            resources = res;
            assert.isNotEmpty(resources, 'User cannot find the resources');
            return done();
          }
        );
      }
    );

    it('6. Collaborater can get all their resources',
      function (done) {
        collaboraterApiAdapter.getResources('',
          function (err, res) {
            if (err || _.isEmpty(res))
              return done(
                new Error(
                  util.format('User cannot get resources',
                    query, err)
                )
              );
            resources = res;
            assert.isNotEmpty(resources, 'User cannot find the resources');
            return done();
          }
        );
      }
    );

    it('7. Public user user cannot get resources',
      function (done) {
        global.pubAdapter.getResources('',
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get resource: ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('8. Unauthorized user can get their resources',
      function (done) {
        unauthorizedApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources',
                    res, err)
                )
              );
            return done();
          }
        );
      }
    );

    it('9. Owner can get resource by Id',
      function (done) {
        ownerApiAdapter.getResourceById(resourceId,
          function (err, res) {
            if (err || _.isEmpty(res))
              return done(
                new Error(
                  util.format('User cannot get resource by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(res, 'User cannot find the resource by Id');
            return done();
          }
        );
      }
    );

    it('10. Member can get resource by Id',
      function (done) {
        memberApiAdapter.getResourceById(resourceId,
          function (err, res) {
            if (err || _.isEmpty(res))
              return done(
                new Error(
                  util.format('User cannot get resource by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(res, 'User cannot find the resource by Id');
            return done();
          }
        );
      }
    );

    it('11. Collaborater can get resource by Id',
      function (done) {
        collaboraterApiAdapter.getResourceById(resourceId,
          function (err, res) {
            if (err || _.isEmpty(res))
              return done(
                new Error(
                  util.format('User cannot get resource by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(res, 'User cannot find the resource by Id');
            return done();
          }
        );
      }
    );

    it('12. Public user cannot get resource by Id',
      function (done) {
        global.pubAdapter.getResourceById(resourceId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get resource by Id: %s ' +
                'err : %s, %s', resourceId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('13. Unauthorized user cannot get resource by Id',
      function (done) {
        unauthorizedApiAdapter.getResourceById(resourceId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get resource by Id: %s ' +
                'err : %s, %s', resourceId, err, response)
            );
            return done();
          }
        );
      }
    );

  it('14. Owner should be able to trigger build',
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

  it('15. Member should not be able to trigger build',
      function (done) {
        memberApiAdapter.triggerNewBuildByResourceId(rSyncJob.id, {},
          function (err) {
            if (err)
              return done();
            else
              return done(
                new Error(
                  util.format('Should not be able to trigger a build ',
                    util.inspect(err)
                  )
                )
              );
          }
        );
      }
    );

    it('16. Collaborater should be able to trigger build',
      function (done) {
        collaboraterApiAdapter.triggerNewBuildByResourceId(rSyncJob.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('17. Public user should not be able to trigger build',
      function (done) {
        global.pubAdapter.triggerNewBuildByResourceId(rSyncJob.id, {},
          function (err) {
            if (err)
              return done();
            else
              return done(
                new Error(
                  util.format('Should not be able to trigger a build ',
                    util.inspect(err)
                  )
                )
              );
          }
        );
      }
    );

    it('18. Unauthorized user should not be able to trigger build',
      function (done) {
        unauthorizedApiAdapter.triggerNewBuildByResourceId(rSyncJob.id, {},
          function (err) {
            if (err)
              return done();
            else
              return done(
                new Error(
                  util.format('Should not be able to trigger a build ',
                    util.inspect(err)
                  )
                )
              );
          }
        );
      }
    );

    it('19. rSyncJob was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', buildSuccessStatusCode, done);
      }
    );

    it('20. member cannot disable private syncrepo',
      function (done) {
        var query = '';
        memberApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to disable resource by Id: %s ' +
                'err : %s, %s', syncRepoResource.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('21. Public user cannot disable private syncrepo',
      function (done) {
        var query = '';
        global.pubAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to disable resource by Id: %s ' +
                'err : %s, %s', syncRepoResource.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('22. Unauthorized user cannot disable private syncrepo',
      function (done) {
        var query = '';
        unauthorizedApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to disable resource by Id: %s ' +
                'err : %s, %s', syncRepoResource.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('23. Collaborater can disable private syncrepo',
      function (done) {
        var query = '';
        collaboraterApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete a resource: %s, err: %s, %s',
                    reso.id, err, response)
                )
              );
            return done();  
          }
        );
      }
    );
  
    it('24. Owner can hard delete private syncrepo',
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
