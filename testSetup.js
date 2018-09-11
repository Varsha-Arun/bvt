'use strict';

var self = testSetup;
module.exports = self;

var chai = require('chai');
var nconf = require('nconf');
var fs = require('fs');
var backoff = require('backoff');

var ShippableAdapter = require('./_common/shippable/Adapter.js');
var GithubAdapter = require('./_common/github/Adapter.js');

global.util = require('util');
global._ = require('underscore');
global.async = require('async');
global.assert = chai.assert;
global.expect = require('chai').expect;

global.logger = require('./_common/logging/logger.js')(process.env.LOG_LEVEL);
global.resourcePath = './conf.json';

global.config = {};
global.TIMEOUT_VALUE = 0;
global.DELETE_PROJ_DELAY = 5000;

global.config.apiUrl = process.env.SHIPPABLE_API_URL;
global.GH_API_URL = process.env.GH_API_URL;

global.TEST_GH_ORGNAME = process.env.TEST_GH_ORGNAME;
global.TEST_GH_PR_REPO = process.env.TEST_GH_PR_REPO;
global.TEST_GH_CACHE_REPO = process.env.TEST_GH_CACHE_REPO;
global.TEST_GH_MATRIX_REPO = process.env.TEST_GH_MATRIX_REPO;

global.ADM_GH_PRIV_PROJECT_COUNT = process.env.ADM_GH_PRIV_PROJECT_COUNT;
global.ADM_GH_IND_PROJECT_COUNT = process.env.ADM_GH_IND_PROJECT_COUNT;
global.ADM_GH_ORG_PROJECT_COUNT = process.env.ADM_GH_ORG_PROJECT_COUNT;
global.ADM_GH_FORK_PROJECT_COUNT = process.env.ADM_GH_FORK_PROJECT_COUNT;
global.ADM_GH_PROJECT_COUNT = process.env.ADM_GH_PROJECT_COUNT;
global.ADM_GH_ORG_SUB_COUNT = process.env.ADM_GH_ORG_SUB_COUNT;
global.ADM_GH_IND_SUB_COUNT = process.env.ADM_GH_IND_SUB_COUNT;
global.ADM_GH_SUB_COUNT = process.env.ADM_GH_SUB_COUNT;

global.COL_GH_PRIV_PROJECT_COUNT = process.env.COL_GH_PRIV_PROJECT_COUNT;
global.COL_GH_IND_PROJECT_COUNT = process.env.COL_GH_IND_PROJECT_COUNT;
global.COL_GH_ORG_PROJECT_COUNT = process.env.COL_GH_ORG_PROJECT_COUNT;
global.COL_GH_FORK_PROJECT_COUNT = process.env.COL_GH_FORK_PROJECT_COUNT;
global.COL_GH_PROJECT_COUNT = process.env.COL_GH_PROJECT_COUNT;
global.COL_GH_ORG_SUB_COUNT = process.env.COL_GH_ORG_SUB_COUNT;
global.COL_GH_IND_SUB_COUNT = process.env.COL_GH_IND_SUB_COUNT;
global.COL_GH_SUB_COUNT = process.env.COL_GH_SUB_COUNT;

global.MEM_GH_PRIV_PROJECT_COUNT = process.env.MEM_GH_PRIV_PROJECT_COUNT;
global.MEM_GH_IND_PROJECT_COUNT = process.env.MEM_GH_IND_PROJECT_COUNT;
global.MEM_GH_ORG_PROJECT_COUNT = process.env.MEM_GH_ORG_PROJECT_COUNT;
global.MEM_GH_FORK_PROJECT_COUNT = process.env.MEM_GH_FORK_PROJECT_COUNT;
global.MEM_GH_PROJECT_COUNT = process.env.MEM_GH_PROJECT_COUNT;
global.MEM_GH_ORG_SUB_COUNT = process.env.MEM_GH_ORG_SUB_COUNT;
global.MEM_GH_IND_SUB_COUNT = process.env.MEM_GH_IND_SUB_COUNT;
global.MEM_GH_SUB_COUNT = process.env.MEM_GH_SUB_COUNT;


