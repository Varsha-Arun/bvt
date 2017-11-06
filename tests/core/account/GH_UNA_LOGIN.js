'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_UNA_LOGIN';
var testSuiteDesc = 'Login workflow for Github Unauthorized user (drship)';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var account = {};
    var ghSysIntId = null;
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
            return done();
          }
        );
      }
    );

    it('1. Login should generate API token',
      function (done) {
        var json = {
          accessToken: global.githubUnauthorizedAccessToken
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
            account.test_resource_name = 'ghUnauthorizedAccount';

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

    after(
      function (done) {
        return done()
      }
    );
  }
);
