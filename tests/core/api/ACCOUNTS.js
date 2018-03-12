'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_ACCOUNTS';
var testSuiteDesc = 'API tests for accounts';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var project = {};
    var runId = null;
    var accounts = [];
    var account = {};
    var accountDependencies = {};
    var runStatus ={};
    var successStatusCode = null;

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

    it('1. Owner enables the project',
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

    it('2. Owner triggers manual build for the project and was successful',
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

    it('3. Owner can get their account',
      function (done) {
        ownerApiAdapter.getAccounts('',
          function (err, acts) {
            if (err || _.isEmpty(acts))
              return done(
                new Error(
                  util.format('User cannot get account',
                    query, err)
                )
              );
            accounts = acts;
            assert.isNotEmpty(accounts, 'User cannot find the account');
            return done();
          }
        );
      }
    );

    it('4. Member can get their account',
      function (done) {
        memberApiAdapter.getAccounts('',
          function (err, acts) {
            if (err || _.isEmpty(acts))
              return done(
                new Error(
                  util.format('User cannot get account',
                    query, err)
                )
              );
            accounts = acts;
            assert.isNotEmpty(accounts, 'User cannot find the account');
            return done();
          }
        );
      }
    );

    it('5. Collaborater can get their account',
      function (done) {
        collaboraterApiAdapter.getAccounts('',
          function (err, acts) {
            if (err || _.isEmpty(acts))
              return done(
                new Error(
                  util.format('User cannot get account',
                    query, err)
                )
              );
            accounts = acts;
            assert.isNotEmpty(accounts, 'User cannot find the account');
            return done();
          }
        );
      }
    );

    it('6. Public user cannot get their accounts',
      function (done) {
        global.pubAdapter.getAccounts('',
          function (err, acts) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account' +
                'err : %s %s', err, acts)
            );
            return done();
          }
        );
      }
    );

    it('7. Unauthorized user cannot get their accounts',
      function (done) {
        unauthorizedApiAdapter.getAccounts('',
          function (err, acts) {
            if (err || _.isEmpty(acts))
              return done(
                new Error(
                  util.format('User cannot get account',
                    query, err)
                )
              );
            accounts = acts;
            assert.isNotEmpty(accounts, 'User cannot find the account');
            return done();
          }
        );
      }
    );


    it('8. Owner can get account By Id',
      function (done) {
        ownerApiAdapter.getAccountById(project.ownerAccountId,
          function (err, act) {
            if (err || _.isEmpty(act))
              return done(
                new Error(
                  util.format('User cannot get account from Id',
                    query, err)
                )
              );
            account = act;
            assert.isNotEmpty(account, 'User cannot find the account from Id');
            return done();
          }
        );
      }
    );

    it('9. Member cannot get account By Id',
      function (done) {
        memberApiAdapter.getAccountById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('10. Collaborater cannot get account By Id',
      function (done) {
        collaboraterApiAdapter.getAccountById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('11. Public user cannot get account By Id',
      function (done) {
        global.pubAdapter.getAccountById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('12. Unauthorized user cannot get account By Id',
      function (done) {
        unauthorizedApiAdapter.getAccountById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('13. Owner can get account dependencies By Id',
      function (done) {
        ownerApiAdapter.getAccountDependenciesById(project.ownerAccountId,
          function (err, actDep) {
            if (err || _.isEmpty(actDep))
              return done(
                new Error(
                  util.format('User cannot get account dependencies from Id',
                    query, err)
                )
              );
            accountDependencies = actDep;
            assert.isNotEmpty(accountDependencies, 'User cannot find the account dependencies from Id');
            return done();
          }
        );
      }
    );

    it('14. Member cannot get account dependencies By Id',
      function (done) {
        memberApiAdapter.getAccountDependenciesById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account dependencies from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('15. Collaborater cannot get account dependencies By Id',
      function (done) {
        collaboraterApiAdapter.getAccountDependenciesById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account dependencies from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    )

    it('16. Public user cannot get account dependencies By Id',
      function (done) {
        global.pubAdapter.getAccountDependenciesById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account dependencies from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('17. Unauthorized user cannot get account dependencies By Id',
      function (done) {
        unauthorizedApiAdapter.getAccountDependenciesById(project.ownerAccountId,
          function (err, act) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the account dependencies from Id' +
                'err : %s %s', err, act)
            );
            return done();
          }
        );
      }
    );

    it('18. Owner cannot get Run Status by account ID',
      function (done) {
        ownerApiAdapter.getRunStatusByAccountId(project.ownerAccountId,
          function (err, runStas) {
            if (err || _.isEmpty(runStas))
              return done(
                new Error(
                  util.format('User cannot get run status from account Id',
                    ownerAccountId, err)
                )
              );

            runStatus = runStas;
            assert.isNotEmpty(runStatus, 'User cannot find the run status by account Id');
            return done();
          }
        );
      }
    );

    it('19. Member cannot get Run Status by account ID',
      function (done) {
        memberApiAdapter.getRunStatusByAccountId(project.ownerAccountId,
          function (err, runStas) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the runstatus by account Id' +
                'err : %s %s', err, runStas)
            );
            return done();
          }
        );
      }
    );

    it('20. Collaborator cannot get Run Status by account ID',
      function (done) {
        collaboraterApiAdapter.getRunStatusByAccountId(project.ownerAccountId,
          function (err, runStas) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the runstatus by account Id' +
                'err : %s %s', err, runStas)
            );
            return done();
          }
        );
      }
    );

    it('21. public user cannot get Run Status by subscription ID',
      function (done) {
        global.pubAdapter.getRunStatusByAccountId(project.ownerAccountId,
          function (err, runStas) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the runstatus by account Id' +
                'err : %s %s', err, runStas)
            );
            return done();
          }
        );
      }
    );

    it('22. unauthorized user cannot get Run Status by subscription ID',
      function (done) {
        unauthorizedApiAdapter.getRunStatusByAccountId(project.ownerAccountId,
          function (err, runStas) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get the runstatus by account Id' +
                'err : %s %s', err, runStas)
            );
            return done();
          }
        );
      }
    );

    it('23. Owner deletes the project',
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
