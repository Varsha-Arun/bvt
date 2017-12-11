'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_ACC_INT';
var testSuiteDesc = 'Github Organization account integration tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var ownerAccount = {};
    var accountIntegration = {};

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
            ownerAccount = global.stateFile.get('ghOwnerAccount');
            return done();
          }
        );
      }
    );

    it('1. Owner can create PEM Key Account Integration',
      function (done) {
        var body = {
          "name" : "ghOrgAccIntPemKey",
          "masterDisplayName": "PEM Key",
          "masterIntegrationId": "59d3692f0c3f421becfae3f0",
          "masterName": "pemKey",
          "masterType": "generic",
          "formJSONValues": [
              {
                "label": "key",
                "value": "pemkeyvalue"
              }
           ]
        };

        ownerApiAdapter.postAccountIntegration(body,
          function (err, acctInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Account Integration',
                    util.inspect(err))
                )
              );

            acctInt.test_resource_type = 'accountIntegration';
            acctInt.test_resource_name = acctInt.name;

            accountIntegration = acctInt;

            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('2. Owner can get PEM key Account Integration',
      function (done) {
        var query = 'names=ghOrgAccIntPemKey';
        ownerApiAdapter.getAccountIntegrations(query,
          function (err, acctInts) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get account integration for query %s',
                    query, err)
                )
              );
            accountIntegration = _.first(acctInts);
            assert.isNotEmpty(accountIntegration, 'Account Integration ' +
              'cannot be empty');
            return done();
          }
        );
      }
    );

    it('3. Owner can delete PEM Key Account Integration',
      function (done) {
        ownerApiAdapter.deleteAccountIntegrationById(
          accountIntegration.id,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User can delete accountIntegration ' +
                    'id: %s, err: %s, %s', accountIntegration.id, err,
                    response)
                )
              );
            global.removeTestResource(accountIntegration.test_resource_name,
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
