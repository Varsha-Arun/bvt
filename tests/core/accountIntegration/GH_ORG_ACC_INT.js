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
    var dockerRegistryAccountIntegration = null;
    var testaccIntegrationRun = {};
    var runShCode = null;
    var syncRepo = {};
    var subscriptionIntegration = {};
    var subscriptionIntegrationIds = [];
    var accountIntegrationIds = [];
    var ghSubscriptionIntegration = {};
    var subscription = {};
    var syncRepoResource = {};
    var rSyncJob = {};
    var successStatusCode = null;
    var rSyncCode = null;
    var syncRepoCode = null;
    var awsKeysAccountIntegration = null;
    var dockerRegistryAccountIntegration = null;
    var gclAccountIntegration = null;
    var gitlabAccountIntegration = null;
    var jfrogAccountIntegration = null;
    var joyentTritonAccountIntegration = null;
    var kubernetesAccountIntegration = null;
    var quayAccountIntegration = null;
    var awsIamAccountIntegration = null;
    var azureDcOsAccountIntegration = null;
    var azureKeysAccountIntegration = null; 
    var bitbucketAccountIntegration = null; 
    var digitalOceanAccountIntegration = null;
    var dockerCloudAccountIntegration = null;
    var dockerDataCenterAccountIntegration = null;
    var githubAccountIntegration = null;
    var githubEnterpriseAccountIntegration = null; 
    var gitCredentialAccountIntegration = null;
    var googleCloudAccountIntegration = null;
    var hipChatAccountIntegration = null;
    var jFrogArtifactoryAccountIntegration = null;
    var keyValuePairAccountIntegration = null;
    var kubernetesAccountIntegration = null;
    var nodeClusterAccountIntegration = null;
    var quayLoginAccountIntegration = null;
    var sshKeyAccountIntegration = null;
    var slackAccountIntegration = null;
    var webhookAccountIntegration = null;
  
    var azureKeysAccountIntegration = null;
    var bitbucketAccountIntegration = null;
    var awsKeysSubscriptionIntegration = null;
    var dockerRegistrySubscriptionIntegration = null;
    var googleCloudSubscriptionIntegration = null;
    var jfrogSubscriptionIntegration = null;
    var kubernetesSubscriptionIntegration = null;
    var quaySubscriptionIntegration = null;
    
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
            
            successStatusCode = _.findWhere(global.systemCodes,
              {name: 'success', group: 'status'}).code;
            
            runShCode = _.findWhere(global.systemCodes,
              {name: 'runSh', group: 'resource'}).code;
            rSyncCode = _.findWhere(global.systemCodes,
              {name: 'rSync', group: 'resource'}).code;
            syncRepoCode = _.findWhere(global.systemCodes,
              {name: 'syncRepo', group: 'resource'}).code;
            
            ownerApiAdapter.getProjects('',
              function (err, prjs) {
                if (err || _.isEmpty(prjs))
                  return done(new Error('Project list is empty', err));
                syncRepo = _.first(
                  _.where(prjs, {isOrg: true, isPrivateRepository: false}
                  )
                );

                assert.isNotEmpty(syncRepo, 'User cannot find the rSync repo');
              }
            );
            
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
    
    it('1. Owner can get the subscriptionIntegration',
      function (done) {
        ownerApiAdapter.getSubscriptionIntegrations('',
          function (err, sis) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get subscriptionIntegrations', err)
                )
              );
            // check if build triggered in previous test case is present
            assert.isNotEmpty(sis, 'Subscription Integration cannot be empty');

            ghSubscriptionIntegration =
              _.findWhere(sis,{name: global.GH_ORG_SUB_INT_GH});
            return done();
          }
        );
      }
    );

    it('2. Owner can create AWS Keys Account Integration',
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

            awsKeysAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('3. Owner can create Docker Registry Account Integration',
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
                "value": "shiptest@shippable.com"
            },
            {
                "label": "password",
                "value": "Qhode123"
            },
            {
                "label": "username",
                "value": "shippabledocker"
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

            dockerRegistryAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    ); 
  
    it('4. Owner can create Google Cloud Account Integration',
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

            googleCloudAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
    
    it('5. Owner can create JFrog Artifactory Account Integration',
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

            jFrogArtifactoryAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
    
    it('6. Owner can create Kubernetes Account Integration',
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

            kubernetesAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
       
    it('7. Owner can create Quay.io Account Integration',
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
                "value": "revathi@shippale.com"
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

            quayLoginAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
       
    it('8. Owner can create AWS IAM Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"amazonIamRole"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntAwsIam",
          "masterDisplayName": "AWS IAM",
          "masterIntegrationId": masterInt.id,
          "masterName": "amazonIamRole",
          "masterType": "generic",
          "formJSONValues": [
             {
                "label": "assumeRoleARN",
                "value": "assumeRoleArnValue"
             },
             {
                "label": "output",
                "value": "text"
             },
             {
                "label": "url",
                "value": "https://api.example.com"
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

            awsIamAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
   
    it('9. Owner can create Azure DC/OS Keys Account Integration',
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

            azureDcOsAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
    
    it('10. Owner can create Azure Keys Account Integration',
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

            azureKeysAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('11. Owner can create Bitbucket Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"bitbucket", type:"scm"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
          "name": "ghOrgAccIntBitbucket",
          "masterDisplayName": "BitBucket",
          "masterIntegrationId": masterInt.id,
          "masterName": "bitbucket",
          "masterType": "scm",
          "formJSONValues": [
            {
                "label": "token",
                "value": "tokenValue"
            },
            {
                "label": "url",
                "value": "https://example.org"
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

            bitbucketAccountIntegration = acctInt;

            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
    
    it('12. Owner can create Digital Ocean Account Integration',
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

            digitalOceanAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('13. Owner can create Docker Cloud Account Integration',
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

            dockerCloudAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('14. Owner can create Docker DataCenter Account Integration',
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

            dockerDataCenterAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('15. Owner can create Github Account Integration',
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

            githubAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
//    it('16. Owner can create Github Enterprise Account Integration',
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
//            githubEnterpriseAccountIntegration = acctInt;
//            global.saveTestResource(acctInt.test_resource_name, acctInt,
//              function () {
//                return done();
//              }
//            );
//          }
//        );
//      }
//    );
  
    it('17. Owner can create Git Credential Account Integration',
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

            gitCredentialAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('18. Owner can create Gitlab Account Integration',
      function (done) {
        var masterInt = _.findWhere(masterIntegrations, {name:"gitlab"}) || {};
        assert.isNotEmpty(masterInt,
          'Master integration cannot be empty.');
        var body = {
        "name": "ghOrgAccIntGitlab",
        "masterDisplayName": "GitLab",
        "masterIntegrationId": masterInt.id,
        "masterName": "gitlab",
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

            gitlabAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('19. Owner can create HipChat Account Integration',
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

            hipChatAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('20. Owner can create Joyent Triton Account Integration',
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

            joyentTritonAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('21. Owner can create Key-Value pair Account Integration',
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

            keyValuePairAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('22. Owner can create Node Cluster Account Integration',
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

            nodeClusterAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('23. Owner can create SSH Key Account Integration',
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

            sshKeyAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('24. Owner can create Slack Account Integration',
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

            slackAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('25. Owner can create Webhook Account Integration',
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

            webhookAccountIntegration = acctInt;
            global.saveTestResource(acctInt.test_resource_name, acctInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('26. Owner can add aws keys Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: awsKeysAccountIntegration.id,
          subscriptionId: syncRepo.subscriptionId,
          name: 'ghOrgAccIntAwsKeys'
        };

        ownerApiAdapter.postSubscriptionIntegration(body,
          function (err, subInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Subscription Integration',
                    util.inspect(err))
                )
              );

            subInt.test_resource_type = 'subscriptionIntegration';
            subInt.test_resource_name = subInt.name;

            awsKeysSubscriptionIntegration = subInt;
            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('27. Owner can add Docker Registry Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: dockerRegistryAccountIntegration.id,
          subscriptionId: syncRepo.subscriptionId,
          name: 'ghOrgAccIntDockerRegistry'
        };

        ownerApiAdapter.postSubscriptionIntegration(body,
          function (err, subInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Subscription Integration',
                    util.inspect(err))
                )
              );

            subInt.test_resource_type = 'subscriptionIntegration';
            subInt.test_resource_name = subInt.name;

            dockerRegistrySubscriptionIntegration = subInt;
            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('28. Owner can add Google Cloud Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: googleCloudAccountIntegration.id,
          subscriptionId: syncRepo.subscriptionId,
          name: 'ghOrgAccIntGoogleCloud'
        };

        ownerApiAdapter.postSubscriptionIntegration(body,
          function (err, subInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Subscription Integration',
                    util.inspect(err))
                )
              );

            subInt.test_resource_type = 'subscriptionIntegration';
            subInt.test_resource_name = subInt.name;

            googleCloudSubscriptionIntegration = subInt;
            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('29. Owner can add jfrog Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: jFrogArtifactoryAccountIntegration.id,
          subscriptionId: syncRepo.subscriptionId,
          name: 'ghOrgAccIntJfrogArtifactory'
        };

        ownerApiAdapter.postSubscriptionIntegration(body,
          function (err, subInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Subscription Integration',
                    util.inspect(err))
                )
              );

            subInt.test_resource_type = 'subscriptionIntegration';
            subInt.test_resource_name = subInt.name;

            jfrogSubscriptionIntegration = subInt;
            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('30. Owner can add kubernetes Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: kubernetesAccountIntegration.id,
          subscriptionId: syncRepo.subscriptionId,
          name: 'ghOrgAccIntKubernetes'
        };

        ownerApiAdapter.postSubscriptionIntegration(body,
          function (err, subInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Subscription Integration',
                    util.inspect(err))
                )
              );

            subInt.test_resource_type = 'subscriptionIntegration';
            subInt.test_resource_name = subInt.name;

            kubernetesSubscriptionIntegration = subInt;
            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('31. Owner can add quay Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: quayLoginAccountIntegration.id,
          subscriptionId: syncRepo.subscriptionId,
          name: 'ghOrgAccIntQuay'
        };

        ownerApiAdapter.postSubscriptionIntegration(body,
          function (err, subInt) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot create Subscription Integration',
                    util.inspect(err))
                )
              );

            subInt.test_resource_type = 'subscriptionIntegration';
            subInt.test_resource_name = subInt.name;

            quaySubscriptionIntegration = subInt;
            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );
  
    it('32. Owner can add a sync repo',
      function (done) {
        var body = {
          resourceName: syncRepo.name + '_master',
          projectId: syncRepo.id,
          subscriptionId: syncRepo.subscriptionId,
          branch: 'master',
          subscriptionIntegrationId: ghSubscriptionIntegration.id
        };

        //TODO: response for this call is blank and pointless. we should return
        //TODO: the object
        ownerApiAdapter.postNewSyncRepo(body,
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

    it('33. Owner should be able to get sync Repo objects created',
      function (done) {
        ownerApiAdapter.getResources('',
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

    it('34. Owner added syncRepo build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, rSyncJob,
          'rSyncJob', successStatusCode, done);
      }
    );
  
    it('35. Owner should be able to get test_accIntegration_run',
      function (done) {
        global.getResourceByNameAndTypeCode(ownerApiAdapter,
          'test_accIntegration_run', runShCode,
          function (response) {
            if (response.error)
              return done(response.error);

            testaccIntegrationRun = response.resource;
            assert.isNotEmpty(testaccIntegrationRun, 'User cannot find resource');
            return done();
          }
        );
      }
    );
  
    it('36. Owner should be able to trigger test_accIntegration_run runSh job',
      function (done) {
        ownerApiAdapter.triggerNewBuildByResourceId(testaccIntegrationRun.id, {},
          function (err) {
            return done(err);
          }
        );
      }
    );

    it('37. Owner triggered test_accIntegration_run build was successful',
      function (done) {
        global.getBuildStatusWithBackOff(ownerApiAdapter, testaccIntegrationRun,
          'test_accIntegration_run', successStatusCode, done);
      }
    );
  
    it('38. Delete all account integrations',
      function (done) {
        accountIntegrationIds = [dockerRegistryAccountIntegration.id, awsKeysAccountIntegration.id, azureKeysAccountIntegration.id, bitbucketAccountIntegration.id, googleCloudAccountIntegration.id, awsIamAccountIntegration.id, jFrogArtifactoryAccountIntegration.id, kubernetesAccountIntegration.id, quayLoginAccountIntegration.id, azureDcOsAccountIntegration.id, digitalOceanAccountIntegration.id, dockerCloudAccountIntegration.id, dockerDataCenterAccountIntegration.id, githubAccountIntegration.id, gitCredentialAccountIntegration.id, gitlabAccountIntegration.id, hipChatAccountIntegration.id, joyentTritonAccountIntegration.id, keyValuePairAccountIntegration.id, nodeClusterAccountIntegration.id, sshKeyAccountIntegration.id, slackAccountIntegration.id, webhookAccountIntegration.id];
        async.each(accountIntegrationIds,
          function (accIntId, nextAccIntId) {
            ownerApiAdapter.deleteAccountIntegrationById(accIntId,
              function (err, response) {
                if (err)
                  return nextAccIntId(
                    new Error(
                      util.format('User cannot delete accountIntegration ' +
                        'id: %s, err: %s, %s', accIntId, err,
                        response)
                      )
                    );
                return nextAccIntId();
              }
            );
          },
          function (err) {
            return done(err);
          }
        )
      }
    );
  
    it('39. Owner can disable syncrepo',
      function (done) {
        var query = '';
        ownerApiAdapter.deleteResourceById(syncRepoResource.id, query,
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

    it('40. Owner can hard delete syncrepo',
      function (done) {
        var query = 'hard=true';
        ownerApiAdapter.deleteResourceById(syncRepoResource.id, query,
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
  
    it('41. Delete all subscription integrations',
      function (done) {
        subscriptionIntegrationIds = [dockerRegistrySubscriptionIntegration.id, awsKeysSubscriptionIntegration.id, googleCloudSubscriptionIntegration.id, jfrogSubscriptionIntegration.id, kubernetesSubscriptionIntegration.id, quaySubscriptionIntegration.id];
        async.each(subscriptionIntegrationIds,
          function (subIntId, nextSubIntId) {
            ownerApiAdapter.deleteSubscriptionIntegrationById(subIntId,
              function (err, response) {
                if (err)
                  return nextSubIntId(
                    new Error(
                      util.format('User can delete subscriptionIntegration ' +
                        'id: %s, err: %s, %s', subIntId, err,
                        response)
                      )
                    );
                  return nextSubIntId();
                }
              );
            },
            function (err) {
              return done(err);
            }
        )
      }
    );
 
    after(
      function (done) {
        return done();
      }
    );
  }
);
