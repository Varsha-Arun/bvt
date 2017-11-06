'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_IND_PUB_FRK';
var testSuiteDesc = 'Github Individual public fork project tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var project = {};
    var runId = null;
    var processingStatusCode = null;
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

            processingStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'PROCESSING'}).code;

            successStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'SUCCESS'}).code;

            ownerApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));
                project = _.first(
                  _.where(prjs, {
                      isOrg: false,
                      isPrivateRepository: false,
                      isFork: true
                    }
                  )
                );

                project.test_resource_type = 'project';
                project.test_resource_name = 'ghIndividualPublicFork';

                assert.isNotEmpty(project, 'User cannot find the project');
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Owner can get the project',
      function (done) {
        ownerApiAdapter.getProjectById(project.id,
          function (err, prj) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get runId %s, err: %s', runId, err)
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(prj, 'Project cannot be empty');
            return done();
          }
        );
      }
    );

    it('2. Owner can enable the project',
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

    it('3. Owner can trigger manual build for the project',
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

            var expBackoff = backoff.exponential(
              {
                initialDelay: 100, // ms
                maxDelay: 6400, // max retry interval of 6.4 seconds
                failAfter: 30 // fail after 30 attempts i.e ~ 3 minutes
              }
            );

            expBackoff.on('backoff',
              function (number, delay) {
                logger.info('Run with id:', runId, ' not yet in processing. ' +
                  'Retrying after ', delay, ' ms');
              }
            );

            expBackoff.on('ready',
              function () {
                ownerApiAdapter.getRunById(runId,
                  function (err, run) {
                    if (err)
                      return done(
                        new Error('Failed to get run id: %s, err:', runId, err)
                      );

                    if (run.statusCode !== processingStatusCode) {
                      expBackoff.backoff();
                    } else {
                      expBackoff.reset();
                      return done();
                    }
                  }
                );
              }
            );

            // max number of backoffs reached
            expBackoff.on('fail',
              function () {
                return done(
                  new Error('Max number of back-offs reached')
                );
              }
            );

            expBackoff.backoff();
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('4. Owner triggered build for the project was successful',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            ownerApiAdapter.getRunById(runId,
              function (err, response) {
                if (err)
                  return reject(
                    new Error(
                      util.format('Cannot find the run for id: %s err: %s, %s',
                        runId, err, util.inspect(response)
                      )
                    )
                  );
                return resolve();
              }
            );
          }
        );

        triggerBuild.then(
          function () {
            var expBackoff = backoff.exponential(
              {
                initialDelay: 100, // ms
                maxDelay: 6400, // max retry interval of 6.4 seconds
                failAfter: 30 // fail after 30 attempts i.e ~ 3 minutes
              }
            );

            expBackoff.on('backoff',
              function (number, delay) {
                logger.info('Run with id:', runId, ' is still processing. ' +
                  'Retrying after ', delay, ' ms');
              }
            );

            expBackoff.on('ready',
              function () {
                ownerApiAdapter.getRunById(runId,
                  function (err, run) {
                    if (err)
                      return done(
                        new Error('Failed to get run id:', runId, err)
                      );

                    if (run.statusCode !== successStatusCode) {
                      expBackoff.backoff();
                    } else {
                      expBackoff.reset();
                      return done();
                    }
                  }
                );
              }
            );

            // max number of backoffs reached
            expBackoff.on('fail',
              function () {
                return done(
                  new Error('Max number of back-offs reached')
                );
              }
            );

            expBackoff.backoff();
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('5. Owner can view builds for the project',
      function (done) {
        ownerApiAdapter.getRunById(runId,
          function (err, run) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get Run %s, err: %s', runId, err)
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(run, 'Run cannot be empty');
            return done();
          }
        );
      }
    );

    it('6. Owner can view consoles for the run',
      function (done) {
        var bag = {
          runId: runId,
          adapter: ownerApiAdapter,
          logs: []
        };
        async.series([
            _getJobs.bind(null, bag),
            _getLogs.bind(null, bag)
          ],
          function (err) {
            assert.isNotEmpty(bag.logs, 'User did not find console logs');
            return done(err);
          }
        );
      }
    );

    function _getJobs(bag, next) {
      var query = util.format('runIds=%s', bag.runId);
      bag.adapter.getJobs(query,
        function (err, response) {
          if (err || _.isEmpty(response))
            return next(
              new Error(
                util.format('User cannot find jobs for run id: %s, err: %s',
                  bag.runId, err)
              )
            );
          bag.jobId = _.first(_.pluck(response, 'id'));
          return next();
        }
      );
    }

    function _getLogs(bag, next) {
      bag.adapter.getJobConsolesByJobId(bag.jobId, '',
        function (err, response) {
          if (err)
            return next(
              new Error(
                util.format('Cannot get consoles for job id: %s, err: %s',
                  bag.jobId, err)
              )
            );
          bag.logs = response;
          return next();
        }
      );
    }

    it('7. Owner can pause the project',
      function () {
        var pauseProject = new Promise(
          function (resolve, reject) {
            var json = {propertyBag: {isPaused: true}};
            ownerApiAdapter.putProjectById(project.id, json,
              function (err, project) {
                if (err)
                  return reject(new Error('User cannot pause project'));
                return resolve(project);
              }
            );
          }
        );
        return pauseProject.then(
          function (project) {
            assert.isNotEmpty(project, 'project should not be empty');
            assert.isNotEmpty(project.propertyBag, 'propertyBag should not be'
              + 'empty');
            assert.strictEqual(project.propertyBag.isPaused, true,
              'isPaused should be set to true');
          }
        );
      }
    );

    it('8. Owner can resume the project',
      function () {
        var pauseProject = new Promise(
          function (resolve, reject) {
            var json = {propertyBag: {isPaused: false}};
            ownerApiAdapter.putProjectById(project.id, json,
              function (err, project) {
                if (err)
                  return reject(
                    new Error(
                      util.format('User cannot resume project id: %s, err: %s',
                        projectId, err)
                    )
                  );
                return resolve(project);
              }
            );
          }
        );
        return pauseProject.then(
          function (project) {
            assert.isNotEmpty(project, 'project should not be empty');
            assert.isNotEmpty(project.propertyBag, 'propertyBag should not be'
              + 'empty');
            assert.strictEqual(project.propertyBag.isPaused, false,
              'isPaused should be set to false');
          }
        );
      }
    );

    it('9. Owner can delete the project',
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
