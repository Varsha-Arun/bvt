'use strict';

var self = testCleanup;
module.exports = self;

var nconf = require('nconf');
var fs = require('fs');

var deleteFailedProjects = [];
var deleteFailedSubInts = [];

function testCleanup(done) {
  var who = util.format('%s|%s', self.name, testCleanup.name);
  logger.verbose(who, 'Inside');

  nconf.file(global.resourcePath);
  nconf.load();

  var bag = {
    testResources : nconf.get()
  };

  async.series(
    [
      deleteProjects.bind(null, bag),
      deleteSubscriptionIntegrations.bind(null, bag),
    ],
    function (err) {
      if (err) {
        logger.error('Cleanup failed with errors');
        return done(err);
      }
      logger.verbose(who, 'Completed');
      return done();
    }
  );
}

function deleteProjects(bag, next) {
  var who = util.format('%s|%s', self.name, deleteProjects.name);
  logger.debug(who, 'Inside');

  // projects should be saved with a these properties
  // {test_resource_type: 'project', id:''}
  var projects = _.where(bag.testResources, {"test_resource_type": "project"});

  async.each(projects,
    function (prj, callback) {
      global.suAdapter.deleteProjectById(prj.id, {},
        function (err) {
          if (err) {
            deleteFailedProjects.push(prj.fullName);
            logger.error(who,
              util.format('Failed to delete project, %s with err: %s',
                ci.fullName, err)
            );
          } else
            logger.debug(who, 'Deleted project, ', prj.fullName);

          global.removeTestResource(prj.test_resource_name,
            function () {
              callback();
            }
          );
        }
      );
    },
    function (err) {
      if (err) {
        logger.error(who,
          util.format('Failed to delete CI Projects. Please cleanup the ' +
            'following projects manually: %s',
            util.inspect(deleteFailedProjects)
          )
        );
        next(err);
      } else {
        logger.debug(who, 'Deleted up all the active CI Projects');
        next();
      }
    }
  );
}

function deleteSubscriptionIntegrations(bag, next) {
  var who = util.format('%s|%s', self.name, deleteSubscriptionIntegrations.name);
  logger.debug(who, 'Inside');

  // subscriptionIntegrations should be saved with a these properties
  // {test_resource_type: 'subscriptionIntegration', id:''}
  var subInts = _.where(bag.testResources,
    {"test_resource_type": "subscriptionIntegration"});

  async.each(subInts,
    function (si, callback) {
      global.suAdapter.deleteSubscriptionIntegrationById(si.id, {},
        function (err) {
          if (err) {
            deleteFailedSubInts.push(si.name);
            logger.error(who,
              util.format('Failed to delete subscriptionInt, %s with err: %s',
                ci.fullName, err)
            );
          } else
            logger.debug(who, 'Deleted subscriptionIntegration, ', si.name);

          global.removeTestResource(si.test_resource_name,
            function () {
              callback();
            }
          );
        }
      );
    },
    function (err) {
      if (err) {
        logger.error(who,
          util.format('Failed to delete Subscription Integration. Please ' +
            'cleanup the following projects manually: %s',
            util.inspect(deleteFailedSubInts)
          )
        );
        next(err);
      } else {
        logger.debug(who, 'Deleted up all the active subscriptionIntegration');
        next();
      }
    }
  );
}