/* eslint no-console:0 */

'use strict';

var self = startTests;
module.exports = self;

// NOTE: this file will be used when more tests are put in place
//  until then tests are run by a shell script. refer package.json

// setup the microservice for api health checks
// fetch system integrations for Auth using service user token
// will run mocha test modules
// https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically

var testSetup = require('./testSetup.js');
var testCleanup = require('./testCleanup.js');
var spawn = require('child_process').spawn;

startTests();

function startTests() {
  var who = util.format('%s|%s', self.name, startTests.name);
  logger.info(who, 'Inside');

  async.series(
    [
      testSetup.bind(null),
      testCleanup.bind(null),
      testRun.bind(null)
    ],
    function (err) {
      if (err) {
        logger.error('tests finished with errors');
        process.exit(1);  // make the script fail on errors
      }
      logger.info(who, 'Completed');
    }
  );
}

function testRun(next) {
  var who = util.format('%s|%s', self.name, testRun.name);
  logger.verbose(who, 'Inside');

  // takes a list of files/ directories for mocha and runs all in series
  var tests = [
    'tests/core/install/*.js',
    'tests/core/account/*.js',
    'tests/core/accountIntegration/*.js',
    'tests/core/api/*.js',
//    'tests/core/languageTests/AMI_v*.js',
    'tests/core/project/*.js',
    'tests/core/subscriptionIntegration/*.js',
    'tests/core/resources/GH_ORG_PRI_OWN_RSYNC.js',
    'tests/core/resources/GH_ORG_PRI_OWN_RUNSH.js',
    'tests/core/resources/GH_IND_PUB_OWN_RUNCI.js',
    'tests/core/resources/GH_IND_PRI_OWN_RUNSH_SHIPCTL.js'
  ];

  async.eachSeries(tests,
    function (test, nextTest) {
      var _who = who + '|' + test;
      logger.debug(_who, 'Inside');

      var child = spawn('node_modules/mocha/bin/mocha', [test]);
      child.stdout.on('data',
        function (data) {
          var str = '' + data; // converts output to string
          str = str.replace(/\s+$/g, ''); // replace trailing newline & space
          console.log(str);
        }
      );
      child.stderr.on('data',
        function (data) {
          var str = '' + data;
          str = str.replace(/\s+$/g, '');
          console.log(str);
        }
      );
      child.on('close',
        function (code) {
          if (code > 0) {
            logger.error(_who, util.format('%s test suites failed', code));
            return nextTest('some tests failed');
          }

          return nextTest();
        }
      );
    },
    function (err) {
      if (err) {
        logger.error(who, 'tests failed');
        return next(err);
      }
      logger.verbose(who, 'all tests done');
      return next();
    }
  );
}
