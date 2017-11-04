'use strict';

var setupTests = require('../../../setupTests.js');
var backoff = require('backoff');

var testSuite = 'GH_MEM_LOGIN';
var testSuiteDesc = 'Login workflow for Github Member';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var account = {};
    var ghSysIntId = null;
    var testOrgSubscription = null;
    var collabSystemCode = null;
    var adminSystemCode = null;
    var ghAdapter = null;
    
    this.timeout(0);

    before(
      function (done) {
        setupTests().then(
          function () {
            ghSysIntId = global.stateFile.get('githubSystemIntegrationId') || [];
            collabSystemCode = _.findWhere(global.systemCodes,
              {name: 'collaborator', group: 'roles'}).code;
            adminSystemCode = _.findWhere(global.systemCodes,
              {name: 'admin', group: 'roles'}).code;
            return done();
          },
          function (err) {
            logger.error(testSuite, 'failed to setup tests. err:', err);
            return done(err);
          }
        );
      }
    );

    it('1. Login should generate API token',
      function (done) {
        var json = {
          accessToken: global.githubMemberAccessToken
        };
        global.pubAdapter.postAuth(ghSysIntId, json,
          function (err, body, res) {
            assert.isNotEmpty(res, 'Result should not be empty');
            assert.strictEqual(res.statusCode, 200, 'statusCode should be 200');
            assert.isNotEmpty(body, 'body should not be null');
            assert.isNotNull(body.apiToken, 'API token should not be null');
            account = body.account;
            account.apiToken = body.apiToken;
            ghAdapter = global.newApiAdapterByToken(body.apiToken);

            return done(err);
          }
        );
      }
    );

    it('2. Login account should finish syncing in 1 minute',
      function () {
        var accountSynced = new Promise(
          function (resolve, reject) {
            var expBackoff = backoff.exponential({
              initialDelay: 100, // ms
              maxDelay: 5000 // max retry interval of 5 seconds
            });
            expBackoff.failAfter(12); // fail after 12 attempts
            expBackoff.on('backoff',
              function (number, delay) {
                logger.debug('Account syncing. Retrying after ', delay, ' ms');
              }
            );

            expBackoff.on('ready',
              function () {
                // set account when ready
                ghAdapter.getAccounts('',
                  function (err, accounts) {
                    if (err)
                      return reject(new Error('Failed to get account with err',
                        err));
                    var acc = _.first(accounts);
                    if (acc.isSyncing !== false || !acc.lastSyncStartDate) {
                      expBackoff.backoff();
                    } else {
                      expBackoff.reset();
                      return resolve(acc);
                    }
                  }
                );
              }
            );

            // max number of backoffs reached
            expBackoff.on('fail',
              function () {
                return reject(new Error('Max number of backoffs reached'));
              }
            );

            expBackoff.backoff();
          }
        );
        return accountSynced.then(
          function (acc) {
            assert.isNotEmpty(acc, 'account should not be empty');
          }
        );
      }
    );

    it('3. Check Project permissions (private, public, forks, orgs, ind',
      function () {
        var getProjects = new Promise(
          function (resolve, reject) {
            ghAdapter.getProjects('',
              function (err, projects) {
                if (err)
                  return reject(new Error('Unable to get projects with error',
                    err));
                return resolve(projects);
              }
            );
          }
        );
        return getProjects.then(
          function (projects) {
            assert.isNotEmpty(projects, 'Projects should not be empty');

            assert.equal(projects.length,
              global.MEM_GH_PROJECT_COUNT, 'Project count needs to match');

            assert.equal(_.where(projects,{isOrg:true}).length,
              global.MEM_GH_ORG_PROJECT_COUNT, 'Org Project count needs to match');

            assert.equal(_.where(projects,{isFork:true}).length,
              global.MEM_GH_FORK_PROJECT_COUNT, 'Fork Project count needs to match');

            assert.equal(_.where(projects,{isOrg:false}).length,
              global.MEM_GH_IND_PROJECT_COUNT, 'Ind Project count needs to match');

            assert.equal(_.where(projects,{isPrivateRepository:true}).length,
              global.MEM_GH_PRIV_PROJECT_COUNT, 'Private Project count needs to match');
          }
        );
      }
    );

    it('4. Check Subscription permissions (ind,Org)',
      function () {
        var getSubs = new Promise(
          function (resolve, reject) {
            ghAdapter.getSubscriptions('',
              function (err, subs) {
                if (err)
                  return reject(new Error('Unable to get subs with error',
                    err));
                return resolve(subs);
              }
            );
          }
        );
        return getSubs.then(
          function (subs) {
            assert.isNotEmpty(subs, 'Subscriptions should not be empty');

            assert.equal(subs.length,
              global.MEM_GH_SUB_COUNT, 'Subscription count needs to match');

            assert.equal(_.where(subs,{isOrgSubscription:true}).length,
              global.MEM_GH_ORG_SUB_COUNT, 'Org Subscription count needs to match');

            assert.equal(_.where(subs,{isOrgSubscription:false}).length,
              global.MEM_GH_IND_SUB_COUNT, 'Ind Subscription count needs to match');

            testOrgSubscription =
              _.findWhere(subs, {orgName: global.TEST_GH_ORGNAME});

            assert.isNotEmpty(testOrgSubscription,
              'Test Org subscription should not be empty');
          }
        );
      }
    );

    it('5. Check if the user is only a member of TEST_ORG',
      function (done) {

        var query = util.format('subscriptionIds=%s', testOrgSubscription.id);

        ghAdapter.getSubscriptionAccounts(query,
          function (err, subAccounts) {

            assert(!err, util.format('Unable to get subAccounts with error %s',
              err));

            assert.isNotEmpty(subAccounts,
              'SubscriptionAccounts should not be empty');

            // assert.isEmpty(_.where(subAccounts, {roleCode: collabSystemCode}),
            //   'Member of the org is missing collaborator role');

            assert.isEmpty(_.where(subAccounts, {roleCode: adminSystemCode}),
              'Member of the org is  having admin role');

            return done();
          }
        );
      }
    );
    
    after(
      function (done) {
        // save account id and apiToken
        global.saveTestResource('ghMemberAccount', account,
          function () {
            return done();
          }
        );
      }
    );
  }
);
