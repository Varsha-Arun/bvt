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
    var clusterNodes = [];
    var runId = null;
    var clusterNodeId = null
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
                  _.where(prjs, {isOrg: true, isPrivateRepository: false}
                  )
                );

                project.test_resource_type = 'project';
                project.test_resource_name = 'ghOrgPublic';
                assert.isNotEmpty(project, 'User cannot find the project');

                return done();
              }
            );
          }
        );
      }
    );

  it('1. Owner enables a project',
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
            return done();
          }
        );
      }
    );

    it('2. Trigger a manual build for public project',
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

    it('3. Owner deletes a project',
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

    it('4. Owner can get all their cluster nodes',
      function (done) {
        ownerApiAdapter.getClusterNodes('',
          function (err, nodes) {
            if (err || _.isEmpty(nodes))
              return done(
                new Error(
                  util.format('User cannot get cluster nodes',
                    query, err)
                )
              );
            clusterNodes = nodes;
            var clusterNode = _.first(clusterNodes);
            clusterNodeId = clusterNode.id;
            assert.isNotEmpty(clusterNodes, 'User cannot find the cluster nodes');
            return done();
          }
        );
      }
    );

    it('5. Member can get all their cluster nodes',
      function (done) {
        memberApiAdapter.getClusterNodes('',
          function (err, nodes) {
            if (err || _.isEmpty(nodes))
              return done(
                new Error(
                  util.format('User cannot get cluster nodes',
                    query, err)
                )
              );
            clusterNodes = nodes;
            assert.isNotEmpty(clusterNodes, 'User cannot find the cluster nodes');
            return done();
          }
        );
      }
    );

    it('6. Collaborater can get all their cluster nodes',
      function (done) {
        collaboraterApiAdapter.getClusterNodes('',
          function (err, nodes) {
            if (err || _.isEmpty(nodes))
              return done(
                new Error(
                  util.format('User cannot get cluster nodes',
                    query, err)
                )
              );
            clusterNodes = nodes;
            assert.isNotEmpty(clusterNodes, 'User cannot find the cluster nodes');
            return done();
          }
        );
      }
    );

    it('7. Public user cannot get cluster nodes',
      function (done) {
        global.pubAdapter.getClusterNodes('',
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get cluster nodes ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('8. Owner can get cluster node by Id',
      function (done) {
        ownerApiAdapter.getClusterNodeById(clusterNodeId,
          function (err, cluNode) {
            if (err || _.isEmpty(cluNode))
              return done(
                new Error(
                  util.format('User cannot get cluster node by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(cluNode, 'User cannot find cluster node by Id');
            return done();
          }
        );
      }
    );

    it('9. Member can get cluster node by Id',
      function (done) {
        memberApiAdapter.getClusterNodeById(clusterNodeId,
          function (err, cluNode) {
            if (err || _.isEmpty(cluNode))
              return done(
                new Error(
                  util.format('User cannot get cluster node by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(cluNode, 'User cannot find cluster node by Id');
            return done();
          }
        );
      }
    );

    it('10. Collaborater can get cluster node by Id',
      function (done) {
        collaboraterApiAdapter.getClusterNodeById(clusterNodeId,
          function (err, cluNode) {
            if (err || _.isEmpty(cluNode))
              return done(
                new Error(
                  util.format('User cannot get cluster node by Id',
                    query, err)
                )
              );
            assert.isNotEmpty(cluNode, 'User cannot find cluster node by Id');
            return done();
          }
        );
      }
    );

    it('11. Public user cannot get cluster node by Id',
      function (done) {
        global.pubAdapter.getClusterNodeById(clusterNodeId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get cluster node by Id ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('12. Unauthorized user cannot get cluster node by Id',
      function (done) {
        unauthorizedApiAdapter.getClusterNodeById(clusterNodeId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get cluster node by Id ' +
                'err : %s, %s', err, response)
            );
            return done();
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
