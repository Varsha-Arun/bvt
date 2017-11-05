'use strict';

var self = testCleanup;
module.exports = self;

var nconf = require('nconf');
var fs = require('fs');

var deleteFailedCIProjects = [];

function testCleanup() {
  var who = util.format('%s|%s', self.name, testCleanup.name);
  logger.debug(who, 'Inside');

  nconf.file(global.resourcePath);
  nconf.load();
  var testResource = nconf.get();

  var bag = {
    ciProjects: []
  };

  // projects should be saved with a these properties 
  // {test_resource_type: 'ci', id:''}
  var ciRes = _.where(testResource, {"test_resource_type": "ci"});

  if (!_.isEmpty(ciRes))
    bag.ciProjects = ciRes;

  async.series(
    [
      deleteCI.bind(null, bag)
    ],
    function (err) {
      if (err) {
        logger.error('Cleanup failed with errors');
        process.exit(1);  // make the script fail on errors
      }
      logger.debug(who, 'Completed');
    }
  );
}

function deleteCI(bag, next) {
  var who = util.format('%s|%s', self.name, deleteCI.name);
  logger.debug(who, 'Inside');

  async.each(bag.ciProjects,
    function (ci, callback) {
      global.suAdapter.deleteProjectById(ci.id, {},
        function (err) {
          if (err) {
            deleteFailedCIProjects.push(ci.fullName);
            logger.error(who,
              util.format('Failed to delete project, %s with err: %s',
                ci.fullName, err)
            );
          } else {
            logger.debug(who, 'Deleted project, ', ci.fullName);
          }
          callback();
        }
      );
    },
    function (err) {
      if (err) {
        logger.error(who,
          util.format('Failed to delete CI Projects. Please cleanup the ' +
            'following projects manually: %s',
            util.inspect(deleteFailedCIProjects)
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
