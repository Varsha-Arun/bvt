'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'LANGUAGETESTS_AMI_v6.9.4';
var testSuiteDesc = 'Github Organization language tests for AMI v6.9.4';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var amiApiAdapter = null;
    var privateProjectRunId = null;
    var projects = [];
    var project = {};
    var successStatusCode = null;
    var projectIds = {};
    var projectId = null;
    var projects = {};
    var runs = [];

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
            amiApiAdapter =
              global.newApiAdapterByStateAccount('ghAmiAccount');

            successStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'SUCCESS'}).code;

            amiApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));

                projects = prjs;
                projects.test_resource_type = 'projects';
                projects.test_resource_name = 'ghOwnerProjects';
                assert.isNotEmpty(projects, 'User cannot find the projects');

                var u14Project = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u14'}
                  )
                );
                var u16allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16all'}
                  )
                );
                var u16cloallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16cloall'}
                  )
                );
                var u16cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16cppall'}
                  )
                );
                var u16golallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16golall'}
                  )
                );
                var u16javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16javall'}
                  )
                );
                var u16nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16nodall'}
                  )
                );
                var u16phpallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16phpall'}
                  )
                );
                var u16pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16pytall'}
                  )
                );
                var u16ruballProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16ruball'}
                  )
                );
                var u16scaallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16scaall'}
                  )
                );
                var u16Project = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/u16'}
                  )
                );
                var aarch64u16Project = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/aarch64_u16'}
                  )
                );
                var aarch64u16allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/aarch64_u16all'}
                  )
                );
                var aarch64u16cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/aarch64_u16cppall'}
                  )
                );
                var aarch64u16javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/aarch64_u16javall'}
                  )
                );
                var aarch64u16nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/aarch64_u16nodall'}
                  )
                );
                var aarch64u16pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/aarch64_u16pytall'}
                  )
                );
                var c7Project = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/c7'}
                  )
                );
                var c7allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/c7all'}
                  )
                );
                var c7cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/c7cppall'}
                  )
                );
                var c7javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/c7javall'}
                  )
                );
                var c7nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/c7nodall'}
                  )
                );
                var c7pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: 'ami-v6-9-4/c7pytall'}
                  )
                );
                var u14ProjectId = u14Project.id;
                var u16ProjectId = u16Project.id;
                var u16allProjectId = u16allProject.id;
                var u16cloallProjectId = u16cloallProject.id;
                var u16cppallProjectId = u16cppallProject.id;
                var u16golallProjectId = u16golallProject.id;
                var u16javallProjectId = u16javallProject.id;
                var u16nodallProjectId = u16nodallProject.id;
                var u16phpallProjectId = u16phpallProject.id;
                var u16pytallProjectId = u16pytallProject.id;
                var u16ruballProjectId = u16ruballProject.id;
                var u16scaallProjectId = u16scaallProject.id;
                var aarch64u16ProjectId = aarch64u16Project.id;
                var aarch64u16allProjectId = aarch64u16allProject.id;
                var aarch64u16cppallProjectId = aarch64u16cppallProject.id;
                var aarch64u16javallProjectId = aarch64u16javallProject.id;
                var aarch64u16nodallProjectId = aarch64u16nodallProject.id;
                var aarch64u16pytallProjectId = aarch64u16pytallProject.id;
                var c7ProjectId = c7Project.id;
                var c7allProjectId = c7allProject.id;
                var c7cppallProjectId = c7cppallProject.id;
                var c7javallProjectId = c7javallProject.id;
                var c7nodallProjectId = c7nodallProject.id;
                var c7pytallProjectId = c7pytallProject.id;
                projectIds = [u14ProjectId, u16ProjectId, u16cppallProjectId, u16phpallProjectId, u16golallProjectId, u16scaallProjectId, u16javallProjectId, u16cloallProjectId, u16nodallProjectId, u16pytallProjectId, u16allProjectId, u16ruballProjectId, aarch64u16ProjectId, aarch64u16allProjectId, aarch64u16cppallProjectId, aarch64u16javallProjectId, aarch64u16nodallProjectId, aarch64u16pytallProjectId, c7ProjectId, c7allProjectId, c7cppallProjectId, c7javallProjectId, c7nodallProjectId, c7pytallProjectId];
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Enable all projects',
      function (done) {
        var json = {
          type: 'ci'
        };
        async.each(projectIds,
          function (projId, nextProjId) {
            amiApiAdapter.enableProjectById(projId, json,
              function (err, response) {
                if (err)
                  return nextProjId(
                    new Error(
                      util.format('User cannot enable the project with id:%s %s',
                        project.id, util.inspect(response))
                      )
                    );
                  return nextProjId();
                }
              );
            },
            function (err) {
              return done(err);
            }
        )
      }
    );

    it('2. Triggers all projects',
      function (done) {
        var triggerBuild = new Promise(
          function (resolve, reject) {
            var json = {branchName: 'master'};
            async.each(projectIds,
              function (projId, nextProjId) {
                amiApiAdapter.triggerNewBuildByProjectId(projId, json,
                  function (err, response) {
                    if (err)
                      return nextProjId(
                        new Error(
                          util.format('user cannot trigger manual build for ' +
                            'project id: %s, err: %s, %s', projId, err,
                              util.inspect(response)
                          )
                        )
                      );
                    return nextProjId();
                  }
                );
              },
              function (err) {
                  return done(err);
              }
            )
          }
        )
      }
    );

    it('3. Owner gets all the runs',
      function (done) {
        amiApiAdapter.getRuns('',
          function (err, rs) {
            if (err || _.isEmpty(rs))
              return done(
                new Error(
                  util.format('User cannot get runs',
                    query, err)
                )
              );

            runs = rs;
            var delayInMilliseconds = 1000; //1 second
            setTimeout(function() {
              //Code to be executed after 1 second since we need to get all the runs being created
            }, delayInMilliseconds);

            assert.isNotEmpty(runs, 'User cannot find the runs');
            return done();
          }
        );
      }
    );

    it('4. u16 base image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('5. u16 cpp image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16cppall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);

      },
      function(err) {
        return(err);
      }
    );

    it('6. u16 php image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16phpall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('7. u16 go image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16golall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('8. u16 scala image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16scaall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('9. u16 java image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16javall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('10. u16 clojure image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16cloall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('11. u16 nodejs image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16nodall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('12. u16 python image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16pytall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('13. u16all service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16all', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('14. u16 ruby image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16ruball', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('15. aarch64u16 service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16', subscriptionOrgName: 'ami-v6-9-4'}).id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('16. aarch64u16all service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16all', subscriptionOrgName: 'ami-v6-9-4'}).id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('17. aarch64u16cppall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16cppall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('18. aarch64u16javall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16javall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('19. aarch64u16nodall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16nodall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('20. aarch64u16pytall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16pytall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        if(global.testManual === 'true') {
          console.log('Skipping as this test case cannot be run as part of automation');
          return done();
        }
        else
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('21. c7 service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('22. c7all service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7all', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('23. c7cppall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7cppall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('24. c7javall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7javall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('25. c7nodall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7nodall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('26. c7pytall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7pytall', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('27. u14 base image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14', subscriptionOrgName: 'ami-v6-9-4'}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('28. Disable all projects',
      function (done) {
        async.each(projectIds,
          function (projId, nextProjId) {
            var json = {projectId: projId};
            amiApiAdapter.deleteProjectById(projId, json,
              function (err, response) {
                if (err)
                  return nextProjId(
                    new Error(
                      util.format('User cannot disable the project with id:%s %s',
                        projId, util.inspect(response))
                    )
                  );
                  return nextProjId();
                }
              );
            },
          function (err) {
            return done(err);
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
