'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_PROJECTS';
var testSuiteDesc = 'Github Organization Project API tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var projects = [];

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

            return done();

          }
        );
      }
    );

    it('1. Owner can get their projects',
      function (done) {
        ownerApiAdapter.getProjects('',
          function (err, prjs) {
            if (err || _.isEmpty(prjs))
              return done(
                new Error(
                  util.format('User cannot get project',
                    query, err)
                )
              );
            projects = prjs;
            assert.isNotEmpty(projects, 'User cannot find the projects');
            assert.equal(projects.length,
              global.ADM_GH_PROJECT_COUNT, 'Project count needs to match');
            return done();
          }
        );
      }
    );

    it('2. Collaborator can get their projects',
      function (done) {
        collaboraterApiAdapter.getProjects('',
          function (err, prjs) {
            if (err || _.isEmpty(prjs))
              return done(
                new Error(
                  util.format('User cannot get project',
                    query, err)
                )
              );
            projects = prjs;
            assert.isNotEmpty(projects, 'User cannot find the projects');
            assert.equal(projects.length,
              global.COL_GH_PROJECT_COUNT, 'Project count needs to match');
            return done();
          }
        );
      }
    );

    it('3. Member can get their projects',
      function (done) {
        memberApiAdapter.getProjects('',
          function (err, prjs) {
            if (err || _.isEmpty(prjs))
              return done(
                new Error(
                  util.format('User cannot get project',
                    query, err)
                )
              );
            projects = prjs;
            assert.isNotEmpty(projects, 'User cannot find the projects');
            assert.equal(projects.length,
              global.MEM_GH_PROJECT_COUNT, 'Project count needs to match');
            return done();
          }
        );
      }
    );

    it('4. Public user cannot get projects',
      function (done) {
        global.pubAdapter.getProjects('',
          function (err, prjs) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the projects. ' +
                'err : %s %s', err, prjs)
            );
            return done();
          }
        );
      }
    );

    it('5. Owner can get project by ID',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        ownerApiAdapter.getProjectById(project.id,
          function (err, prj) {
            if (err || _.isEmpty(prj))
              return done(
                new Error(
                  util.format('User cannot get project from Id',
                    query, err)
                )
              );
            project = prj;
            assert.isNotEmpty(project, 'User cannot find the project by Id.');
            return done();
          }
        );
      }
    );

    it('6. Member can get project by ID',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        memberApiAdapter.getProjectById(project.id,
          function (err, prj) {
            if (err || _.isEmpty(prj))
              return done(
                new Error(
                  util.format('User cannot get project from Id',
                    query, err)
                )
              );
            project = prj;
            assert.isNotEmpty(project, 'User cannot find the project by Id.');
            return done();
          }
        );
      }
    );

    it('7. Collaborator can get project by Id',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        collaboraterApiAdapter.getProjectById(project.id,
          function (err, prj) {
            if (err || _.isEmpty(prj))
              return done(
                new Error(
                  util.format('User cannot get project from Id',
                    query, err)
                )
              );
            project = prj;
            assert.isNotEmpty(project, 'User cannot find the project by Id.');
            return done();
          }
        );
      }
    );

    it('8. Public user cannot get private project by ID',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        global.pubAdapter.getSubscriptionById(project.id,
          function (err, prj) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the project by Id. ' +
                'err : %s %s', err, prj)
            );
            return done();
          }
        );
      }
    );

    it('9. Public user can get public project by ID',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        global.pubAdapter.getProjectById(project.id,
          function (err, prj) {
            if (err || _.isEmpty(prj))
              return done(
                new Error(
                  util.format('User cannot get project from Id',
                    query, err)
                )
              );
            project = prj;
            assert.isNotEmpty(project, 'User cannot find the project by Id.');
            return done();
          }
        );
      }
    );

    it('10. Unauthorized user cannot get private project by ID',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        unauthorizedApiAdapter.getProjectById(project.id,
          function (err, prj) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get the project. ' +
                'err : %s %s', err, prj)
            );
            return done();
          }
        );
      }
    );

    it('11. Unauthorized user can get public project by ID',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        unauthorizedApiAdapter.getProjectById(project.id,
          function (err, prj) {
            if (err || _.isEmpty(prj))
              return done(
                new Error(
                  util.format('User cannot get project from Id',
                    query, err)
                )
              );
            project = prj;
            assert.isNotEmpty(project, 'User cannot find the project by Id.');
            return done();
          }
        );
      }
    );

    it('12. Owner enables the private project',
      function (done) {
        var json = {
          type: 'ci'
        };
        var project =  _.findWhere(projects, {isPrivateRepository: true});
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

            global.saveTestResource(project.test_resource_name, project,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('13. Owner enables the public project',
      function (done) {
        var json = {
          type: 'ci'
        };
        var project =  _.findWhere(projects, {isPrivateRepository: false});
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

            global.saveTestResource(project.test_resource_name, project,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('14. Owner can trigger manual build for the private project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        ownerApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('user cannot trigger manual build for ' +
                    'project id: %s, err: %s, %s', project.id, err,
                    util.inspect(response)
                  )
                )
              );
            return done();
          }
        );
      }
    );

    it('15. Owner can trigger manual build for the public project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        ownerApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('user cannot trigger manual build for ' +
                    'project id: %s, err: %s, %s', project.id, err,
                    util.inspect(response)
                  )
                )
              );
            return done();
          }
        );
      }
    );

    it('16. Member cannot trigger manual build for the private project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        memberApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to trigger build. ' +
                'err : %s %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('17. Member cannot trigger manual build for the public project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        memberApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to trigger build. ' +
                'err : %s %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('18. Collaborater can trigger manual build for the private project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        collaboraterApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('user cannot trigger manual build for ' +
                    'project id: %s, err: %s, %s', project.id, err,
                    util.inspect(response)
                  )
                )
              );
            return done();
          }
        );
      }
    );

    it('19. Collaborater can trigger manual build for the public project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        collaboraterApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('user cannot trigger manual build for ' +
                    'project id: %s, err: %s, %s', project.id, err,
                    util.inspect(response)
                  )
                )
              );
            return done();
          }
        );
      }
    );

    it('20. Unauthorized user cannot trigger manual build for the private project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        unauthorizedApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to trigger build. ' +
                'err : %s %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('21. Unauthorized user cannot trigger manual build for the public project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        unauthorizedApiAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to trigger build. ' +
                'err : %s %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('22. Public user cannot trigger manual build for the private project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        global.pubAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to trigger build. ' +
                'err : %s %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('23. Public user cannot trigger manual build for the public project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: false});
        assert.isNotEmpty(project,
          'Projects cannot be empty.');
        var json = {branchName: 'master'};
        global.pubAdapter.triggerNewBuildByProjectId(project.id, json,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to trigger build. ' +
                'err : %s %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('24. Owner deletes the private project',
      function (done) {
        var project =  _.findWhere(projects, {isPrivateRepository: true});
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
            global.removeTestResource(project.test_resource_name,
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
        var project =  _.findWhere(projects, {isPrivateRepository: false});
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
