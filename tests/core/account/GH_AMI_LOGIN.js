//'use strict';
//
//var testSetup = require('../../../testSetup.js');
//var backoff = require('backoff');
//
//var testSuite = 'GH_AMI_LOGIN';
//var testSuiteDesc = 'Login workflow for Github AMI Tests';
//var test = util.format('%s - %s', testSuite, testSuiteDesc);
//
//describe(test,
//  function () {
//
//    var account = {};
//    var ghSysIntId = null;
//    var testOrgSubscription = null;
//    var collabSystemCode = null;
//    var adminSystemCode = null;
//    var ghAdapter = null;
//
//    this.timeout(0);
//
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
//
//            ghSysIntId = global.stateFile.get('ghSystemIntegration').id;
//
//            collabSystemCode = _.findWhere(global.systemCodes,
//              {name: 'collaborator', group: 'roles'}).code;
//            adminSystemCode = _.findWhere(global.systemCodes,
//              {name: 'admin', group: 'roles'}).code;
//
//            return done();
//          }
//        );
//      }
//    );
//
//    it('1. Login should generate API token',
//      function (done) {
//        var json = {
//          accessToken: global.githubAmiAccessToken
//        };
//        global.pubAdapter.postAuth(ghSysIntId, json,
//          function (err, body, res) {
//            assert.isNotEmpty(res, 'Result should not be empty');
//            assert.strictEqual(res.statusCode, 200, 'statusCode should be 200');
//            assert.isNotEmpty(body, 'body should not be null');
//            assert.isNotNull(body.apiToken, 'API token should not be null');
//            account = body.account;
//            account.apiToken = body.apiToken;
//            account.test_resource_type = 'account';
//            account.test_resource_name = 'ghAmiAccount';
//
//            ghAdapter = global.newApiAdapterByToken(body.apiToken);
//
//            global.saveTestResource(account.test_resource_name, account,
//              function () {
//                return done(err);
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('2. Login account should finish syncing in 1 minute',
//      function () {
//        var accountSynced = new Promise(
//          function (resolve, reject) {
//            var expBackoff = backoff.exponential({
//              initialDelay: 100, // ms
//              maxDelay: 5000 // max retry interval of 5 seconds
//            });
//            expBackoff.failAfter(12); // fail after 12 attempts
//            expBackoff.on('backoff',
//              function (number, delay) {
//                logger.debug('Account syncing. Retrying after ', delay, ' ms');
//              }
//            );
//
//            expBackoff.on('ready',
//              function () {
//                // set account when ready
//                ghAdapter.getAccounts('',
//                  function (err, accounts) {
//                    if (err)
//                      return reject(new Error('Failed to get account with err',
//                        err));
//                    var acc = _.first(accounts);
//                    if (acc.isSyncing !== false || !acc.lastSyncStartDate) {
//                      expBackoff.backoff();
//                    } else {
//                      expBackoff.reset();
//                      return resolve(acc);
//                    }
//                  }
//                );
//              }
//            );
//
//            // max number of backoffs reached
//            expBackoff.on('fail',
//              function () {
//                return reject(new Error('Max number of backoffs reached'));
//              }
//            );
//
//            expBackoff.backoff();
//          }
//        );
//        return accountSynced.then(
//          function (acc) {
//            assert.isNotEmpty(acc, 'account should not be empty');
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
