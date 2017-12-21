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
    var runStatus = [];

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

            successStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'SUCCESS'}).code;

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

    it('2. Owner can get subscription by ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        ownerApiAdapter.getSubscriptionById(sub.id,
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

    it('3. Member can get subscription by ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        memberApiAdapter.getSubscriptionById(sub.id,
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

    it('4. Collaborator can get subscription by ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        ownerApiAdapter.getSubscriptionById(sub.id,
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

    it('5. Public user cannot get subscription by ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        global.pubAdapter.getSubscriptionById('sub.id',
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

    it('6. Unauthorized user cannot get subscription by ID',
      function (done) {
        var sub = _.findWhere(subscriptions, {orgName:global.TEST_GH_ORGNAME}) || {};
        assert.isNotEmpty(sub,
          'Subscriptions cannot be empty.');
        unauthorizedApiAdapter.getSubscriptionById('sub.id',
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

    it('7. Member can get all its subscriptions',
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

    it('8. Collaborator can get all its subscriptions',
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

    it('9. Public user cannot get subscriptions',
      function (done) {
        global.pubAdapter.getSubscriptions('',
          function (err, subs) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the project. ' +
                'err : %s %s', err, subs)
            );
            return done();
          }
        );
      }
    );

    it('10. Owner enables the project',
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

    it('11. Owner triggers manual build for the project and was successful',
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

    it('12. Owner can get Run Status by subscription ID',
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

    it('13. Member can get Run Status by subscription ID',
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

    it('14. Collaborator can get Run Status by subscription ID',
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

    it('15. unauthorized user cannot get Run Status by subscription ID',
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

    it('16. public user cannot get Run Status by subscription ID',
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

    it('17. Owner deletes the project',
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

    after(
      function (done) {
        return done();
      }
    );
  }
);
