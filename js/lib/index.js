// Export widget models and views, and the npm package version number.
require('./graph.css')

module.exports = require('./graph.js');
module.exports['version'] = require('../package.json').version;
