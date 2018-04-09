'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_ACC_INT';
var testSuiteDesc = 'Github Organization account integration tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var masterIntegrations = [];
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
            unauthorizedApiAdapter =
              global.newApiAdapterByStateAccount('ghUnauthorizedAccount');

            ownerApiAdapter.getMasterIntegrations('',
              function (err, masInts) {
                if (err)
                  return done(
                    new Error(
                      util.format('User cannot get master integration for query %s',
                        query, err)
                    )
                  );
                masterIntegrations = masInts;
                assert.isNotEmpty(masterIntegrations, 'Account Integration ' +
                  'cannot be empty');
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Owner can create PEM Key Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"pemKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name" : "ghOrgAccIntPemKey",
          "masterDisplayName": "PEM Key",
          "masterIntegrationId": masterInt.id,
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
            assert.isNotEmpty(acctInts, 'Account Integration ' +
              'cannot be empty');
            return done();
          }
        );
      }
    );

    it('3. Unauthorized cannot get the account integration',
      function (done) {
        unauthorizedApiAdapter.getAccountIntegrationById(accountIntegration.id,
          function (err, acctInts) {
            assert.strictEqual(err, 404,
              util.format('User cannot get account integration.' +
                ' err : %s %s', err, acctInts)
            );
            return done();
          }
        );
      }
    );

    it('4. Public User cannot get the account integration',
      function (done) {
        global.pubAdapter.getAccountIntegrationById(accountIntegration.id,
          function (err, acctInts) {
            assert.strictEqual(err, 401,
              util.format('User cannot get account integration.' +
                ' err : %s %s', err, acctInts)
            );
            return done();
          }
        );
      }
    );

    it('5. Owner can delete PEM Key Account Integration',
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

//    it('6. Owner can create AWS IAM Account Integration',
//      function (done) {
//        var masterInt = _.findWhere(masterIntegrations, {name:"amazonIamRole"}) || {};
//        assert.isNotEmpty(masterInt,
//          'Master integration cannot be empty.');
//        var body = {
//          "name": "ghOrgAccIntAwsIam",
//          "masterDisplayName": "AWS IAM",
//          "masterIntegrationId": masterInt.id,
//          "masterName": "amazonIamRole",
//          "masterType": "generic",
//          "formJSONValues": [
//             {
//                "label": "assumeRoleARN",
//                "value": "assumeRoleArnValue"
//             },
//             {
//                "label": "output",
//                "value": "text"
//             },
//             {
//                "label": "url",
//                "value": "https://api.example.com"
//             }
//          ]
//        };
//        ownerApiAdapter.postAccountIntegration(body,
//          function (err, acctInt) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User cannot create Account Integration',
//                    util.inspect(err))
//                )
//              );
//
//            acctInt.test_resource_type = 'accountIntegration';
//            acctInt.test_resource_name = acctInt.name;
//
//            accountIntegration = acctInt;
//            global.saveTestResource(acctInt.test_resource_name, acctInt,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('7. Owner can delete AWS IAM Account Integration',
//      function (done) {
//        ownerApiAdapter.deleteAccountIntegrationById(
//          accountIntegration.id,
//          function (err, response) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User can delete accountIntegration ' +
//                    'id: %s, err: %s, %s', accountIntegration.id, err,
//                    response)
//                )
//              );
//            global.removeTestResource(accountIntegration.test_resource_name,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );

    it('8. Owner can create AWS Keys Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"amazonKeys"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntAwsKeys",
          "masterDisplayName": "AWS Keys",
          "masterIntegrationId": masterInt.id,
          "masterName": "amazonKeys",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "accessKey",
                "value": "accessKeyValue"
            },
            {
                "label": "secretKey",
                "value": "secretKeyValue"
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

    it('9. Owner can delete AWS Keys Account Integration',
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

    it('10. Owner can create Azure DC/OS Keys Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"azureDcosKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntAzureDcosKeys",
          "masterDisplayName": "Azure DC/OS",
          "masterIntegrationId": masterInt.id,
          "masterName": "azureDcosKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "url",
                "value": "https://example.com"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('11. Owner can delete Azure DC/OS Keys Account Integration',
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

    it('12. Owner can create Azure Keys Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"azureKeys"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntAzureKeys",
          "masterDisplayName": "Azure Keys",
          "masterIntegrationId": masterInt.id,
          "masterName": "azureKeys",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "appId",
                "value": "appIdValue"
            },
            {
                "label": "password",
                "value": "passwordValue"
            },
            {
                "label": "tenant",
                "value": "tenantValue"
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

    it('13. Owner can delete Azure Keys Account Integration',
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

//    it('14. Owner can create Bitbucket Account Integration',
//      function (done) {
//        var masterInt = _.findWhere(masterIntegrations, {name:"bitbucket", type:"scm"}) || {};
//        assert.isNotEmpty(masterInt,
//          'Master integration cannot be empty.');
//        var body = {
//          "name": "ghOrgAccIntBitbucket",
//          "masterDisplayName": "BitBucket",
//          "masterIntegrationId": masterInt.id,
//          "masterName": "bitbucket",
//          "masterType": "scm",
//          "formJSONValues": [
//            {
//                "label": "token",
//                "value": "tokenValue"
//            },
//            {
//                "label": "url",
//                "value": "https://example.org"
//            }
//          ]
//        };
//        ownerApiAdapter.postAccountIntegration(body,
//          function (err, acctInt) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User cannot create Account Integration',
//                    util.inspect(err))
//                )
//              );
//
//            acctInt.test_resource_type = 'accountIntegration';
//            acctInt.test_resource_name = acctInt.name;
//
//            accountIntegration = acctInt;
//            global.saveTestResource(acctInt.test_resource_name, acctInt,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('15. Owner can delete Bitbucket Account Integration',
//      function (done) {
//        ownerApiAdapter.deleteAccountIntegrationById(
//          accountIntegration.id,
//          function (err, response) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User can delete accountIntegration ' +
//                    'id: %s, err: %s, %s', accountIntegration.id, err,
//                    response)
//                )
//              );
//            global.removeTestResource(accountIntegration.test_resource_name,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );

    it('16. Owner can create Digital Ocean Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"DOC"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
        "name": "ghOrgAccIntDigitalOcean",
        "masterDisplayName": "Digital Ocean",
        "masterIntegrationId": masterInt.id,
        "masterName": "DOC",
        "masterType": "generic",
        "formJSONValues": [
            {
                "label": "apiToken",
                "value": "apiTokenValue"
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

    it('17. Owner can delete Digital Ocean Account Integration',
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

    it('18. Owner can create Docker Cloud Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"dclKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntDockerCloud",
          "masterDisplayName": "Docker Cloud",
          "masterIntegrationId": masterInt.id,
          "masterName": "dclKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "token",
                "value": "tokenValue"
            },
            {
                "label": "url",
                "value": "https://cloud.example.com/"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('19. Owner can delete Docker Cloud Account Integration',
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

    it('20. Owner can create Docker DataCenter Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"ddcKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntDockerDataCenter",
          "masterDisplayName": "Docker DataCenter",
          "masterIntegrationId": masterInt.id,
          "masterName": "ddcKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "password",
                "value": "passwordValue"
            },
            {
                "label": "url",
                "value": "https://example.in"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('21. Owner can delete Docker DataCenter Account Integration',
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

    it('22. Owner can create Docker Registry Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"dockerRegistryLogin"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
        "name": "ghOrgAccIntDockerRegistry",
        "masterDisplayName": "Docker Registry",
        "masterIntegrationId": masterInt.id,
        "masterName": "dockerRegistryLogin",
        "masterType": "generic",
        "formJSONValues": [
            {
                "label": "email",
                "value": "email@email.com"
            },
            {
                "label": "password",
                "value": "passwordValue"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('23. Owner can delete Docker Registry Account Integration',
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

    it('24. Owner can create Git Credential Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"gitCredential"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
        "name": "ghOrgAccIntGitCredential",
        "masterDisplayName": "Git Credential",
        "masterIntegrationId": masterInt.id,
        "masterName": "gitCredential",
        "masterType": "generic",
        "formJSONValues": [
            {
                "label": "host",
                "value": "hostValue.com"
            },
            {
                "label": "password",
                "value": "passwordValue"
            },
            {
                "label": "port",
                "value": "portValue"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('25. Owner can delete Git Credential Account Integration',
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

    it('26. Owner can create Github Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"github", type: "scm"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
        "name": "ghOrgAccIntGithub",
        "masterDisplayName": "GitHub",
        "masterIntegrationId": masterInt.id,
        "masterName": "github",
        "masterType": "scm",
        "formJSONValues": [
            {
                "label": "token",
                "value": "tokenValue"
            },
            {
                "label": "url",
                "value": "https://example.com"
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

    it('27. Owner can delete Github Account Integration',
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

//    it('28. Owner can create Gitlab Account Integration',
//      function (done) {
//        var masterInt = _.findWhere(masterIntegrations, {name:"gitlab"}) || {};
//        assert.isNotEmpty(masterInt,
//          'Master integration cannot be empty.');
//        var body = {
//        "name": "ghOrgAccIntGitlab",
//        "masterDisplayName": "GitLab",
//        "masterIntegrationId": masterInt.id,
//        "masterName": "gitlab",
//        "masterType": "scm",
//        "formJSONValues": [
//            {
//                "label": "token",
//                "value": "tokenValue"
//            },
//            {
//                "label": "url",
//                "value": "https://example.com"
//            }
//          ]
//        };
//        ownerApiAdapter.postAccountIntegration(body,
//          function (err, acctInt) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User cannot create Account Integration',
//                    util.inspect(err))
//                )
//              );
//
//            acctInt.test_resource_type = 'accountIntegration';
//            acctInt.test_resource_name = acctInt.name;
//
//            accountIntegration = acctInt;
//            global.saveTestResource(acctInt.test_resource_name, acctInt,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('29. Owner can delete Gitlab Account Integration',
//      function (done) {
//        ownerApiAdapter.deleteAccountIntegrationById(
//          accountIntegration.id,
//          function (err, response) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User can delete accountIntegration ' +
//                    'id: %s, err: %s, %s', accountIntegration.id, err,
//                    response)
//                )
//              );
//            global.removeTestResource(accountIntegration.test_resource_name,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('30. Owner can create Github Enterprise Account Integration',
//      function (done) {
//        var masterInt = _.findWhere(masterIntegrations, {name:"githubEnterprise"}) || {};
//        assert.isNotEmpty(masterInt,
//          'Master integration cannot be empty.');
//        var body = {
//          "name": "ghOrgAccIntGithubEnterprise",
//          "masterDisplayName": "Github Enterprise",
//          "masterIntegrationId": masterInt.id,
//          "masterName": "githubEnterprise",
//          "masterType": "scm",
//          "formJSONValues": [
//            {
//                "label": "token",
//                "value": "tokenValue"
//            },
//            {
//                "label": "url",
//                "value": "https://example.com/api/v4"
//            }
//          ]
//        };
//        ownerApiAdapter.postAccountIntegration(body,
//          function (err, acctInt) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User cannot create Account Integration',
//                    util.inspect(err))
//                )
//              );
//
//            acctInt.test_resource_type = 'accountIntegration';
//            acctInt.test_resource_name = acctInt.name;
//
//            accountIntegration = acctInt;
//            global.saveTestResource(acctInt.test_resource_name, acctInt,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
//
//    it('31. Owner can delete Github Enterprise Account Integration',
//      function (done) {
//        ownerApiAdapter.deleteAccountIntegrationById(
//          accountIntegration.id,
//          function (err, response) {
//            if (err)
//              return done(
//                new Error(
//                  util.format('User can delete accountIntegration ' +
//                    'id: %s, err: %s, %s', accountIntegration.id, err,
//                    response)
//                )
//              );
//            global.removeTestResource(accountIntegration.test_resource_name,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );

    it('32. Owner can create Google Cloud Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"gcloudKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntGoogleCloud",
          "masterDisplayName": "Google Cloud",
          "masterIntegrationId": masterInt.id,
          "masterName": "gcloudKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "JSON_key",
                "value": "jsonKeyValue"
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

    it('33. Owner can delete Google Cloud Account Integration',
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

    it('34. Owner can create HipChat Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"hipchatKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntHipchat",
          "masterDisplayName": "HipChat",
          "masterIntegrationId": masterInt.id,
          "masterName": "hipchatKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "token",
                "value": "tokenValue"
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

    it('35. Owner can delete HipChat Account Integration',
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

    it('36. Owner can create JFrog Artifactory Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"artifactoryKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntJfrogArtifactory",
          "masterDisplayName": "JFrog Artifactory",
          "masterIntegrationId": masterInt.id,
          "masterName": "artifactoryKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "password",
                "value": "passwordValue"
            },
            {
                "label": "url",
                "value": "https://example.io/usernameValue"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('37. Owner can delete JFrog Artifactory Account Integration',
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

    it('38. Owner can create Joyent Triton Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"joyentTritonKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntJoyentTriton",
          "masterDisplayName": "Joyent Triton",
          "masterIntegrationId": masterInt.id,
          "masterName": "joyentTritonKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "url",
                "value": "https://api.example.com"
            },
            {
                "label": "username",
                "value": "usernameValue"
            },
            {
                "label": "validityPeriod",
                "value": "1"
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

    it('39. Owner can delete Joyent Triton Account Integration',
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

    it('40. Owner can create Key-Value pair Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"keyValuePair"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntKeyValuePair",
          "masterDisplayName": "Key-Value pair",
          "masterIntegrationId": masterInt.id,
          "masterName": "keyValuePair",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "envs",
                "value": {
                    "key1": "value1"
                }
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

    it('41. Owner can delete Key-Value pair Account Integration',
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

    it('42. Owner can create Kubernetes Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"kubernetesConfig"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntKubernetes",
          "masterDisplayName": "Kubernetes",
          "masterIntegrationId": masterInt.id,
          "masterName": "kubernetesConfig",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "kubeConfigContent",
                "value": "kubeConfigContentValue"
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

    it('43. Owner can delete Kubernetes Account Integration',
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

    it('44. Owner can create Node Cluster Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"nodeCluster"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntNodeCluster",
          "masterDisplayName": "Node Cluster",
          "masterIntegrationId": masterInt.id,
          "masterName": "nodeCluster",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "nodes",
                "value": [
                    {
                        "name": "0.0.0.0"
                    }
                ]
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

    it('45. Owner can delete Node Cluster Account Integration',
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

    it('46. Owner can create Quay.io Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"quayLogin"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntQuay",
          "masterDisplayName": "Quay.io",
          "masterIntegrationId": masterInt.id,
          "masterName": "quayLogin",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "accessToken",
                "value": "accessTokenValue"
            },
            {
                "label": "email",
                "value": "email@email.com"
            },
            {
                "label": "password",
                "value": "passwordvalue"
            },
            {
                "label": "url",
                "value": "example.io"
            },
            {
                "label": "username",
                "value": "usernameValue"
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

    it('47. Owner can delete Quay.io Account Integration',
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

    it('48. Owner can create SSH Key Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"sshKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntSshKey",
          "masterDisplayName": "SSH Key",
          "masterIntegrationId": masterInt.id,
          "masterName": "sshKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "privateKey",
                "value": "privateKeyValue"
            },
            {
                "label": "publicKey",
                "value": "publicKeyValue"
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

    it('49. Owner can delete SSH Key Account Integration',
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

    it('50. Owner can create Slack Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"slackKey"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntSlack",
          "masterDisplayName": "Slack",
          "masterIntegrationId": masterInt.id,
          "masterName": "slackKey",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "webhookUrl",
                "value": "https://EXAMPLE.com"
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

    it('51. Owner can delete Slack Account Integration',
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

    it('52. Owner can create Webhook Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"webhookV2"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntWebhook",
          "masterDisplayName": "Webhook",
          "masterIntegrationId": masterInt.id,
          "masterName": "webhookV2",
          "masterType": "generic",
          "formJSONValues": [
            {
                "label": "authorization",
                "value": "tokenValue"
            },
            {
                "label": "webhookURL",
                "value": "https://example.com"
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

    it('53. Owner can delete Webhook Account Integration',
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
