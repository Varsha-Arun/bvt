'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_RUNS';
var testSuiteDesc = 'Github Organization Runs API tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var privateProjectRunId = null;
    var projects = [];
    var project = {};
    var successStatusCode = null;
    var privateProjectRunId = null;
    var runId = null;
    var matrixCIProject = {};
    var matrixRunId = null;

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

                projects = prjs;
                projects.test_resource_type = 'projects';
                projects.test_resource_name = 'ghOwnerProjects';
                assert.isNotEmpty(projects, 'User cannot find the projects');

                return done();
              }
            );
          }
        );
      }
    );

    it('1. Owner enables the private project',
      function (done) {
        var json = {
          type: 'ci'
        };
        var project = _.first(
          _.where(projects, {isOrg: true, isPrivateRepository: true}
          )
        );
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        ownerApiAdapter.enableProjectById(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot enable the project with id:%s %s',
                    project.id, util.inspect(response))
                )
              );
            return done();
          }
        );
      }
    );

    it('2. Owner enables a public project',
      function (done) {
        var json = {
          type: 'ci'
        };
        collaboraterApiAdapter.getProjects('',
          function (err, prjs) {
            if (err || _.isEmpty(prjs))
              return done(new Error('Project list is empty', err));

            matrixCIProject = _.findWhere(prjs,
              {fullName: global.TEST_GH_MATRIX_REPO}
            );

            assert.isNotEmpty(matrixCIProject, 'User cannot find the project');
            collaboraterApiAdapter.enableProjectById(matrixCIProject.id, json,
              function (err, response) {
                if (err)
                  return done(
                    new Error(
                      util.format('User cannot enable the project with id:%s %s',
                        matrixCIProject.id, util.inspect(response))
                    )
                  );
                return done();
              }
            );
          }
        );
      }
    );

    it('3. Trigger a manual build for public project',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master'};
            collaboraterApiAdapter.triggerNewBuildByProjectId(
              matrixCIProject.id, json,
              function (err, response) {
                if (err)
                  return reject(
                    new Error(
                      util.format('User cannot trigger manual build for ' +
                        'project id: %s, err: %s, %s', matrixCIProject.id, err,
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
            matrixRunId = response.runId;
            return done();
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('4. Member cannot cancel build',
      function (done) {
        memberApiAdapter.cancelRunById(matrixRunId,
         function (err, response) {
           assert.strictEqual(err, 404,
             util.format('User should not be able to get resource by Id: %s ' +
              'err : %s, %s', matrixRunId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('5. Public user cannot cancel build',
      function (done) {
        global.pubAdapter.cancelRunById(matrixRunId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get resource by Id: %s ' +
                'err : %s, %s', matrixRunId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('6. Unauthorized user cannot cancel build',
      function (done) {
        unauthorizedApiAdapter.cancelRunById(matrixRunId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get resource by Id: %s ' +
                'err : %s, %s', matrixRunId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('7. Owner can cancel build',
       function (done) {
         collaboraterApiAdapter.cancelRunById(matrixRunId,
           function (err, response) {
             if (err)
              return done(
                new Error(
                  util.format('User cannot get cancel by run Id',
                    query, err)
                )
              );
            return done();
          }
        );
      }
    );

    it('9. Owner triggers manual build for the private project',
      function (done) {
        var project =  _.first(
          _.where(projects, {isOrg: true, isPrivateRepository: true}
          )
        );
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
            privateProjectRunId = response.runId;
            return done();
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('8. Collaborater can cancel build',
       function (done) {
         var project =  _.first(
           _.where(projects, {isOrg: true, isPrivateRepository: true}
           )
         );
         collaboraterApiAdapter.cancelRunById(privateProjectRunId,
           function (err, response) {
             if (err)
               return done(new Error(util.format('Cannot cancel run id: %d ' +
                 'for project id: %s, err: %s, %s', privateProjectRunId, project.id, err,
                 response)));
             return done();
           }
         );
       }
     );

    it('10. Owner can get all their runs',
      function (done) {
        ownerApiAdapter.getRuns('',
          function (err, runs) {
            if (err || _.isEmpty(runs))
              return done(
                new Error(
                  util.format('User cannot get runs',
                    query, err)
                )
              );
            assert.isNotEmpty(runs, 'User cannot find the runs');
            return done();
          }
        );
      }
    );

    it('11. Member can get all their runs',
      function (done) {
        memberApiAdapter.getRuns('',
          function (err, runs) {
            if (err || _.isEmpty(runs))
              return done(
                new Error(
                  util.format('User cannot get runs',
                    query, err)
                )
              );
            assert.isNotEmpty(runs, 'User cannot find the runs');
            return done();
          }
        );
      }
    );

    it('12. Collaborater can get all their runs',
      function (done) {
        collaboraterApiAdapter.getRuns('',
          function (err, runs) {
            if (err || _.isEmpty(runs))
              return done(
                new Error(
                  util.format('User cannot get runs',
                    query, err)
                )
              );
            assert.isNotEmpty(runs, 'User cannot find the runs');
            return done();
          }
        );
      }
    );

    it('13. Public user can get all public project runs',
      function (done) {
        memberApiAdapter.getRuns('',
          function (err, runs) {
            if (err || _.isEmpty(runs))
              return done(
                new Error(
                  util.format('User cannot get runs',
                    query, err)
                )
              );
            assert.isNotEmpty(runs, 'User cannot find the runs');
            return done();
          }
        );
      }
    );

    it('14. Unauthorized user can get all their runs',
      function (done) {
        unauthorizedApiAdapter.getRuns('',
          function (err, runs) {
            if (err || _.isEmpty(runs))
              return done(
                new Error(
                  util.format('User cannot get runs',
                    query, err)
                )
              );
            assert.isNotEmpty(runs, 'User cannot find the runs');
            return done();
          }
        );
      }
    );

    it('15. Owner can get run by Id',
      function (done) {
        ownerApiAdapter.getRunById(privateProjectRunId,
          function (err, rId) {
            if (err || _.isEmpty(rId))
              return done(
                new Error(
                  util.format('User cannot get run by Id',
                    privateProjectRun.id, err)
                )
              );
            runId = rId;
            assert.isNotEmpty(runId, 'User cannot find the run by Id');
            return done();
          }
        );
      }
    );

    it('16. Member can get run by Id',
      function (done) {
        memberApiAdapter.getRunById(privateProjectRunId,
          function (err, rId) {
            if (err || _.isEmpty(rId))
              return done(
                new Error(
                  util.format('User cannot get run by Id',
                    privateProjectRun.id, err)
                )
              );
            runId = rId;
            assert.isNotEmpty(runId, 'User cannot find the run by Id');
            return done();
          }
        );
      }
    );

    it('17. Collaborater can get run by Id',
      function (done) {
        collaboraterApiAdapter.getRunById(privateProjectRunId,
          function (err, rId) {
            if (err || _.isEmpty(rId))
              return done(
                new Error(
                  util.format('User cannot get run by Id',
                    privateProjectRunId, err)
                )
              );
            runId = rId;
            assert.isNotEmpty(runId, 'User cannot find the run by Id');
            return done();
          }
        );
      }
    );

    it('18. Public user can get private run by Id',
      function (done) {
        global.pubAdapter.getRunById(privateProjectRunId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get run by Id: %s ' +
                'err : %s, %s', privateProjectRunId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('19. Public user can get public run by Id',
      function (done) {
        global.pubAdapter.getRunById(matrixRunId,
          function (err, rId) {
            if (err || _.isEmpty(rId))
              return done(
                new Error(
                  util.format('User cannot get run by Id',
                    matrixRunId, err)
                )
              );
            runId = rId;
            assert.isNotEmpty(runId, 'User cannot find the run by Id');
            return done();
          }
        );
      }
    );

    it('20. Unauthorized user can get private run by Id',
      function (done) {
        global.pubAdapter.getRunById(privateProjectRunId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get run by Id: %s ' +
                'err : %s, %s', privateProjectRunId, err, response)
            );
            return done();
          }
        );
      }
    );

    it('21. Unauthorized user can get public run by Id',
      function (done) {
        unauthorizedApiAdapter.getRunById(matrixRunId,
          function (err, rId) {
            if (err || _.isEmpty(rId))
              return done(
                new Error(
                  util.format('User cannot get run by Id',
                    matrixRunId, err)
                )
              );
            runId = rId;
            assert.isNotEmpty(runId, 'User cannot find the run by Id');
            return done();
          }
        );
      }
    );

    it('22. Owner deletes the private project',
      function (done) {
        var project =  _.first(
          _.where(projects, {isOrg: true, isPrivateRepository: true}
          )
        );
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {projectId: project.id};;
        ownerApiAdapter.deleteProjectById(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User can delete project id: %s, err: %s, %s',
                    project.id, err, response)
                )
              );
            global.removeTestResource(projects.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('23. Deleting matrixCI public Project',
      function (done) {
        var json = {projectId: matrixCIProject.id};
        collaboraterApiAdapter.deleteProjectById(matrixCIProject.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User can delete project id: %s, err: %s, %s',
                    matrixCIProject.id, err, response)
                )
              );
            global.removeTestResource(matrixCIProject.test_resource_name,
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