global.githubOwnerAccessToken = process.env.GITHUB_ACCESS_TOKEN_OWNER;
global.githubCollabAccessToken = process.env.GITHUB_ACCESS_TOKEN_COLLAB;
global.githubMemberAccessToken = process.env.GITHUB_ACCESS_TOKEN_MEMBER;
global.githubUnauthorizedAccessToken = process.env.GITHUB_ACCESS_TOKEN_DRSHIP;
global.githubAmiAccessToken = process.env.GITHUB_ACCESS_TOKEN_AMI;
global.clusterNodeIpAddressU16 = process.env.CLUSTER_NODE_IP_ADDRESS_U16;
global.testManual = process.env.TEST_MANUAL;

global.GH_ORG_SUB_INT_GH = process.env.GH_ORG_SUB_INT_GH;

// each test starts off as a new process, setup required constants
function testSetup(done) {
  var who = util.format('%s|%s', self.name, testSetup.name);
  logger.debug(who, 'Inside');

  global.suAdapter = new ShippableAdapter(process.env.SHIPPABLE_API_TOKEN);
  global.pubAdapter = new ShippableAdapter(''); // init public adapter

  global.stateFile = nconf.file(global.resourcePath);
  global.stateFile.load();

  var bag = {
    systemCodes: null
  };

  // setup any more data needed for tests below
  async.parallel(
    [
      getSystemCodes.bind(null, bag)
    ],
    function (err) {
      if (err) {
        logger.error(who, 'Failed');
        return done(err);
      }
      global.systemCodes = bag.systemCodes;
      logger.debug(who, 'Completed');
      return done();
    }
  );
}

function getSystemCodes(bag, next) {
  var who = util.format('%s|%s', self.name, getSystemCodes.name);
  logger.debug(who, 'Inside');

  global.suAdapter.getSystemCodes('',
    function (err, systemCodes) {
      if (err) {
        logger.error(who, 'Failed');
        return next(err);
      }

      logger.debug(who, 'Completed');
      bag.systemCodes = systemCodes;
      return next();
    }
  );
}

global.newGHAdapterByToken = function (apiToken) {
  return new GithubAdapter(apiToken, global.GH_API_URL);
};

global.newApiAdapterByToken = function (apiToken) {
  return new ShippableAdapter(apiToken);
};

global.newApiAdapterByStateAccount = function (account) {
  var apiToken = nconf.get(account).apiToken;
  return new ShippableAdapter(apiToken);
};

// NOTE: if state is not forwarded properly in case bvt gets stuck,
global.saveTestResource = function (name, object, done) {
  global.stateFile.set(name, object);
  global.stateFile.save(
    function (err) {
      if (err) {
        logger.error('Failed to save account info to nconf. Exiting...');
        process.exit(1);
      } else {
        return done();
      }
    }
  );
};

global.removeTestResource = function (name, done) {
  nconf.file(global.resourcePath);
  nconf.load();
  nconf.set(name, null);
  nconf.save(
    function (err) {
      if (err) {
        logger.error('Failed to save account info to nconf. Exiting...');
        process.exit(1);
      } else {
        return done();
      }
    }
  );
};

global.clearTestResources = function () {
  var who = 'global.clearResources|';
  var nconfFile = global.resourcePath;
  if (!nconfFile) {
    logger.warn(who, 'no nconf file specified to clear');
    return;
  }

  fs.exists(nconfFile,
    function (exists) {
      if (exists) {
        logger.info(who, 'delete nconf resource file: ', nconfFile);
        fs.unlink(nconfFile);
      } else {
        logger.info(who, 'no file found so not deleting');
      }
    }
  );
};

