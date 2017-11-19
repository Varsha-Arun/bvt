'use strict';

var self = testCleanup;
module.exports = self;

var nconf = require('nconf');
var fs = require('fs');

var deleteFailedProjects = [];
var deleteFailedSubInts = [];
var deleteFailedSyncRepos = [];

function testCleanup(done) {
  var who = util.format('%s|%s', self.name, testCleanup.name);
  logger.verbose(who, 'Inside');

  nconf.file(global.resourcePath);
  nconf.load();

  var bag = {
    testResources: nconf.get()
  };

  async.series(
    [
      deleteProjects.bind(null, bag),
      deleteSubscriptionIntegrations.bind(null, bag),
      deleteSyncRepos.bind(null, bag)
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
                si.name, err)
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

function deleteSyncRepos(bag, next) {
  var who = util.format('%s|%s', self.name, deleteSyncRepos.name);
  logger.debug(who, 'Inside');

  // syncRepos should be saved with a these properties
  // {test_resource_type: 'subscriptionIntegration', id:''}
  var syncRepos = _.where(bag.testResources,
    {"test_resource_type": "syncRepo"});

  async.each(syncRepos,
    function (sr, callback) {

      var innerBag = {
        sr: sr
      };

      async.series(
        [
          _softDelete.bind(null, innerBag),
          _hardDelete.bind(null, innerBag)
        ],
        function (err) {
          if (err) {
            deleteFailedSyncRepos.push(sr.name);
            logger.error(who,
              util.format('Failed to delete syncRepo, %s with err: %s',
                sr.name, err)
            );
          } else
            logger.debug(who, 'Deleted syncRepo, ', sr.name);
          global.removeTestResource(sr.test_resource_name,
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
          util.format('Failed to delete SyncRepo. Please ' +
            'cleanup the following projects manually: %s',
            util.inspect(deleteFailedSyncRepos)
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

function _softDelete(bag, next) {
  var who = util.format('%s|%s', self.name, _softDelete.name);
  logger.debug(who, 'Inside');

  var query = '';
  global.suAdapter.deleteResourceById(bag.sr.id, query,
    function (err, response) {
      if (err)
        return next(util.format('Cleanup failed to delete ' +
          'resource with id: %s err: %s, %s', bag.sr.id, err,
          util.inspect(response)));
      return next();
    }
  );
}

function _hardDelete(bag, next) {
  var who = util.format('%s|%s', self.name, _hardDelete.name);
  logger.debug(who, 'Inside');

  var query = 'hard=true';
  global.suAdapter.deleteResourceById(bag.sr.id, query,
    function (err, response) {
      if (err)
        return next(util.format('Cleanup failed to delete resource ' +
          'with id: %s err: %s, %s', bag.sr.id, err,
          util.inspect(response)));

      return next();
    }
  );
}
