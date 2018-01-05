'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_SUB_API';
var testSuiteDesc = 'Github Organization subscription API tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var subscriptions = [];
    var subscription = {};
    var runId = null;
    var project = {};
    var successStatusCode = null;
    var buildSuccessStatusCode = null;
    var runStatus = [];
    var buildStatus = [];
    var syncRepo = {};
    var subscriptionIntegration = {};
    var syncRepoResource = {};
    var rSyncJob = {};
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

            successStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'SUCCESS'}).code;

            rSyncCode = _.findWhere(global.systemCodes,
              {name: 'rSync', group: 'resource'}).code;
            syncRepoCode = _.findWhere(global.systemCodes,
              {name: 'syncRepo', group: 'resource'}).code;

            ownerApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));

                project = _.first(
                  _.where(prjs, {isOrg: true, isPrivateRepository: true}
                  )
                );

                project.test_resource_type = 'project';
                project.test_resource_name = 'ghOrgPrivate';
                assert.isNotEmpty(project, 'User cannot find the project');

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

    it('1. Owner can get all its subscriptions',
      function (done) {
        ownerApiAdapter.getSubscriptions('',
          function (err, subs) {
            if (err || _.isEmpty(subs))
              return done(
                new Error(
                  util.format('User cannot get subscription',
                    query, err)
                )
              );
            subscriptions = subs;
            assert.isNotEmpty(subscriptions, 'User cannot find the subscriptions');
            assert.equal(subscriptions.length,
              global.ADM_GH_SUB_COUNT, 'Subscription count needs to match');
            return done();
          }
        );
      }
    );

    it('2. Member can get all its subscriptions',
      function (done) {
        memberApiAdapter.getSubscriptions('',
          function (err, subs) {
            if (err || _.isEmpty(subs))
              return done(
                new Error(
                  util.format('User cannot get subscription',
                    query, err)
                )
              );
            subscriptions = subs;
            assert.isNotEmpty(subscriptions, 'User cannot find the subscriptions');
            var membersubcount = subscriptions.length;
            assert.equal(subscriptions.length,
              global.MEM_GH_SUB_COUNT, 'Subscription count needs to match');
            return done();
          }
        );
      }
    );

    it('3. Collaborator can get all its subscriptions',
      function (done) {
        collaboraterApiAdapter.getSubscriptions('',
          function (err, subs) {
            if (err || _.isEmpty(subs))
              return done(
                new Error(
                  util.format('User cannot get subscription',
                    query, err)
                )
              );
            subscriptions = subs;
            assert.isNotEmpty(subscriptions, 'User cannot find the subscriptions');
            assert.equal(subscriptions.length,
              global.COL_GH_SUB_COUNT, 'Subscription count needs to match');
            return done();
          }
        );
      }
    );

    it('4. Public user cannot get subscriptions',
      function (done) {
        global.pubAdapter.getSubscriptions('',
          function (err, subs) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the subscriptions. ' +
                'err : %s %s', err, subs)
            );
            return done();
          }
        );
      }
    );

    it('5. Owner enables the project',
      function (done) {
        var json = {
          type: 'ci'
        };
        ownerApiAdapter.enableProjectById(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot enable the project with id:%s %s',
                    project.id, util.inspect(response))
                )
              );

            global.saveTestResource(project.test_resource_name, project,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('6. Owner triggers manual build for the project and was successful',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master'};
            ownerApiAdapter.triggerNewBuildByProjectId(project.id, json,
              function (err, response) {
                if (err)
                  return reject(
                    new Error(
                      util.format('user cannot trigger manual build for ' +
                        'project id: %s, err: %s, %s', project.id, err,
                        util.inspect(response)
                      )
                    )
                  );
                return resolve(response);
              }
            );
          }
        );

        triggerBuild.then(
          function (response) {
            runId = response.runId;
            global.getRunByIdStatusWithBackOff(ownerApiAdapter, runId,
              successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('7. Owner can get subscription by ID',
      function (done) {
        ownerApiAdapter.getSubscriptionById(project.subscriptionId,
          function (err, subAcct) {
            if (err || _.isEmpty(subAcct))
              return done(
                new Error(
                  util.format('User cannot get subscription Account from ID',
                    query, err)
                )
              );
            subscription = subAcct;
            assert.isNotEmpty(subscription, 'User cannot find the subscription by ID');
            return done();
          }
        );
      }
    );

    it('8. Member can get subscription by ID',
      function (done) {
        memberApiAdapter.getSubscriptionById(project.subscriptionId,
          function (err, subAcct) {
            if (err || _.isEmpty(subAcct))
              return done(
                new Error(
                  util.format('User cannot get subscription Account from ID',
                    query, err)
                )
              );
            subscription = subAcct;
            assert.isNotEmpty(subscription, 'User cannot find the subscription by ID');
            return done();
          }
        );
      }
    );

    it('9. Collaborator can get subscription by ID',
      function (done) {
        ownerApiAdapter.getSubscriptionById(project.subscriptionId,
          function (err, subAcct) {
            if (err || _.isEmpty(subAcct))
              return done(
                new Error(
                  util.format('User cannot get subscription Account from ID',
                    query, err)
                )
              );
            subscription = subAcct;
            assert.isNotEmpty(subscription, 'User cannot find the subscription by ID');
            return done();
          }
        );
      }
    );

    it('10. Public user cannot get subscription by ID',
      function (done) {
        global.pubAdapter.getSubscriptionById('project.subscriptionId',
          function (err, subAcct) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the subscription by Id. ' +
                'err : %s %s', err, subAcct)
            );
            return done();
          }
        );
      }
    );

    it('11. Public user can get subscriptions using subscription Id',
      function (done) {
      var query = 'subscriptionIds=' + project.subscriptionId;
        global.pubAdapter.getSubscriptions(query,
          function (err, subs) {
            if (err || _.isEmpty(subs))
              return done(
                new Error(
                  util.format('User cannot get subscription',
                    query, err)
                )
              );
            subscriptions = subs;
            assert.isNotEmpty(subscriptions, 'User cannot find the subscriptions');
            return done();
          }
        );
      }
    );

    it('12. Unauthorized user cannot get subscription by ID',
      function (done) {
        unauthorizedApiAdapter.getSubscriptionById('project.subscriptionId',
          function (err, subAcct) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the project. ' +
                'err : %s %s', err, subAcct)
            );
            return done();
          }
        );
      }
    );

    it('13. Owner can get Run Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        ownerApiAdapter.getRunStatusBySubscriptionId(sub.id,
          function (err, runStas) {
            if (err || _.isEmpty(runStas))
              return done(
                new Error(
                  util.format('User cannot get run status',
                    sub.id, err)
                )
              );

            runStatus = runStas;
            assert.isNotEmpty(runStatus, 'User cannot find the run status by subscription ID');
            return done();
          }
        );
      }
    );

    it('14. Member can get Run Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        memberApiAdapter.getRunStatusBySubscriptionId(sub.id,
          function (err, runStas) {
            if (err || _.isEmpty(runStas))
              return done(
                new Error(
                  util.format('User cannot get run status',
                    sub.id, err)
                )
              );

            runStatus = runStas;
            assert.isNotEmpty(runStatus, 'User cannot find the runstatus by subscription ID');
            return done();
          }
        );
      }
    );

    it('15. Collaborator can get Run Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        collaboraterApiAdapter.getRunStatusBySubscriptionId(sub.id,
          function (err, runStas) {
            if (err || _.isEmpty(runStas))
              return done(
                new Error(
                  util.format('User cannot get run status',
                    sub.id, err)
                )
              );

            runStatus = runStas;
            assert.isNotEmpty(runStatus, 'User cannot find the runstatus by subscription ID');
            return done();
          }
        );
      }
    );

    it('16. unauthorized user cannot get Run Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        unauthorizedApiAdapter.getRunStatusBySubscriptionId(sub.id,
          function (err, runStas) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the runstatus by subscription ID. ' +
                'err : %s %s', err, runStas)
            );
            return done();
          }
        );
      }
    );

    it('17. public user cannot get Run Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        global.pubAdapter.getRunStatusBySubscriptionId(sub.id,
          function (err, runStas) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the runstatus by subscription ID. ' +
                'err : %s %s', err, runStas)
            );
            return done();
          }
        );
      }
    );


    it('18. Owner deletes the project',
      function (done) {
        var json = {projectId: project.id};
        ownerApiAdapter.deleteProjectById(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User can delete project id: %s, err: %s, %s',
                    project.id, err, response)
                )
              );
            global.removeTestResource(project.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('19. Owner gets the subscriptionIntegration',
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

    it('20. Owner adds a sync repo',
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

    it('21. Owner gets sync Repo object created',
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

    it('22. SyncRepo build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', buildSuccessStatusCode, done);
      }
    );

    it('23. Owner can get Build Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        ownerApiAdapter.getBuildStatusBySubscriptionId(sub.id,
          function (err, buildStas) {
            if (err || _.isEmpty(buildStas))
              return done(
                new Error(
                  util.format('User cannot get build status',
                    sub.id, err)
                )
              );

            buildStatus = buildStas;
            assert.isNotEmpty(buildStatus, 'User cannot find the build status by subscription ID');
            return done();
          }
        );
      }
    );

    it('24. Member can get Build Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        memberApiAdapter.getBuildStatusBySubscriptionId(sub.id,
          function (err, buildStas) {
            if (err || _.isEmpty(buildStas))
              return done(
                new Error(
                  util.format('User cannot get build status',
                    sub.id, err)
                )
              );

            buildStatus = buildStas;
            assert.isNotEmpty(buildStatus, 'User cannot find the build status by subscription ID');
            return done();
          }
        );
      }
    );

    it('25. Collaborator can get Build Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        collaboraterApiAdapter.getBuildStatusBySubscriptionId(sub.id,
          function (err, buildStas) {
            if (err || _.isEmpty(buildStas))
              return done(
                new Error(
                  util.format('User cannot get build status',
                    sub.id, err)
                )
              );

            buildStatus = buildStas;
            assert.isNotEmpty(buildStatus, 'User cannot find the build status by subscription ID');
            return done();
          }
        );
      }
    );

    it('26. unauthorized user cannot get Build Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        unauthorizedApiAdapter.getBuildStatusBySubscriptionId(sub.id,
          function (err, buildStas) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the build status by subscription ID. ' +
                'err : %s %s', err, buildStas)
            );
            return done();
          }
        );
      }
    );

    it('27. public user cannot get Build Status by subscription ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        global.pubAdapter.getBuildStatusBySubscriptionId(sub.id,
          function (err, buildStas) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the runstatus by subscription ID. ' +
                'err : %s %s', err, buildStas)
            );
            return done();
          }
        );
      }
    );


    it('28. Owner can disable syncrepo',
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

    it('29. Owner can hard delete syncrepo',
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
