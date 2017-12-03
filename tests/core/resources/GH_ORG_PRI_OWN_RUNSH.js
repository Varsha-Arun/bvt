'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_PRI_OWN_RUNSH';
var testSuiteDesc = 'Github Organization owner private repo, runSh tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var ghAdapter = null;
    var subscriptionIntegration = {};
    var successStatusCode = null;
    var runShCode = null;
    var gitRepoCode = null;
    var testRunJob = {};
    var testRunParamJob = {};
    var testNoRunParamJob = {};
    var testRunSSH = {};
    var testCommitRun = {};
    var testOutRun = {};
    var testMemberRun = {};
    var testCollabRun = {};
    var indPubGitRepo = {};
    var indPubTagOnlyGitRepo = {};
    var indPubTagExceptGitRepo = {};
    var orgPROnlyPubGitRepo = {};
    var orgPRClosePubGitRepo = {};
    var testPR = {};

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

            ghAdapter =
              global.newGHAdapterByToken(global.githubOwnerAccessToken);

            successStatusCode = _.findWhere(global.systemCodes,
              {name: 'success', group: 'status'}).code;

            runShCode = _.findWhere(global.systemCodes,
              {name: 'runSh', group: 'resource'}).code;

            gitRepoCode = _.findWhere(global.systemCodes,
              {name: 'gitRepo', group: 'resource'}).code;

            var query = {name: global.GH_ORG_SUB_INT_GH};
            ownerApiAdapter.getSubscriptionIntegrations(query,
              function (err, si) {
                if (err)
                  return done(
                    new Error(
                      util.format('User cannot get subscriptionIntegration %s, ' +
                        'err: %s', global.GH_ORG_SUB_INT_GH, err)
                    )
                  );
                // check if build triggered in previous test case is present
                assert.isNotEmpty(si, 'Subscription Integration cannot be empty');

                subscriptionIntegration = _.first(si);
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Owner should be able to get test_run runSh job. This is the root ' +
      'trigger job to test other runSh cases',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_run',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testRunJob = response.resource;
            assert.isNotEmpty(testRunJob, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('2. Owner should be able to trigger test_run runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testRunJob.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('3. test_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testRunJob,
          'test_run', successStatusCode, done);
      }
    );

    it('4. Owner should be able to get test_param_run runSh job. This runs ' +
      'automatically when test_run finishes. It also tests whether params are ' +
      'set to ENV automatically',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_param_run',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testRunParamJob = response.resource;
            assert.isNotEmpty(testRunParamJob, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('5. test_param_run build was triggered automatically and was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testRunParamJob,
          'test_param_run', successStatusCode, done);
      }
    );

    it('6. Owner should be able to get test_param_norun runSh job. This job ' +
      'should not have triggered automatically due to switch:off tag. This also ' +
      'tests if state variable for gitRepo is set using ' +
      '---shipctl get_resource_state---. Also tests if list of params are set ' +
      'automatically',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_param_norun',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testNoRunParamJob = response.resource;
            assert.isNotEmpty(testNoRunParamJob, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('7. test_param_norun was not triggered automatically, since builds are ' +
      'empty',
      function (done) {
        var query = util.format('resourceIds=%s', testNoRunParamJob.id);
        ownerApiAdapter.getBuilds(query,
          function (err, builds) {
            if (err)
              return reject(
                new Error(
                  util.format('Failed to get builds for query %s with ' +
                    'err %s', util.inspect(query), util.inspect(err)
                  )
                )
              );

            assert.isEmpty(builds, 'Builds were not triggered automatically');
            return done();
          }
        );
      }
    );

    it('8. Owner should be able to trigger test_param_norun runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testNoRunParamJob.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('9. test_param_norun build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testNoRunParamJob,
          'test_param_norun', successStatusCode, done);
      }
    );

    it('10. Owner should be able to get test_ssh runSh job which uses ssh ' +
      'integration and pushes a commit to git repo which triggers a github ' +
      'commit webhook. This also tests --- shipctl get_resource_meta --- as ' +
      'version.json is needed to get the ssh key value of the integration.',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_ssh',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testRunSSH = response.resource;
            assert.isNotEmpty(testRunSSH, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('11. Owner should be able to trigger test_ssh runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testRunSSH.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('12. test_ssh build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testRunSSH,
          'test_ssh', successStatusCode, done);
      }
    );

    it('13. Owner should be able to get test_commit_run runSh job. This tests ' +
      'whether shippable is listening to commit webhooks and subsequently ' +
      'triggers a runSh build. This job when run also outputs key value state ' +
      'using --- shipctl post_resource_state --- & ' +
      '--- shipctl put_resource_state ---. This also tests replicate ' +
      'functionality for gitRepo',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_commit_run',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testCommitRun = response.resource;
            assert.isNotEmpty(testCommitRun, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('14. test_commit_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testCommitRun,
          'test_commit_run', successStatusCode, done);
      }
    );

    it('15. Owner should be able to get test_out_run runSh job. This job is ' +
      'automatically since the IN params resource was updated from upstream ' +
      'processing i.e. a new version for the param was created. If the ' +
      'upstream job did not output the version correctly, this fails',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'test_out_run',
          runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testOutRun = response.resource;
            assert.isNotEmpty(testOutRun, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('16. test_out_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testOutRun,
          'test_out_run', successStatusCode, done);
      }
    );

    it('17. Owner should be able to get ind_pub_replicate gitRepo resource.',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'ind_pub_replicate',
          gitRepoCode,
          function (response) {
            if (response.error)
              return done(response.error);

            indPubGitRepo = response.resource;
            assert.isNotEmpty(indPubGitRepo, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('18. test_commit_run from test 13 should have created a new version ' +
      'for ind_pub_replicate, i.e. 2 version records in total',
      function (done) {
        global.getVersionsByResourceId(ownerApiAdapter, indPubGitRepo.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');
            var size = response.versions.length;
            //TODO figure out how to do greater than in assert
            assert.notEqual(size, 0, 'Versions length cannot be 0');
            assert.notEqual(size, 1, 'Versions length cannot be 1');
            return done();
          }
        );
      }
    );

    it('19. Owner should be able to get ind_pub_tag_non_latest gitRepo resource.',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'ind_pub_tag_non_latest',
          gitRepoCode,
          function (response) {
            if (response.error)
              return done(response.error);

            indPubTagExceptGitRepo = response.resource;
            assert.isNotEmpty(indPubTagExceptGitRepo, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('20. test_ssh from test 10 should not have created a new version for ' +
      'ind_pub_tag_non_latest, as latest tag is in except list. i.e. 1 ' +
      'version record in total',
      function (done) {
        global.getVersionsByResourceId(ownerApiAdapter, indPubTagExceptGitRepo.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');
            var size = response.versions.length;
            //TODO figure out how to do greater than in assert
            assert.notEqual(size, 0, 'Versions length cannot be 0');
            assert.notEqual(size, 2, 'Versions length cannot be 2');
            return done();
          }
        );
      }
    );

    it('21. Owner should be able to get ind_pub_tag_only_latest gitRepo resource.',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'ind_pub_tag_only_latest',
          gitRepoCode,
          function (response) {
            if (response.error)
              return done(response.error);

            indPubTagOnlyGitRepo = response.resource;
            assert.isNotEmpty(indPubTagOnlyGitRepo, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('22. test_ssh from test 10 should have created a new version for ' +
      'ind_pub_tag_only_latest, as latest tag is in only list. i.e. 2 version ' +
      'records in total',
      function (done) {
        global.getVersionsByResourceId(ownerApiAdapter, indPubTagOnlyGitRepo.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');
            var size = response.versions.length;
            //TODO figure out how to do greater than in assert
            assert.notEqual(size, 0, 'Versions length cannot be 0');
            //assert.notEqual(size, 1, 'Versions length cannot be 1');
            return done();
          }
        );
      }
    );

    it('23. Owner should be able to get a PR to re-open on Github ',
      function (done) {
        var query = {state: 'all'};
        ghAdapter.getPullRequests(global.TEST_GH_PR_REPO, query,
          function (err, res) {
            testPR = _.findWhere(res, {"number": 1});
            assert.isNotEmpty(testPR, 'User cannot find PR to re-open');
            return done(err);
          }
        );
      }
    );

    it('24. Owner should be able to re-open the PR on Github',
      function (done) {
        async.series([
            _closePR.bind(null),
            _reOpenPR.bind(null)
          ],
          function (err) {
            return done(err);
          }
        );
      }
    );

    function _closePR(next) {
      if (testPR.state === 'closed') return next();
      _updatePR('closed',
        function (err) {
          if (err)
            return next(
              new Error(
                util.format('User cannot close PR: %s, err: %s', testPR.number,
                  err)
              )
            );
          assert.equal(testPR.state, 'closed', 'User is unable to close ' +
            'open PR');
          return next();
        }
      );
    }

    function _reOpenPR(next) {
      if (testPR.state != 'closed') return next();
      _updatePR('open',
        function (err) {
          if (err)
            return next(
              new Error(
                util.format('User cannot reopen PR: %s, err: %s', testPR.number,
                  err)
              )
            );
          assert.equal(testPR.state, 'open', 'User is unable to re-open ' +
            'closed PR');
          return next();
        }
      );
    }

    function _updatePR(status, callback) {
      ghAdapter.updatePullRequest(global.TEST_GH_PR_REPO, testPR.number, status,
        function (err, response) {
          if (err) return callback(err);
          testPR = response;
          return callback();
        }
      );
    }

    it('25. Owner should be able to get org_pub_pr_only gitRepo resource.',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'org_pub_pr_only',
          gitRepoCode,
          function (response) {
            if (response.error)
              return done(response.error);

            orgPROnlyPubGitRepo = response.resource;
            assert.isNotEmpty(orgPROnlyPubGitRepo, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('26. test 24 should have created a new version for org_pub_pr_only, ' +
      'it is turned on to process PR only. i.e. 2 version records in total',
      function (done) {
        global.getVersionsByResourceId(ownerApiAdapter, orgPROnlyPubGitRepo.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');
            var size = response.versions.length;
            //TODO figure out how to do greater than in assert
            assert.notEqual(size, 0, 'Versions length cannot be 0');
            assert.notEqual(size, 1, 'Versions length cannot be 1');
            return done();
          }
        );
      }
    );

    it('27. Owner should be able to get org_pub_pr_close gitRepo resource.',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter, 'org_pub_pr_close',
          gitRepoCode,
          function (response) {
            if (response.error)
              return done(response.error);

            orgPRClosePubGitRepo = response.resource;
            assert.isNotEmpty(orgPRClosePubGitRepo, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('28. test 24 should have created a new version for org_pub_pr_close, ' +
      'it is turned on to process PR only. i.e. 2 version records in total',
      function (done) {
        global.getVersionsByResourceId(ownerApiAdapter, orgPRClosePubGitRepo.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');
            var size = response.versions.length;
            //TODO figure out how to do greater than in assert
            assert.notEqual(size, 0, 'Versions length cannot be 0');
            assert.notEqual(size, 1, 'Versions length cannot be 1');
            return done();
          }
        );
      }
    );

    it('29. Collaborator should be able to get test_collab_run',
      function (done) {
        global.getResourceByNameAndTypeCode(collaboraterApiAdapter,
          'test_collab_run', runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testCollabRun = response.resource;
            assert.isNotEmpty(testCollabRun, 'User cannot find resource');
            return done();
          }
        );
      }
    );

    it('30. Collaborator should be able to trigger test_collab_run runSh job',
      function (done) {
        collaboraterApiAdapter.triggerNewBuildByResourceId(testCollabRun.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('31. Collaborator triggered test_collab_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(collaboraterApiAdapter, testCollabRun,
          'test_collab_run', successStatusCode, done);
      }
    );

    it('32. Collaborator should be able to get version for test_collab_run',
      function (done) {
        global.getVersionsByResourceId(collaboraterApiAdapter, testCollabRun.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');

            //TODO figure out how to do greater than in assert
            assert.notEqual(response.versions.length, 0, '' +
              'Versions length cannot be 0');
            return done();
          }
        );
      }
    );
    
    it('33. Member should not be able to trigger test_collab_run runSh job',
      function (done) {
        memberApiAdapter.triggerNewBuildByResourceId(testCollabRun.id, {},
          function (err) {
            if (err)
              return done();
            else
              return done(
                new Error(
                  util.format('Should not be able to trigger a build ',
                    util.inspect(err)
                  )
                )
              );
          }
        );
      }
    );

    it('34. Member should be able to get version for test_collab_run',
      function (done) {
        global.getVersionsByResourceId(memberApiAdapter, testCollabRun.id,
          function (response) {
            if (response.error)
              return done(response.error);

            assert.isNotEmpty(response.versions, 'User cannot find versions');
            //TODO figure out how to do greater than in assert
            assert.notEqual(response.versions.length, 0, '' +
              'Versions length cannot be 0');
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
