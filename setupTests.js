'use strict';

var self = setupTests;
module.exports = self;

var chai = require('chai');
var fs = require('fs');
var backoff = require('backoff');
var nconf = require('nconf');
var ShippableAdapter = require('./_common/shippable/Adapter.js');

global.util = require('util');
global._ = require('underscore');
global.async = require('async');
global.assert = chai.assert;
global.expect = require('chai').expect;

global.logger = require('./_common/logging/logger.js')(process.env.LOG_LEVEL);
global.resourcePath = './conf.json';

global.config = {};
global.TIMEOUT_VALUE = 0;
global.ownerProjectsNum = 1;
global.DELETE_PROJ_DELAY = 5000;

global.TEST_GH_ORGNAME = process.env.TEST_GH_ORGNAME;

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

global.config.apiUrl = process.env.SHIPPABLE_API_URL;
global.GHC_ENDPOINT = 'https://api.github.com';

global.githubOwnerAccessToken = process.env.GITHUB_ACCESS_TOKEN_OWNER;
global.githubCollabAccessToken = process.env.GITHUB_ACCESS_TOKEN_COLLAB;
global.githubMemberAccessToken = process.env.GITHUB_ACCESS_TOKEN_MEMBER;
global.githubUnauthorizedAccessToken = process.env.GITHUB_ACCESS_TOKEN_DRSHIP;

global.GITHUB_COLLAB_API_TOKEN_KEY = 'githubCollabApiToken';
global.GITHUB_MEMBER_API_TOKEN_KEY = 'githubMemberApiToken';
global.GITHUB_OWNER_API_TOKEN_KEY = 'githubOwnerApiToken';


global.GHC_OWNER_NAME = 'shiptest-github-owner';

global.GHC_MEMBER_PRIVATE_PROJ_FULL = 'shiptest-github-owner/testprivate';
// TODO: use full names everywhere for querying projects
global.GHC_MEMBER_PRIVATE_PROJ = 'testprivate';
global.GHC_PRIVATE_PROJ = 'shiptest_org_private_project_1';
global.GHC_PUBLIC_PROJ = 'shiptest_org_public_project_1';

global.GHC_CORE_TEST_U14_PROJ = 'coretest_single_build_nod';
global.GHC_CORE_TEST_U16_PROJ = 'coretest_single_build_nod_16';

// each test starts off as a new process, setup required constants
function setupTests() {
  var who = util.format('%s %s', self.name, setupTests.name);
  logger.verbose('Inside', who);

  global.suAdapter = new ShippableAdapter(process.env.SHIPPABLE_API_TOKEN);
  global.pubAdapter = new ShippableAdapter(''); // init public adapter

  global.stateFile = nconf.file(global.resourcePath);
  global.stateFile.load();

  var setupTestsPromise = new Promise(
    function (resolve, reject) {

      var bag = {
        systemCodes: null
      };

      // setup any more data needed for tests below
      async.parallel(
        [
          getSystemCodes.bind(null, bag)
        ],
        function (err) {
          if (err)
            return reject(err);

          global.systemCodes = bag.systemCodes;
          return resolve();
        }
      );
    }
  );
  return setupTestsPromise;
}

function getSystemCodes(bag, next) {
  global.suAdapter.getSystemCodes('',
    function (err, systemCodes) {
      if (err)
        return next(err);

      bag.systemCodes = systemCodes;
      return next();
    }
  );
}

global.newApiAdapterByToken = function (apiToken) {
  return new ShippableAdapter(apiToken);
};

global.newApiAdapterByStateAccount = function (account) {
  var apiToken = nconf.get(account).apiToken;
  return new ShippableAdapter(apiToken);
};


// NOTE: if state is not forwarded properly in case bvt gets stuck,
//       use s3 to save the state instead of $JOB_PREVOUS_STATE
global.saveResource = function (resource, done) {
  nconf.file(global.resourcePath);
  nconf.load();
  var nconfRes = nconf.get('BVT_RESOURCES') || [];
  nconfRes.push(resource);

  nconf.set('BVT_RESOURCES', nconfRes);
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


global.removeResource = function (resource, done) {
  nconf.file(global.resourcePath);
  nconf.load();
  var nconfRes = nconf.get('BVT_RESOURCES') || [];

  // filter out the resource
  nconfRes = _.filter(nconfRes,
    function (res) {
      return !(res.type === resource.type && res.id === resource.id);
    }
  );

  nconf.set('BVT_RESOURCES', nconfRes);
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

global.clearResources = function () {
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
  expBackoff.failAfter(30); // fail after 30 attempts
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


