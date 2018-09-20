var aiidalab-widget-graph = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'aiidalab-widget-graph',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'aiidalab-widget-graph',
          version: aiidalab-widget-graph.version,
          exports: aiidalab-widget-graph
      });
  },
  autoStart: true
};

