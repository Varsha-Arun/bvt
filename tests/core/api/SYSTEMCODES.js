'use strict';

var testSetup = require('../../../testSetup.js');
var backoff = require('backoff');

var testSuite = 'API_SYSTEMCODES';
var testSuiteDesc = 'API tests for system codes';
var test = util.format('%s - %s', testSuite, testSuiteDesc);

describe(test,
  function () {
    var ownerApiAdapter = null;
    var collaboraterApiAdapter = null;
    var memberApiAdapter = null;
    var unauthorizedApiAdapter = null;
    var systemCodes = [];

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

           return done();
          }
        );
      }
    );

    it('1. Owner can get system codes',
      function (done) {
        ownerApiAdapter.getSystemCodes('',
          function (err, syscodes) {
            if (err || _.isEmpty(syscodes))
              return done(
                new Error(
                  util.format('User cannot get system codes',
                    query, err)
                )
              );
            systemCodes = syscodes;
            assert.isNotEmpty(systemCodes, 'User cannot find the system codes');
            return done();
          }
        );
      }
    );

    it('2. Member can get system codes',
      function (done) {
        memberApiAdapter.getSystemCodes('',
          function (err, syscodes) {
            if (err || _.isEmpty(syscodes))
              return done(
                new Error(
                  util.format('User cannot get system codes',
                    query, err)
                )
              );
            systemCodes = syscodes;
            assert.isNotEmpty(systemCodes, 'User cannot find the system codes');
            return done();
          }
        );
      }
    );

    it('3. Collaborater can get system codes',
      function (done) {
        collaboraterApiAdapter.getSystemCodes('',
          function (err, syscodes) {
            if (err || _.isEmpty(syscodes))
              return done(
                new Error(
                  util.format('User cannot get system codes',
                    query, err)
                )
              );
            systemCodes = syscodes;
            assert.isNotEmpty(systemCodes, 'User cannot find the system codes');
            return done();
          }
        );
      }
    );

    it('4. Public user can get system codes',
      function (done) {
        global.pubAdapter.getSystemCodes('',
          function (err, syscodes) {
            if (err || _.isEmpty(syscodes))
              return done(
                new Error(
                  util.format('User cannot get system codes',
                    query, err)
                )
              );
            systemCodes = syscodes;
            assert.isNotEmpty(systemCodes, 'User cannot find the system codes');
            return done();
          }
        );
      }
    );

    it('5. Unauthorized user can get system codes',
      function (done) {
        unauthorizedApiAdapter.getSystemCodes('',
          function (err, syscodes) {
            if (err || _.isEmpty(syscodes))
              return done(
                new Error(
                  util.format('User cannot get system codes',
                    query, err)
                )
              );
            systemCodes = syscodes;
            assert.isNotEmpty(systemCodes, 'User cannot find the system codes');
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
