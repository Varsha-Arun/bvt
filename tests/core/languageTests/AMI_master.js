'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'LANGUAGETESTS_AMI_master';
var testSuiteDesc = 'Github Organization language tests for AMI master';
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
    var syncRepo = {};
    var subscriptionIntegration = {};
    var syncRepoResource = {};
    var rSyncJob = {};
    var rSyncCode = null;
    var syncRepoCode = null;
    var w16aspnetcoreRunsh = {};
    var w16dotnetcoreRunsh = {};
    var subscriptionName = null;

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

            amiApiAdapter =
              global.newApiAdapterByStateAccount('ghAmiAccount');

            successStatusCode = _.findWhere(global.systemCodes,
              {group: 'statusCodes', name: 'SUCCESS'}).code;
            
            rSyncCode = _.findWhere(global.systemCodes,
              {name: 'rSync', group: 'resource'}).code;
            syncRepoCode = _.findWhere(global.systemCodes,
              {name: 'syncRepo', group: 'resource'}).code;
            

            amiApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));

                subscriptionName = 'ami-master';
                projects = prjs;
                projects.test_resource_type = 'projects';
                projects.test_resource_name = 'ghOwnerProjects';
                assert.isNotEmpty(projects, 'User cannot find the projects');

                syncRepo = _.first(
                  _.where(prjs, {isOrg: true, fullName: subscriptionName+'/w17'}
                  )
                );
                var u14Project = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14'}
                  )
                );
                var u14allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14all'}
                  )
                );
                var u14cloallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14cloall'}
                  )
                );
                var u14cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14cppall'}
                  )
                );
                var u14golallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14golall'}
                  )
                );
                var u14javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14javall'}
                  )
                );
                var u14nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14nodall'}
                  )
                );
                var u14phpallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14phpall'}
                  )
                );
                var u14pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14pytall'}
                  )
                );
                var u14ruballProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14ruball'}
                  )
                );
                var u14scaallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u14scaall'}
                  )
                );
                var u16allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16all'}
                  )
                );
                var u16cloallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16cloall'}
                  )
                );
                var u16cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16cppall'}
                  )
                );
                var u16golallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16golall'}
                  )
                );
                var u16javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16javall'}
                  )
                );
                var u16nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16nodall'}
                  )
                );
                var u16phpallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16phpall'}
                  )
                );
                var u16pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16pytall'}
                  )
                );
                var u16ruballProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16ruball'}
                  )
                );
                var u16scaallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16scaall'}
                  )
                );
                var u16Project = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/u16'}
                  )
                );
                var aarch64u16Project = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/aarch64_u16'}
                  )
                );
                var aarch64u16allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/aarch64_u16all'}
                  )
                );
                var aarch64u16cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/aarch64_u16cppall'}
                  )
                );
                var aarch64u16javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/aarch64_u16javall'}
                  )
                );
                var aarch64u16nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/aarch64_u16nodall'}
                  )
                );
                var aarch64u16pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/aarch64_u16pytall'}
                  )
                );
                var c7Project = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7'}
                  )
                );
                var c7allProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7all'}
                  )
                );
                var c7cloallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7cloall'}
                  )
                );
                var c7cppallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7cppall'}
                  )
                );
                var c7golallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7golall'}
                  )
                );
                var c7javallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7javall'}
                  )
                );
                var c7nodallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7nodall'}
                  )
                );
                var c7phpallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7phpall'}
                  )
                );
                var c7pytallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7pytall'}
                  )
                );
                var c7ruballProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7ruball'}
                  )
                );
                var c7scaallProject = _.first(
                  _.where(projects, {isOrg: true, fullName: subscriptionName+'/c7scaall'}
                  )
                );
                var u14ProjectId = u14Project.id;
                var u14allProjectId = u14allProject.id;
                var u14cloallProjectId = u14cloallProject.id;
                var u14cppallProjectId = u14cppallProject.id;
                var u14golallProjectId = u14golallProject.id;
                var u14javallProjectId = u14javallProject.id;
                var u14nodallProjectId = u14nodallProject.id;
                var u14phpallProjectId = u14phpallProject.id;
                var u14pytallProjectId = u14pytallProject.id;
                var u14ruballProjectId = u14ruballProject.id;
                var u14scaallProjectId = u14scaallProject.id;
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
                var c7cloallProjectId = c7cloallProject.id;
                var c7cppallProjectId = c7cppallProject.id;
                var c7golallProjectId = c7golallProject.id;
                var c7javallProjectId = c7javallProject.id;
                var c7nodallProjectId = c7nodallProject.id;
                var c7phpallProjectId = c7phpallProject.id;
                var c7pytallProjectId = c7pytallProject.id;
                var c7ruballProjectId = c7ruballProject.id;
                var c7scaallProjectId = c7scaallProject.id;
                projectIds = [u14ProjectId, u14cppallProjectId, u14phpallProjectId, u14golallProjectId, u14scaallProjectId, u14javallProjectId, u14cloallProjectId, u14nodallProjectId, u14pytallProjectId, u14allProjectId, u14ruballProjectId, u16ProjectId, u16cppallProjectId, u16phpallProjectId, u16golallProjectId, u16scaallProjectId, u16javallProjectId, u16cloallProjectId, u16nodallProjectId, u16pytallProjectId, u16allProjectId, u16ruballProjectId, aarch64u16ProjectId, aarch64u16allProjectId, aarch64u16cppallProjectId, aarch64u16javallProjectId, aarch64u16nodallProjectId, aarch64u16pytallProjectId, c7ProjectId, c7allProjectId, c7cloallProjectId, c7cppallProjectId, c7golallProjectId, c7javallProjectId, c7nodallProjectId, c7phpallProjectId, c7pytallProjectId, c7ruballProjectId, c7scaallProjectId];
              
                assert.isNotEmpty(syncRepo, 'User cannot find the rSync repo');
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
        var runId = _.findWhere(runs, {projectId: u16ProjectId}).id;
        console.log('u16ProjectId::::::::::::::::::::::::::::::::::::::::::::::::', u16ProjectId);
        console.log('u14golallProject::::::::::::::::::::::::::::::::::::::::::::::::', u14golallProject);
        console.log('c7phpallProject:::::::::::::::::::::::::::::::::::::::::::::::::', c7phpallProject);
        console.log('aarch64u16cppallProject:::::::::::::::::::::::::::::::::::::::::', aarch64u16cppallProject);
        console.log('u16Project::::::::::::::::::::::::::::::::::::::::::::::::::::::', u16Project);
        console.log('u14golallProjectId::::::::::::::::::::::::::::::::::::::::::::::', u14golallProjectId);
        console.log('c7phpallProjectId:::::::::::::::::::::::::::::::::::::::::::::::', c7phpallProjectId);
        console.log('aarch64u16cppallProjectId:::::::::::::::::::::::::::::::::::::::', aarch64u16cppallProjectId);
        console.log('u16ProjectId::::::::::::::::::::::::::::::::::::::::::::::::::::', u16ProjectId);
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('5. u16 cpp image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16cppall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('6. u16 php image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16phpall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('7. u16 go image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16golall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('8. u16 scala image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16scaall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('9. u16 java image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16javall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('10. u16 clojure image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16cloall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('11. u16 nodejs image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16nodall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('12. u16 python image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16pytall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('13. u16all service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16all', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('14. u16 ruby image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u16ruball', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('15. aarch64u16 service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16', subscriptionOrgName: subscriptionName}).id;
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
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16all', subscriptionOrgName: subscriptionName}).id;
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
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16cppall', subscriptionOrgName: subscriptionName}).id;
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
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16javall', subscriptionOrgName: subscriptionName}).id;
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
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16nodall', subscriptionOrgName: subscriptionName}).id;
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
        var runId = _.findWhere(runs, {projectName: 'aarch64_u16pytall', subscriptionOrgName: subscriptionName}).id;
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
        var runId = _.findWhere(runs, {projectName: 'c7', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('22. c7all service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7all', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('23. c7cloall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7cloall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
 
    it('24. c7cppall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7cppall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('25. c7golall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7golall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    it('26. c7javall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7javall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('27. c7nodall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7nodall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('28. c7phpall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7phpall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    it('29. c7pytall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7pytall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    it('30. c7ruball service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7ruball', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    it('31. c7scaall service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'c7scaall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    it('32. u14 base image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    it('33. u14 cpp image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14cppall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('34. u14 php image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14phpall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('35. u14 go image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14golall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('36. u14 scala image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14scaall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('37. u14 java image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14javall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('38. u14 clojure image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14cloall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('39. u14 nodejs image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14nodall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('40. u14 python image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14pytall', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('41. u14all service image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14all', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );

    it('42. u14 ruby image project build is successful',
      function (done) {
        var runId = _.findWhere(runs, {projectName: 'u14ruball', subscriptionOrgName: subscriptionName}).id;
        global.getRunByIdStatusWithBackOff(amiApiAdapter, runId,
          successStatusCode, done);
      },
      function(err) {
        return(err);
      }
    );
  
    //Commenting tests for windows image since windows node is not available for AMI master in rc
  
    it('43. Owner gets the subscriptionIntegration',
      function (done) {
        amiApiAdapter.getSubscriptionIntegrations('',
          function (err, sis) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get subscriptionIntegrations', err)
                )
              );
            assert.isNotEmpty(sis, 'Subscription Integration cannot be empty');

            subscriptionIntegration =
              _.findWhere(sis,{name: global.GH_ORG_SUB_INT_GH});
            return done();
          }
        );
      }
    );

    it('44. Owner adds a sync repo',
      function (done) {
        var body = {
          resourceName: syncRepo.name + '_master',
          projectId: syncRepo.id,
          subscriptionId: syncRepo.subscriptionId,
          branch: 'master',
          subscriptionIntegrationId: subscriptionIntegration.id
        };

        amiApiAdapter.postNewSyncRepo(body,
          function (err) {
            if (err)
              return done(
                new Error(
                  util.format('unable to post new sync repo with body: %s ' +
                    'err:%s', util.inspect(body), util.inspect(err))
                )
              );

            return done();
          }
        );
      }
    );

    it('45. Owner gets sync Repo object created',
      function (done) {
        amiApiAdapter.getResources('',
          function (err, res) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get resources, err: %s',
                    util.inspect(err))
                )
              );
            assert.isNotEmpty(res, 'User resources cannot be empty');

            rSyncJob = _.findWhere(res, {"typeCode": rSyncCode});
            syncRepoResource = _.findWhere(res, {"typeCode": syncRepoCode});

            assert.isNotEmpty(rSyncJob, 'User could not find rSync Job');
            assert.isNotEmpty(syncRepoResource, 'User could not find syncRepo ' +
              'Resource');

            syncRepoResource.test_resource_type = 'syncRepo';
            syncRepoResource.test_resource_name = 'ghOrgPrivateSyncRepo';
            global.saveTestResource(syncRepoResource.test_resource_name,
              syncRepoResource,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('46. Owner should be able to trigger build',
      function (done) {
        amiApiAdapter.triggerNewBuildByResourceId(rSyncJob.id, {},
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('user cannot trigger manual build for ' +
                    'job id: %s, err: %s, %s', rSyncJob.id, err,
                    util.inspect(response)
                  )
                )
              );
            assert.isNotEmpty(response, 'User cannot trigger a build');
            return done();
          }
        );
      }
    );

    it('47. SyncRepo build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(amiApiAdapter, rSyncJob,
          'rSyncJob', buildSuccessStatusCode, done);
      }
    );
  
    it('48. Owner should be able to get w16aspnetcore-runsh runSh job',
      function (done) {
        global.getResourceByNameAndTypeCode(amiApiAdapter, 'w16aspnetcore-runsh',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            w16aspnetcoreRunsh = response.resource;
            assert.isNotEmpty(w16aspnetcoreRunsh, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('49. Owner should be able to trigger w16aspnetcore-runsh runSh job',
      function (done) {
        amiApiAdapter.triggerNewBuildByResourceId(w16aspnetcoreRunsh.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('50. w16aspnetcore-runsh build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(amiApiAdapter, w16aspnetcoreRunsh,
          'w16aspnetcore-runsh', successStatusCode, done);
      }
    );
  
    it('51. Owner should be able to get w16dotnetcore-runsh runSh job',
      function (done) {
        global.getResourceByNameAndTypeCode(amiApiAdapter, 'w16dotnetcore-runsh',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            w16dotnetcoreRunsh = response.resource;
            assert.isNotEmpty(w16aspnetcoreRunsh, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('52. Owner should be able to trigger w16dotnetcore-runsh runSh job',
      function (done) {
        amiApiAdapter.triggerNewBuildByResourceId(w16dotnetcoreRunsh.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('53. w16dotnetcore-runsh build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(amiApiAdapter, w16dotnetcoreRunsh,
          'w16dotnetcore-runsh', successStatusCode, done);
      }
    );
  
    it('54. Owner can disable syncrepo',
      function (done) {
        var query = '';
        amiApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete sync repo id: %s, err: %s, %s',
                    syncRepoResource.id, err, response)
                )
              );

            global.removeTestResource(syncRepoResource.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('55. Owner can hard delete syncrepo',
      function (done) {
        var query = 'hard=true';
        amiApiAdapter.deleteResourceById(syncRepoResource.id, query,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot delete sync repo id: %s, err: %s, %s',
                    syncRepoResource.id, err, response)
                )
              );

            global.removeTestResource(syncRepoResource.test_resource_name,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('56. Disable all projects',
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
