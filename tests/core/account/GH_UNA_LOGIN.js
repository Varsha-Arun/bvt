'use strict';

var setupTests = require('../../../setupTests.js');
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
        setupTests().then(
          function () {
            ghSysIntId = global.stateFile.get('githubSystemIntegrationId') || [];

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
            ghAdapter = global.newApiAdapterByToken(body.apiToken);

            return done(err);
          }
        );
      }
    );

    after(
      function (done) {
        // save account id and apiToken
        global.saveTestResource('ghUnauthorizedAccount', account,
          function () {
            return done();
          }
        );
      }
    );
  }
);
