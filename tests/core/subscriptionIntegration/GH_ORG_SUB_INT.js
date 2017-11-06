'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'GH_ORG_SUB_INT';
var testSuiteDesc = 'Github Organization subscription integration tests';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var subscription = {};
    var ownerAccount = {};
    var githubAccountIntegration = {};
    var subscriptionIntegration = {};

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

            ownerApiAdapter.getSubscriptions('',
              function (err, subs) {
                if (err || _.isEmpty(subs))
                  return done(new Error('Subscriptions list is empty', err));

                subscription = _.first(_.where(subs, {isOrgSubscription: true}));

                assert.isNotEmpty(subscription, 'User cannot find the subscription');
                return done();
              }
            );
          }
        );
      }
    );

    it('1. Get Github Account Integration',
      function (done) {
        var query = 'names=github';
        ownerApiAdapter.getAccountIntegrations(query,
          function (err, acctInts) {
            if (err)
              return done(
                new Error(
                  util.format('User cannot get account integration for query %s',
                    query, err)
                )
              );
            githubAccountIntegration = _.first(acctInts);
            assert.isNotEmpty(githubAccountIntegration, 'Account Integration ' +
              'cannot be empty');
            return done();
          }
        );
      }
    );

    it('2. Owner can add Github Subscription Integration',
      function (done) {

        var body = {
          accountIntegrationId: githubAccountIntegration.id,
          subscriptionId: subscription.id,
          name: 'ghOrgSubIntGH'
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

            subscriptionIntegration = subInt;

            global.saveTestResource(subInt.test_resource_name, subInt,
              function () {
                return done();
              }
            );
          }
        );
      }
    );

    it('3. Owner can delete Github Subscription Integration',
      function (done) {
        ownerApiAdapter.deleteSubscriptionIntegrationById(
          subscriptionIntegration.id,
          function (err, response) {
            if (err)
              return done(
                new Error(
                  util.format('User can delete subscriptionIntegration ' +
                    'id: %s, err: %s, %s', subscriptionIntegration.id, err,
                    response)
                )
              );

            global.removeTestResource(subscriptionIntegration.test_resource_name,
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
