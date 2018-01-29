'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_JOBS';
var testSuiteDesc = 'Github Organization Jobs API tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var publicProjectRunId = null;
    var privateProjectRunId = null;
    var projects = [];
    var successStatusCode = null;
    var privateProjectJob = {};
    var publicProjectJob = {};

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
        var project =  _.first(
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
            global.saveTestResource(projects.test_resource_name, projects,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('2. Owner enables the public project',
      function (done) {
        var json = {
          type: 'ci'
        };
        var project =  _.first(
          _.where(projects, {isOrg: true, isPrivateRepository: false}
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
            global.saveTestResource(projects.test_resource_name, projects,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('3. Owner triggers manual build for the private project and build is successful',
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
            global.getRunByIdStatusWithBackOff(ownerApiAdapter, privateProjectRunId,
              successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('4. Owner triggers manual build for the public project and build is successful',
      function (done) {
        var project =  _.first(
          _.where(projects, {isOrg: true, isPrivateRepository: false}
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
            publicProjectRunId = response.runId;
            global.getRunByIdStatusWithBackOff(ownerApiAdapter, publicProjectRunId,
              successStatusCode, done);
          },
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('5. Owner can get all their jobs',
      function (done) {
        ownerApiAdapter.getJobs('',
          function (err, jobs) {
            if (err || _.isEmpty(jobs))
              return done(
                new Error(
                  util.format('User cannot get jobs',
                    query, err)
                )
              );
            publicProjectJob = _.findWhere(jobs, {runId: publicProjectRunId});
            privateProjectJob = _.findWhere(jobs, {runId: privateProjectRunId});
            assert.isNotEmpty(jobs, 'User cannot find the jobs');
            return done();
          }
        );
      }
    );

    it('6. Member can get all their jobs',
      function (done) {
        memberApiAdapter.getJobs('',
          function (err, jobs) {
            if (err || _.isEmpty(jobs))
              return done(
                new Error(
                  util.format('User cannot get jobs',
                    query, err)
                )
              );
            assert.isNotEmpty(jobs, 'User cannot find the jobs');
            return done();
          }
        );
      }
    );

    it('7. Collaborater can get all their jobs',
      function (done) {
        collaboraterApiAdapter.getJobs('',
          function (err, jobs) {
            if (err || _.isEmpty(jobs))
              return done(
                new Error(
                  util.format('User cannot get jobs',
                    query, err)
                )
              );
            assert.isNotEmpty(jobs, 'User cannot find the jobs');
            return done();
          }
        );
      }
    );

    it('8. Public user can get all public project jobs',
      function (done) {
        memberApiAdapter.getJobs('',
          function (err, jobs) {
            if (err || _.isEmpty(jobs))
              return done(
                new Error(
                  util.format('User cannot get jobs',
                    query, err)
                )
              );
            assert.isNotEmpty(jobs, 'User cannot find the jobs');
            return done();
          }
        );
      }
    );

    it('9. Unauthorized user can get all public project jobs',
      function (done) {
        unauthorizedApiAdapter.getJobs('',
          function (err, jobs) {
            if (err || _.isEmpty(jobs))
              return done(
                new Error(
                  util.format('User cannot get jobs',
                    query, err)
                )
              );
            assert.isNotEmpty(jobs, 'User cannot find the jobs');
            return done();
          }
        );
      }
    );

    it('10. Owner can get job by job Id',
      function (done) {
        ownerApiAdapter.getJobById(privateProjectJob.id,
          function (err, job) {
            if (err || _.isEmpty(job))
              return done(
                new Error(
                  util.format('User cannot get job from job Id',
                    query, err)
                )
              );
            assert.isNotEmpty(job, 'User cannot find the job by jobs Id');
            return done();
          }
        );
      }
    );

    it('11. Member can get job by job Id',
      function (done) {
        memberApiAdapter.getJobById(privateProjectJob.id,
          function (err, job) {
            if (err || _.isEmpty(job))
              return done(
                new Error(
                  util.format('User cannot get job from job Id',
                    query, err)
                )
              );
            assert.isNotEmpty(job, 'User cannot find the job by jobs Id');
            return done();
          }
        );
      }
    );

    it('12. Collaborater can get job by job Id',
      function (done) {
        collaboraterApiAdapter.getJobById(privateProjectJob.id,
          function (err, job) {
            if (err || _.isEmpty(job))
              return done(
                new Error(
                  util.format('User cannot get job from job Id',
                    query, err)
                )
              );
            assert.isNotEmpty(job, 'User cannot find the job by jobs Id');
            return done();
          }
        );
      }
    );

    it('13. Public user cannot get private project job by job Id',
      function (done) {
        global.pubAdapter.getJobById(privateProjectJob.id,
          function (err, job) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get job by job Id ' +
                'err : %s %s', err, job)
            );
            return done();
          }
        );
      }
    );

    it('14. Public user can get public project job by job Id',
      function (done) {
        global.pubAdapter.getJobById(publicProjectJob.id,
          function (err, job) {
            if (err || _.isEmpty(job))
              return done(
                new Error(
                  util.format('User cannot get job from job Id',
                    query, err)
                )
              );
            assert.isNotEmpty(job, 'User cannot find the job by jobs Id');
            return done();
          }
        );
      }
    );

    it('15. Unauthorized user cannot get private project job by job Id',
      function (done) {
        unauthorizedApiAdapter.getJobById(privateProjectJob.id,
          function (err, job) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get job by job Id ' +
                'err : %s %s', err, job)
            );
            return done();
          }
        );
      }
    );

    it('16. Unauthorized user can get public project job by job Id',
      function (done) {
        unauthorizedApiAdapter.getJobById(publicProjectJob.id,
          function (err, job) {
            if (err || _.isEmpty(job))
              return done(
                new Error(
                  util.format('User cannot get job from job Id',
                    query, err)
                )
              );
            assert.isNotEmpty(job, 'User cannot find the job by jobs Id');
            return done();
          }
        );
      }
    );

    it('17. Owner can delete job by job Id',
      function (done) {
        ownerApiAdapter.deleteJobsById(privateProjectJob.id,
          function (err) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete job by job Id %s err %s',
                    publicProjectJob.id, err)
                )
              );
            return done();
          }
        );
      }
    );

    it('18. Member cannot delete job by job Id',
      function (done) {
        memberApiAdapter.deleteJobsById(privateProjectJob.id,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete job by job Id: %s ' +
                'err : %s, %s', privateProjectJob.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('19. Collaborater cannot delete job by job Id',
      function (done) {
        collaboraterApiAdapter.deleteJobsById(privateProjectJob.id,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete job by job Id: %s ' +
                'err : %s, %s', privateProjectJob.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('20. Public user cannot delete private job by job Id',
      function (done) {
        global.pubAdapter.deleteJobsById(privateProjectJob.id,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to delete job by job Id: %s ' +
                'err : %s, %s', privateProjectJob.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('21. Public user cannot delete public project job by job Id',
      function (done) {
        global.pubAdapter.deleteJobsById(publicProjectJob.id,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to delete job by job Id: %s ' +
                'err : %s, %s', publicProjectJob.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('22. Unauthorized user cannot delete private job by job Id',
      function (done) {
        unauthorizedApiAdapter.deleteJobsById(privateProjectJob.id,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete job by job Id: %s ' +
                'err : %s, %s', privateProjectJob.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('23. Unauthorized user cannot delete public project job by job Id',
      function (done) {
        unauthorizedApiAdapter.deleteJobsById(publicProjectJob.id,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete job by job Id: %s ' +
                'err : %s, %s', privateProjectJob.id, err, response)
            );
            return done();
          }
        );
      }
    );

    it('24. Owner deletes the private project',
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
            return done();
            global.removeTestResource(projects.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('25. Owner deletes the public project',
      function (done) {
        var project =  _.first(
          _.where(projects, {isOrg: true, isPrivateRepository: false}
          )
        );
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
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
            global.removeTestResource(projects.test_resource_name,
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
