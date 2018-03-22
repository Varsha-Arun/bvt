'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_VERSIONS';
var testSuiteDesc = 'Github Organization Version API tests';
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
    var versions = [];
    var versionId = null;
    var projectId = null;
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

    it('4. rSyncJob was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', buildSuccessStatusCode, done);
      }
    );

    it('5. Owner can get all their versions',
      function (done) {
        ownerApiAdapter.getVersions('',
          function (err, vers) {
            if (err || _.isEmpty(vers))
              return done(
                new Error(
                  util.format('User cannot get versions',
                    query, err)
                )
              );
            versions = vers;
            var version = _.first(versions);
            versionId = version.id;
            projectId = version.projectId;
            resourceId = version.resourceId;
            assert.isNotEmpty(versions, 'User cannot find the versions');

            return done();
          }
        );
      }
    );

    it('6. Member can get all their versions',
      function (done) {
        memberApiAdapter.getVersions('',
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot get versions',
                    query, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the versions');

            return done();
          }
        );
      }
    );

    it('7. Collaborater can get all their versions',
      function (done) {
        collaboraterApiAdapter.getVersions('',
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot get versions',
                    query, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the versions');

            return done();
          }
        );
      }
    );

    it('8. Public User cannot get versions',
      function (done) {
        global.pubAdapter.getVersions('',
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get version pf the resource: ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('9. Unauthorized User can get all their versions',
      function (done) {
        unauthorizedApiAdapter.getVersions('',
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot get versions',
                    query, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the versions');

            return done();
          }
        );
      }
    );

    it('10. Owner can get version by Id',
      function (done) {
        ownerApiAdapter.getVersionById(versionId,
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot get version by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the version by Id');
            return done();
          }
        );
      }
    );

    it('11. Member can get version by Id',
      function (done) {
        memberApiAdapter.getVersionById(versionId,
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot get version by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the version by Id');
            return done();
          }
        );
      }
    );

    it('12. Collaborater can get version by Id',
      function (done) {
        collaboraterApiAdapter.getVersionById(versionId,
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot get version by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the version by Id');
            return done();
          }
        );
      }
    );

    it('13. Public user cannot get version by Id',
      function (done) {
        global.pubAdapter.getVersionById(versionId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get version by Id: %s ' +
                'err : %s, %s', versionId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('14. Unauthorized user cannot get version by Id',
      function (done) {
        unauthorizedApiAdapter.getVersionById(versionId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get version by Id: %s ' +
                'err : %s, %s', versionId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('15. Owner can add a version to resource',
      function (done) {
        var body = {
          propertyBag: {
          branch: 'master'
          },
          resourceId: resourceId,
          projectId: projectId
        };

        ownerApiAdapter.postVersion(body,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('unable to post a version with body: %s ' +
                    'err:%s', util.inspect(body), util.inspect(err))
                )
              );
            versionId = response.id;
            return done();
          }
        );
      }
    );

    it('16. Owner can delete version by Id',
      function (done) {
        var version = _.first(versions);
        ownerApiAdapter.deleteVersionById(versionId,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete version by Id versionId: %s err: %s',
                    versionId, err)
                )
              );
          
            assert.isNotEmpty(response, 'User cannot find the version by Id');
            return done();
          }
        );
      }
    );
  
    it('17. Collaborater can add a version to resource',
      function (done) {
        var body = {
            propertyBag: {
            branch: 'master'
            },
          resourceId: resourceId,
          projectId: projectId
        };

        collaboraterApiAdapter.postVersion(body,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('unable to post a version with body: %s ' +
                    'err:%s', util.inspect(body), util.inspect(err))
                )
              );
            versionId = response.id;
            return done();
          }
        );
      }
    );

    it('18. Collaborater can delete version by Id',
      function (done) {
        collaboraterApiAdapter.deleteVersionById(versionId,
          function (err, ver) {
            if (err || _.isEmpty(ver))
              return done(
                new Error(
                  util.format('User cannot delete version by Id',
                    versionId, err)
                )
              );
            assert.isNotEmpty(ver, 'User cannot find the version by Id');
            return done();
          }
        );
      }
    );
  
    it('19. Member cannot add a version to resource',
      function (done) {
        var body = {
          propertyBag: {
          branch: 'master'
          },
          resourceId: resourceId,
          projectId: projectId
        };

        memberApiAdapter.postVersion(body,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to add version by Id: %s ' +
                'err : %s, %s', resourceId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('20. Member cannot delete version by Id',
      function (done) {
        var version = _.first(versions);
        memberApiAdapter.deleteVersionById(version.id,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete version by Id: %s ' +
                'err : %s, %s', version.id, err, response)
            );
            return done();
          }
        );
      }
    );
  
    it('21. Public user cannot add a version to resource',
      function (done) {
        var body = {
          propertyBag: {
          branch: 'master'
          },
          resourceId: resourceId,
          projectId: projectId
        };

        global.pubAdapter.postVersion(body,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to add version by Id: %s ' +
                'err : %s, %s', resourceId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('22. Public user cannot delete version by Id',
      function (done) {
        var version = _.first(versions);
        global.pubAdapter.deleteVersionById(version.id,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to delete version by Id: %s ' +
                'err : %s, %s', versionId, err, response)
            );
            return done();
          }
        );
      }
    );
  
    it('23. Unauthorized user cannot add a version to resource',
      function (done) {
        var body = {
          propertyBag: {
          branch: 'master'
          },
          resourceId: resourceId,
          projectId: projectId
        };

        unauthorizedApiAdapter.postVersion(body,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to add version by Id: %s ' +
                'err : %s, %s', resourceId, err, response)
            );
            return done();
          }
        );
      }
    );
  
    it('24. Unauthorized user cannot delete version by Id',
      function (done) {
        var version = _.first(versions);
        unauthorizedApiAdapter.deleteVersionById(version.id,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete version by Id: %s ' +
                'err : %s, %s', versionId, err, response)
            );
            return done();
          }
        );
      }
    );
  
    it('25. Owner disables private syncrepo',
      function (done) {
        var query = '';
        ownerApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete a resource: %s, err: %s, %s',
                    syncRepoResource.id, err, response)
                )
              );
            return done();
          }
        );
      }
    );

    it('26. Owner hard deletes private syncrepo',
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
