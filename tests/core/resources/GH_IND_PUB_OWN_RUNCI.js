'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_IND_PUB_OWN_RUNCI';
var testSuiteDesc = 'Github Individual public repo, owner runCI tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboratorApiAdapter = null;
    var project = {};
    var matrixCIProject = {};
    var cacheCIProject = {};
    var successStatusCode = null;
    var failedStatusCode = null;
    var matrixRunId = null;

    this.timeout(0);

    // Since we are using an individual repo, individual is an owner of their
    // repo. We will use different adapters so that we can spread the tests
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
            collaboratorApiAdapter =
              global.newApiAdapterByStateAccount('ghCollaboratorAccount');

            successStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'SUCCESS'}).code;

            failedStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'FAILED'}).code;
            
            return done();
          }
        );
      }
    );

    it('1. Owner cannot get cache testing CI project',
      function (done) {
        ownerApiAdapter.getProjects('',
          function (err, prjs) {
            if (err || _.isEmpty(prjs))
              return done(new Error('Project list is empty', err));

            cacheCIProject = _.findWhere(prjs,
              {fullName: global.TEST_GH_CACHE_REPO}
            );

            cacheCIProject.test_resource_type = 'project';
            cacheCIProject.test_resource_name = 'ghCacheCIProject';

            assert.isNotEmpty(cacheCIProject, 'User cannot find the project');
            return done();
          }
        );
      }
    );

    it('2. Enabling a project to test Caching',
      function (done) {
        var json = {
          type: 'ci'
        };
        ownerApiAdapter.enableProjectById(cacheCIProject.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot enable the project with id:%s %s',
                    cacheCIProject.id, util.inspect(response))
                )
              );

            global.saveTestResource(cacheCIProject.test_resource_name, cacheCIProject,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('3. Trigger a manual build to create cache for the project',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master'};
            ownerApiAdapter.triggerNewBuildByProjectId(cacheCIProject.id, json,
              function (err, response) {
                if (err)
                  return reject(
                    new Error(
                      util.format('User cannot trigger manual build for ' +
                        'project id: %s, err: %s, %s', cacheCIProject.id, err,
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
            global.getRunByIdStatusWithBackOff(ownerApiAdapter, response.runId,
              successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('4. Testing if prior runs cached the project',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master', globalEnv: {TEST_CACHE: 'true'}};
            ownerApiAdapter.triggerNewBuildByProjectId(cacheCIProject.id, json,
              function (err, response) {
                if (err)
                  return reject(
                    new Error(
                      util.format('User cannot trigger cache test build for ' +
                        'project id: %s, err: %s, %s', cacheCIProject.id, err,
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
            global.getRunByIdStatusWithBackOff(ownerApiAdapter, response.runId,
              successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('5. Owner can reset cache of the project',
      function (done) {
        var json = {propertyBag: {cacheTag: 0}};
        ownerApiAdapter.putProjectById(cacheCIProject.id, json,
          function (err, project) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot reset cache of project id: %s, err: %s',
                    cacheCIProject.id, err)
                )
              );
            assert.isNotEmpty(project, 'project should not be empty');
            assert.isNotEmpty(project.propertyBag, 'propertyBag should not be'
              + 'empty');
            return done();
          }
        );
      }
    );

    it('6. Testing if reset cache really worked for the project',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master', globalEnv: {RESET_CACHE: 'true'}};
            ownerApiAdapter.triggerNewBuildByProjectId(cacheCIProject.id, json,
              function (err, response) {
                if (err)
                  return reject(
                    new Error(
                      util.format('User cannot trigger reset cache test ' +
                        'build for project id: %s, err: %s, %s',
                        cacheCIProject.id, err, util.inspect(response)
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
            global.getRunByIdStatusWithBackOff(ownerApiAdapter, response.runId,
              successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('7. Deleting cacheCIProject',
      function (done) {
        var json = {projectId: project.id};
        ownerApiAdapter.deleteProjectById(cacheCIProject.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User can delete project id: %s, err: %s, %s',
                    cacheCIProject.id, err, response)
                )
              );

            global.removeTestResource(cacheCIProject.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('8. Get matrix testing CI project',
      function (done) {
        collaboratorApiAdapter.getProjects('',
          function (err, prjs) {
            if (err || _.isEmpty(prjs))
              return done(new Error('Project list is empty', err));

            matrixCIProject = _.findWhere(prjs,
              {fullName: global.TEST_GH_MATRIX_REPO}
            );

            matrixCIProject.test_resource_type = 'project';
            matrixCIProject.test_resource_name = 'ghMatrixCIProject';

            assert.isNotEmpty(matrixCIProject, 'User cannot find the project');
            return done();
          }
        );
      }
    );

    it('9. Enabling a project to test Matrix builds',
      function (done) {
        var json = {
          type: 'ci'
        };
        collaboratorApiAdapter.enableProjectById(matrixCIProject.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot enable the project with id:%s %s',
                    matrixCIProject.id, util.inspect(response))
                )
              );

            global.saveTestResource(matrixCIProject.test_resource_name,
              matrixCIProject,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('10. Trigger a manual build to test matrix builds for the project',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master'};
            collaboratorApiAdapter.triggerNewBuildByProjectId(
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
            global.getRunByIdStatusWithBackOff(collaboratorApiAdapter,
              response.runId, successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('7. Checking if 6 jobs were created for matrixCIProject and if ' +
      'allow_failures worked',
      function (done) {
        var query = util.format('runIds=%s', matrixRunId);
        collaboratorApiAdapter.getJobs(query,
          function (err, jobs) {
            if (err || _.isEmpty(jobs))
              return done(
                new Error(
                  util.format('Cannot find jobs for run id: %s, err: %s',
                    matrixRunId, err)
                )
              );
            assert.equal(jobs.length, 6, 'Matrix should have 6 jobs');
            assert.equal(_.where(jobs, {statusCode: failedStatusCode}).length,
              2, 'Matrix should have 2 failures');
            assert.equal(_.where(jobs, {statusCode: successStatusCode}).length,
              4, 'Matrix should have 4 success');
            return done();
          }
        );
      }
    );

    it('8. Deleting matrixCIProject',
      function (done) {
        var json = {projectId: project.id};
        collaboratorApiAdapter.deleteProjectById(matrixCIProject.id, json,
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
