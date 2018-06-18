//'use strict';
//
//var testSetup = require('../../../testSetup.js');
//var backoff = require('backoff');
//
//var testSuite = 'LANGUAGETESTS_AMI_v6.2.4';
//var testSuiteDesc = 'Github Organization language tests for AMI v6.2.4';
//var test = util.format('%s - %s', testSuite, testSuiteDesc);
//
//describe(test,
//  function () {
//    var amiApiAdapter = null;
//    var privateProjectRunId = null;
//    var projects = [];
//    var project = {};
//    var successStatusCode = null;
//    var projectIds = {};
//    var projectId = null;
//    var projects = {};
//    var runs = [];
//
//    this.timeout(0);
//    before(
//      function (done) {
//        async.series(
//          [
//            testSetup.bind(null)
//          ],
//          function (err) {
//            if (err) {
//              logger.error(test, 'Failed to setup tests. err:', err);
//              return done(err);
//            }
//            amiApiAdapter =
//              global.newApiAdapterByStateAccount('ghAmiAccount');
//
//            successStatusCode = _.findWhere(global.systemCodes,
//              {group: 'statusCodes', name: 'SUCCESS'}).code;
//
//            amiApiAdapter.getProjects('',
//              function (err, prjs) {
//                if (err || _.isEmpty(prjs))
//                  return done(new Error('Project list is empty', err));
//
//                projects = prjs;
//                projects.test_resource_type = 'projects';
//                projects.test_resource_name = 'ghOwnerProjects';
//                assert.isNotEmpty(projects, 'User cannot find the projects');
//
//                var u16allProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16all'}
//                  )
//                );
//                var u16cloallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16cloall'}
//                  )
//                );
//                var u16cppallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16cppall'}
//                  )
//                );
//                var u16golallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16golall'}
//                  )
//                );
//                var u16javallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16javall'}
//                  )
//                );
//                var u16nodallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16nodall'}
//                  )
//                );
//                var u16phpallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16phpall'}
//                  )
//                );
//                var u16pytallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16pytall'}
//                  )
//                );
//                var u16ruballProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16ruball'}
//                  )
//                );
//                var u16scaallProject = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16scaall'}
//                  )
//                );
//                var u16Project = _.first(
//                  _.where(projects, {isOrg: true, fullName: 'ami-v6-2-4/u16'}
//                  )
//                );
//                var u16allProjectId = u16allProject.id;
//                var u16cloallProjectId = u16cloallProject.id;
//                var u16cppallProjectId = u16cppallProject.id;
//                var u16golallProjectId = u16golallProject.id;
//                var u16javallProjectId = u16javallProject.id;
//                var u16nodallProjectId = u16nodallProject.id;
//                var u16phpallProjectId = u16phpallProject.id;
//                var u16pytallProjectId = u16pytallProject.id;
//                var u16ruballProjectId = u16ruballProject.id;
//                var u16scaallProjectId = u16scaallProject.id;
//                var u16ProjectId = u16Project.id;
//                projectIds = [u16ProjectId, u16cppallProjectId, u16phpallProjectId, u16golallProjectId, u16scaallProjectId, u16javallProjectId, u16cloallProjectId, u16nodallProjectId, u16pytallProjectId, u16allProjectId, u16ruballProjectId];
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('1. Enable all projects',
//      function (done) {
//        var json = {
//          type: 'ci'
//        };
//        async.each(projectIds,
//          function (projId, nextProjId) {
//            amiApiAdapter.enableProjectById(projId, json,
//              function (err, response) {
//                if (err)
//                  return nextProjId(
//                    new Error(
//                      util.format('User cannot enable the project with id:%s %s',
//                        project.id, util.inspect(response))
//                      )
//                    );
//                  return nextProjId();
//                }
//              );
//            },
//            function (err) {
//              return done(err);
//            }
//        )
//      }
//    );
//
//    it('2. Triggers all projects',
//      function (done) {
//        var triggerBuild = new Promise(
//          function (resolve, reject) {
//            var json = {branchName: 'master'};
//            async.each(projectIds,
//              function (projId, nextProjId) {
//                amiApiAdapter.triggerNewBuildByProjectId(projId, json,
//                  function (err, response) {
//                    if (err)
//                      return nextProjId(
//                        new Error(
//                          util.format('user cannot trigger manual build for ' +
//                            'project id: %s, err: %s, %s', projId, err,
//                              util.inspect(response)
//                          )
//                        )
//                      );
//                    return nextProjId();
//                  }
//                );
//              },
//              function (err) {
//                  return done(err);
//              }
//            )
//          }
//        )
//      }
//    );
//
//    it('3. Owner gets all the runs',
//      function (done) {
//        amiApiAdapter.getRuns('',
//          function (err, rs) {
//            if (err || _.isEmpty(rs))
//              return done(
//                new Error(
//                  util.format('User cannot get runs',
//                    query, err)
//                )
//              );
//            runs = rs;
//            assert.isNotEmpty(runs, 'User cannot find the runs');
//            return done();
//          }
//        );
//      }
//    );
//
//    it('4. u16 base image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('5. u16 cpp image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16cppall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('6. u16 php image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16phpall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('7. u16 go image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16golall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('8. u16 scala image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16scaall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('9. u16 java image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16javall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('10. u16 clojure image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16cloall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('11. u16 nodejs image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16nodall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('12. u16 python image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16pytall', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('13. u16all service image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16all', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('14. u16 ruby image project build is successful',
//      function (done) {
//        var runId = _.findWhere(runs, {projectName: 'u16ruball', subscriptionOrgName: 'ami-v6-2-4'}).id;
//        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
//          successStatusCode, done);
//      },
//      function(err) {
//        return(err);
//      }
//    );
//
//    it('15. Disable all projects',
//      function (done) {
//        async.each(projectIds,
//          function (projId, nextProjId) {
//            var json = {projectId: projId};
//            amiApiAdapter.deleteProjectById(projId, json,
//              function (err, response) {
//                if (err)
//                  return nextProjId(
//                    new Error(
//                      util.format('User cannot disable the project with id:%s %s',
//                        projId, util.inspect(response))
//                    )
//                  );
//                  return nextProjId();
//                }
//              );
//            },
//          function (err) {
//            return done(err);
//          }
//        );
//      }
//    );
//
//    after(
//      function (done) {
//        return done();
//      }
//    );
//  }
//);