global.deleteProjectWithBackoff = function (projectId, done) {
  var expBackoff = backoff.exponential({
    initialDelay: 1000,
    maxDelay: global.DELETE_PROJ_DELAY
  });
  expBackoff.failAfter(50); // fail after 50 attempts
  expBackoff.on('backoff',
    function (number, delay) {
      logger.info('Failed to delete project with id:', projectId,
        'Retrying after ', delay, ' ms');
    }
  );

  expBackoff.on('ready',
    function () {
      global.suAdapter.deleteProjectById(projectId, {},
        function (err, response) {
          if (err) {
            logger.warn('deleteProjectWithBackoff',
              util.format('Cleanup-failed to delete the project with id:' +
                '%s, err: %s, %s', projectId, err, util.inspect(response)
              )
            );
            return expBackoff.backoff();
          }
          global.removeResource(
            {
              type: 'project',
              id: projectId
            },
            function () {
              expBackoff.reset();
              return done();
            }
          );
        }
      );
    }
  );

  // max number of backoffs reached
  expBackoff.on('fail',
    function () {
      return done(new Error('Max number of backoffs reached'));
    }
  );

  expBackoff.backoff();
};

global.getBuildStatusWithBackOff =
  function (apiAdapter, runObject, testName, statusCode, done) {

    var expBackoff = backoff.exponential(
      {
        initialDelay: 1000, // ms
        maxDelay: 6400, // max retry interval of 6 seconds
      }
    );
    expBackoff.failAfter(50); // fail after 50 attempts(~300 sec)

    expBackoff.on('backoff',
      function (number, delay) {
        logger.info(testName, ' in progress. Retrying after ', delay, ' ms');
      }
    );

    expBackoff.on('ready',
      function () {
        var query = util.format('resourceIds=%s', runObject.id);
        apiAdapter.getBuilds(query,
          function (err, builds) {
            if (err)
              return done(
                new Error(
                  util.format('Failed to get builds for query %s with ' +
                    'err %s', util.inspect(query), util.inspect(err)
                  )
                )
              );

            if (_.isEmpty(builds))
              return expBackoff.backoff(); // wait for builds to reach statusCode

            var build = _.first(builds);
            if (build.statusCode !== statusCode) {
              expBackoff.backoff();
            } else {
              expBackoff.reset();
              return done();
            }
          }
        );
      }
    );

    // max number of backoffs reached
    expBackoff.on('fail',
      function () {
        return done(
          new Error('Max number of back-offs reached')
        );
      }
    );

    expBackoff.backoff();
  };

global.getRunByIdStatusWithBackOff =
  function (apiAdapter, runId, statusCode, done) {

    var expBackoff = backoff.exponential(
      {
        initialDelay: 1000, // ms
        maxDelay: 6400, // max retry interval of 6 seconds
      }
    );
    expBackoff.failAfter(200); // fail after 200 attempts(~1200 sec)

    expBackoff.on('backoff',
      function (number, delay) {
        logger.info('Run with id:', runId, 'is still processing. ' +
          'Retrying after', delay, ' ms');
      }
    );

    expBackoff.on('ready',
      function () {
        apiAdapter.getRunById(runId,
          function (err, run) {
            if (err)
              return done(
                new Error('Failed to get run for id:', runId, err)
              );

            if (run.statusCode !== statusCode) {
              expBackoff.backoff();
            } else {
              expBackoff.reset();
              return done();
            }
          }
        );
      }
    );

    // max number of backoffs reached
    expBackoff.on('fail',
      function () {
        return done(
          new Error('Max number of backoffs reached')
        );
      }
    );

    expBackoff.backoff();
  };

global.getResourceByNameAndTypeCode =
  function (adapter, name, typeCode, callback) {
    var response = {};

    var query = util.format('typeCode=%s', typeCode);
    adapter.getResources(query,
      function (err, res) {
        if (err) {
          response.error = new Error(
            util.format('User cannot get resources for query %s, err: %s',
              query, util.inspect(err))
          );
          return callback(response);
        }
        response.resource = _.findWhere(res, {"name": name});
        return callback(response);
      }
    );
  };

global.getVersionsByResourceId = function (adapter, resourceId, callback) {
  var response = {};
  
  var query = util.format('resourceIds=%s', resourceId);
  adapter.getVersions(query,
    function (err, vers) {
      if (err) {
        response.error = new Error(
          util.format('User cannot get versions for query %s, err: %s',
            query, util.inspect(err))
        );
        return callback(response);
      }
      response.versions = vers;
      return callback(response);
    }
  );
};
