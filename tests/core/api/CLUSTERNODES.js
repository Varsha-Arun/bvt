'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var _ = require('underscore');
var testSuite = 'API_CLUSTERNODES';
var testSuiteDesc = 'API tests for cluster nodes';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var project = {};
    var clusterNodes = [];
    var clustersN = [];
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

            function _setSkipTest(bag, next) {
              var who = bag.who + '|' + _setSkipTest.name;
                logger.verbose(who, 'Inside');

                  if (bag.isSkipTest) {
                    bag.skipTest = true;
                      logger.debug(who, util.format('Test will skipped since it is manual'));
                  }
                return next();
            };

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

    it('3. Owner can get all their cluster nodes',
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

    it('4. Member can get all their cluster nodes',
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

    it('5. Collaborater can get all their cluster nodes',
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

    it('6. Public user cannot get cluster nodes',
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

    it('7. Owner can get cluster node by Id',
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

    it('8. Member can get cluster node by Id',
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

    it('9. Collaborater can get cluster node by Id',
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

    it('10. Public user cannot get cluster node by Id',
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

    it('11. Unauthorized user cannot get cluster node by Id',
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

    it('12. Owner can get passthough nodes script',
      function (done) {
        ownerApiAdapter.getPassthroughNodesScripts('',
          function (err, passthroughNodes) {
            if (err || _.isEmpty(passthroughNodes))
              return done(
                new Error(
                  util.format('User cannot get passthrough nodes script',
                    query, err)
                )
              );
            assert.isNotEmpty(passthroughNodes, 'User cannot find passthrough nodes script');
            return done();
          }
        );
      }
    );

    it('13. Collaborater can get passthough nodes script',
      function (done) {
        collaboraterApiAdapter.getPassthroughNodesScripts('',
          function (err, passthroughNodes) {
            if (err || _.isEmpty(passthroughNodes))
              return done(
                new Error(
                  util.format('User cannot get passthrough nodes script',
                    query, err)
                )
              );
            assert.isNotEmpty(passthroughNodes, 'User cannot find passthrough nodes script');
            return done();
          }
        );
      }
    );

    it('14. Member can get passthough nodes script',
      function (done) {
        memberApiAdapter.getPassthroughNodesScripts('',
          function (err, passthroughNodes) {
            if (err || _.isEmpty(passthroughNodes))
              return done(
                new Error(
                  util.format('User cannot get passthrough nodes script',
                    query, err)
                )
              );
            assert.isNotEmpty(passthroughNodes, 'User cannot find passthrough nodes script');
            return done();
          }
        );
      }
    );

    it('15. Public user cannot get passthough nodes script',
      function (done) {
        global.pubAdapter.getPassthroughNodesScripts('',
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not get passthrough nodes script ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('16. Unauthorized user cannot get passthough nodes script',
      function (done) {
        unauthorizedApiAdapter.getPassthroughNodesScripts('',
          function (err, passthroughNodes) {
            if (err || _.isEmpty(passthroughNodes))
              return done(
                new Error(
                  util.format('User cannot get passthrough nodes script',
                    query, err)
                )
              );
            assert.isNotEmpty(passthroughNodes, 'User cannot find passthrough nodes script');
            return done();
          }
        );
      }
    );

    it('17. Owner can create Cluster Node for ubuntu 16.04',
      function (done) {
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId,
          "friendlyName": "node-1",
          "isShippableInitialized": true,
          "isSwapEnabled": false,
          "location": global.clusterNodeIpAddressU16,
          "nodeTypeCode": 7000,
          "sshPort": 22,
          "nodeInitScript": "x86_64/Ubuntu_16.04/Docker_1.13.sh",
          "clusterId": 512
        };
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
          ownerApiAdapter.postClusterNodes(body,
            function (err, node) {
              if (err)
                return done(
                  new Error(
                    util.format('User cannot create Cluster node',
                      util.inspect(err))
                  )
                );
              clustersN = node;

              global.saveTestResource(clustersN.test_resource_name, clustersN,
                function () {
                  return done();
                }
              );
            }
          );
      }
    );

    it('18. Owner can get init script for cluster node by Id',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
          ownerApiAdapter.getInitScriptByClusterNodeId(clusterNodeId,
          function (err, initScript) {
            if (err || _.isEmpty(initScript))
              return done(
                new Error(
                  util.format('User cannot get init script by cluster node Id',
                    initScript, err)
                )
              );
            assert.isNotEmpty(initScript, 'User cannot find init script by cluster node Id');
            return done();
          }
        );
      }
    );

    it('19. Trigger a manual build for public project',
      function (done) {
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'customNode'};
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

    it('20. Owner can update Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId,
          "friendlyName": "nodetest"
        };
        ownerApiAdapter.putClusterNodeById(clusterNodeId, body,
          function (err, node) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Cluster node',
                    util.inspect(err))
                )
              );
            clustersN = node;
            assert.isNotEmpty(clustersN, 'User cannot find cluster node by Id');
            return done();
          }
        );
      }
    );

    it('21. Owner can delete Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        ownerApiAdapter.deleteClusterNodeById(
          clusterNodeId,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete Cluster Node for ubuntu 16.04 ' +
                    'id: %s, err: %s, %s', clusterNodeId, err,
                    response)
                )
              );
            global.removeTestResource(clustersN.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('22. Collaborater can create Cluster Node for ubuntu 16.04',
      function (done) {
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId,
          "friendlyName": "node-1",
          "isShippableInitialized": true,
          "isSwapEnabled": false,
          "location": "159.89.162.75",
          "nodeTypeCode": 7000,
          "sshPort": 22,
          "nodeInitScript": "x86_64/Ubuntu_16.04/Docker_1.13.sh",
          "clusterId": 512
        };
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        collaboraterApiAdapter.postClusterNodes(body,
          function (err, node) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Cluster node',
                    util.inspect(err))
                )
              );
            clustersN = node;

            global.saveTestResource(clustersN.test_resource_name, clustersN,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('23. Collaborater can get init script for cluster node by Id',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        collaboraterApiAdapter.getInitScriptByClusterNodeId(clusterNodeId,
          function (err, initScript) {
            if (err || _.isEmpty(initScript))
              return done(
                new Error(
                  util.format('User cannot get init script by cluster node Id',
                    initScript, err)
                )
              );
            assert.isNotEmpty(initScript, 'User cannot find init script by cluster node Id');
            return done();
          }
        );
      }
    );

    it('24. Trigger a manual build for public project',
      function (done) {
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'customNode'};
            collaboraterApiAdapter.triggerNewBuildByProjectId(project.id, json,
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

    it('25. Collaborater can update Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId,
          "friendlyName": "nodetest"
        };
        collaboraterApiAdapter.putClusterNodeById(clusterNodeId, body,
          function (err, node) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Cluster node',
                    util.inspect(err))
                )
              );
            clustersN = node;
            assert.isNotEmpty(clustersN, 'User cannot find cluster node by Id');
            return done();
          }
        );
      }
    );

    it('26. Collaborater can delete Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        collaboraterApiAdapter.deleteClusterNodeById(
          clusterNodeId,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete Cluster Node for ubuntu 16.04 ' +
                    'id: %s, err: %s, %s', clusterNodeId, err,
                    response)
                )
              );
            global.removeTestResource(clustersN.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('27. Member can create Cluster Node for ubuntu 16.04',
      function (done) {
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId,
          "friendlyName": "node-1",
          "isShippableInitialized": true,
          "isSwapEnabled": false,
          "location": "159.89.162.75",
          "nodeTypeCode": 7000,
          "sshPort": 22,
          "nodeInitScript": "x86_64/Ubuntu_16.04/Docker_1.13.sh",
          "clusterId": 512
        };
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        memberApiAdapter.postClusterNodes(body,
          function (err, node) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Cluster node',
                    util.inspect(err))
                )
              );
            clustersN = node;

            global.saveTestResource(clustersN.test_resource_name, clustersN,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('28. Member can get init script for cluster node by Id',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        memberApiAdapter.getInitScriptByClusterNodeId(clusterNodeId,
          function (err, initScript) {
            if (err || _.isEmpty(initScript))
              return done(
                new Error(
                  util.format('User cannot get init script by cluster node Id',
                    initScript, err)
                )
              );
            assert.isNotEmpty(initScript, 'User cannot find init script by cluster node Id');
            return done();
          }
        );
      }
    );

    it('29. Trigger a manual build for public project',
      function (done) {
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'customNode'};
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

    it('30. Member can update Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId,
          "friendlyName": "nodetest"
        };
        memberApiAdapter.putClusterNodeById(clusterNodeId, body,
          function (err, node) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Cluster node',
                    util.inspect(err))
                )
              );
            clustersN = node;
            assert.isNotEmpty(clustersN, 'User cannot find cluster node by Id');
            return done();
          }
        );
      }
    );

    it('31. Member can delete Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        memberApiAdapter.deleteClusterNodeById(
          clusterNodeId,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete Cluster Node for ubuntu 16.04 ' +
                    'id: %s, err: %s, %s', clusterNodeId, err,
                    response)
                )
              );
            global.removeTestResource(clustersN.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('32. Public user can create Cluster Node for ubuntu 16.04',
      function (done) {
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId, //"5ad239c9a7921e07001a02b9",
          "friendlyName": "node-1",
          "isShippableInitialized": true,
          "isSwapEnabled": false,
          "location": "159.89.162.75",
          "nodeTypeCode": 7000,
          "sshPort": 22,
          "nodeInitScript": "x86_64/Ubuntu_16.04/Docker_1.13.sh",
          "clusterId": 512
        };
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.pubAdapter.postClusterNodes(body,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to create cluster node ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('33. Public user cannot get init script for cluster node by Id',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.pubAdapter.getInitScriptByClusterNodeId(clusterNodeId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to get init script by cluster node Id ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('34. Public user can delete Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.pubAdapter.deleteClusterNodeById(
          clusterNodeId,
          function (err, response) {
            assert.strictEqual(err, 401,
              util.format('User should not be able to delete cluster node ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('35. Unauthorized user can create Cluster Node for ubuntu 16.04',
      function (done) {
        var body = {
          "subscriptionId": clusterNodes[0].subscriptionId, //"5ad239c9a7921e07001a02b9",
          "friendlyName": "node-1",
          "isShippableInitialized": true,
          "isSwapEnabled": false,
          "location": "159.89.162.75",
          "nodeTypeCode": 7000,
          "sshPort": 22,
          "nodeInitScript": "x86_64/Ubuntu_16.04/Docker_1.13.sh",
          "clusterId": 512
        };
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        unauthorizedApiAdapter.postClusterNodes(body,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to create cluster node ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('36. Unauthorized user cannot get init script for cluster node by Id',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        unauthorizedApiAdapter.getInitScriptByClusterNodeId(clusterNodeId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to get init script by cluster node Id ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('37. Unauthorized user can delete Cluster Node for ubuntu 16.04',
      function (done) {
        clusterNodeId = clustersN.id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        unauthorizedApiAdapter.deleteClusterNodeById(
          clusterNodeId,
          function (err, response) {
            assert.strictEqual(err, 404,
              util.format('User should not be able to delete cluster node ' +
                'err : %s, %s', err, response)
            );
            return done();
          }
        );
      }
    );

    it('38. Owner deletes a project',
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
