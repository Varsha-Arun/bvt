'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_OWN_LOGIN';
var testSuiteDesc = 'Login workflow for Github Owner Tests';
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
        async.series(
          [
            testSetup.bind(null)
          ],
          function (err) {
            if (err) {
              logger.error(test, 'Failed to setup tests. err:', err);
              return done(err);
            }

            ghSysIntId = global.stateFile.get('ghSystemIntegration').id;
            collabSystemCode = _.findWhere(global.systemCodes,
              {name: 'collaborator', group: 'roles'}).code;
            adminSystemCode = _.findWhere(global.systemCodes,
              {name: 'admin', group: 'roles'}).code;
            
            return done();
          }
        );
      }
    );

    it('1. Login should generate API token',
      function (done) {
        var json = {
          accessToken: global.githubOwnerAccessToken
        };
        global.pubAdapter.postAuth(ghSysIntId, json,
          function (err, body, res) {
            assert.isNotEmpty(res, 'Result should not be empty');
            assert.strictEqual(res.statusCode, 200, 'statusCode should be 200');
            assert.isNotEmpty(body, 'body should not be null');
            assert.isNotNull(body.apiToken, 'API token should not be null');

            account = body.account;
            account.apiToken = body.apiToken;
            account.test_resource_type = 'account';
            account.test_resource_name = 'ghOwnerAccount';

            ghAdapter = global.newApiAdapterByToken(body.apiToken);

            global.saveTestResource(account.test_resource_name, account,
              function () {
                return done(err);
              }
            );
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
              global.ADM_GH_PROJECT_COUNT, 'Project count needs to match');

            assert.equal(_.where(projects, {isOrg: true}).length,
              global.ADM_GH_ORG_PROJECT_COUNT, 'Org Project count needs to match');

            assert.equal(_.where(projects, {isFork: true}).length,
              global.ADM_GH_FORK_PROJECT_COUNT, 'Fork Project count needs to match');

            assert.equal(_.where(projects, {isOrg: false}).length,
              global.ADM_GH_IND_PROJECT_COUNT, 'Ind Project count needs to match');

            assert.equal(_.where(projects, {isPrivateRepository: true}).length,
              global.ADM_GH_PRIV_PROJECT_COUNT, 'Private Project count needs to match');
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
              global.ADM_GH_SUB_COUNT, 'Subscription count needs to match');

            assert.equal(_.where(subs, {isOrgSubscription: true}).length,
              global.ADM_GH_ORG_SUB_COUNT, 'Org Subscription count needs to match');

            assert.equal(_.where(subs, {isOrgSubscription: false}).length,
              global.ADM_GH_IND_SUB_COUNT, 'Ind Subscription count needs to match');

            testOrgSubscription =
              _.findWhere(subs, {orgName: global.TEST_GH_ORGNAME});

            assert.isNotEmpty(testOrgSubscription,
              'Test Org subscription should not be empty');
          }
        );
      }
    );

    it('5. Check if the user is owner of TEST_ORG',
      function (done) {

        var query = util.format('subscriptionIds=%s', testOrgSubscription.id);

        ghAdapter.getSubscriptionAccounts(query,
          function (err, subAccounts) {

            assert(!err, util.format('Unable to get subAccounts with error %s',
              err));

            assert.isNotEmpty(subAccounts,
              'SubscriptionAccounts should not be empty');

            assert.isNotEmpty(_.where(subAccounts, {roleCode: collabSystemCode}),
              'Admin of an org is missing collaborator role');

            assert.isNotEmpty(_.where(subAccounts, {roleCode: adminSystemCode}),
              'Admin of an org is not having admin role');

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
