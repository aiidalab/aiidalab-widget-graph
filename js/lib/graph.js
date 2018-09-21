var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var d3 = require('d3');

// The model
var GraphModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'GraphModel',
        _view_name : 'GraphView',
        _model_module : 'aiidalab-widget-graph',
        _view_module : 'aiidalab-widget-graph',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
    }),
});


// Custom View. Renders the widget model.
var GraphView = widgets.DOMWidgetView.extend({
    nodeProxy: function() {
        var nodes = this.model.get('_graph')['nodes'] || {};

        nodes = _.chain(nodes)
            .toPairs().sortBy(0) // convert to [[k, v], [k, v], ...]
            .map(function(pair) {return {"id": +pair[0], "meta": pair[1]}})
            .value();
        
        return nodes;
        },

    linkProxy: function() {
        var links = this.model.get('_graph')['links'] || [];

        return _.map(links, function(link) {
        return {
            "source": link[0], 
            "target": link[1], 
            "meta": link[2] || {}
            };
        })},

    ticked: function(d3this) {
        this.d3Link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        this.d3Node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        },

    dragstarted: function(d) {
            if (!d3.event.active) this.d3Simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          },
          
    dragged: function(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
          },
          
    dragended: function(d) {
            if (!d3.event.active) this.d3Simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          },

    updateGraph: function(nodeData, linkData) {
        var _this = this;

        var colorFunction = function(groupId) {
            return d3.scaleOrdinal()
            .domain(_.range(100)) // TODO: Put here the max number of groups you have
            .range(d3.schemeCategory10)(groupId);
        };

        // Stop it first; prevent to enter infinite loops if there is a 
        // link pointing to unknown nodes.
        // Note that this is still not enough to prevent problems
        this.d3Simulation.stop();

        // Put links below nodes so the node is above
        this.d3Link = this.d3Link.data(linkData, function(d) { 
            return d.source.id + "-" + d.target.id; 
        });
        this.d3Link.exit().remove();
        this.d3Link = this.d3Link
            .enter().append("line").merge(this.d3Link)
            .attr("stroke-width", function(d) { return Math.sqrt(d.meta.value || 1); });

        this.d3Node = this.d3Node.data(nodeData, function(d) { return d.id;});
        this.d3Node.exit().remove();
        this.d3Node = this.d3Node
            .enter().append("circle").merge(this.d3Node)
            .attr("r", 5)
            .attr("fill", function(d) { return colorFunction(d.meta.group || d.id); })
            .call(d3.drag()
            .on("start", function(d,i) { _this.dragstarted(d,i,this); })
            .on("drag", function(d,i) { _this.dragged(d,i,this); })
            .on("end", function(d,i) { _this.dragended(d,i,this); }));
    
        //this.d3Node.append("title")
        //   .text(function(d) { return d.id; });

        this.d3Simulation
            .nodes(nodeData);
        this.d3Simulation.force("link")
          .links(linkData); 
        this.d3Simulation
        //.alpha(1)
        .restart();
    },

    render: function() {
        var theWidth = 400;
        var theHeight = 400;
        var _this = this;

        // Optional
        this.elId = 'graph-'+this.model.cid;
        this.el.id = this.elId;

        var svgTag = '<svg id width="' + theWidth + '" height="' + theHeight + '"></svg>';
        this.el.innerHTML = svgTag;
        this.d3Elem = d3.select(this.el).select('svg');
        
        this.d3Simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.id; }))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(theWidth / 2, theHeight / 2))
          .alphaTarget(1)
          .on("tick", function() { _this.ticked(this); }); // In this way 'this' inside the function is the View and not the d3 selection, and we pass the d3 selection as a parameter if needed

        var nodeData = this.nodeProxy();
        this.d3Node = this.d3Elem.append("g")
              .attr("class", "nodes")
              .selectAll("circle");

        var linkData = this.linkProxy();
        this.d3Link = this.d3Elem.append("g")
            .attr("class", "links")
            .selectAll("line");

        this.updateGraph(nodeData, linkData);

        this.model.on('change:_graph', this.graph_changed, this);
    },

    graph_changed: function() {
        var nodes = this.nodeProxy();
        var links = this.linkProxy();
        this.updateGraph(nodes, links);
    }
});

// TODO:
// - Make sure that when nodes are removed, also the corresponding links are removed
//   (and they should be removed first!!) Otherwise it crashes in JS (i.e.: validate
//   the nodes in python, and make a guard in JS to avoid problems)
// - Povide a Python Object on the other side?
// - Instead of making a color group, pass a color string from python; expose
//   colorbrewer2 in python
// - fix the color function (there is now a 'range(100)')
// - make the_width, the_height as parameters from python
// - check parameters (e.g. when there is a node not linked to anything)
// - check if it is correct that the points seem to move when a new node is added
// - I think it's not needed that node keys are integers - verify, and remove the +
//   in JS in front of the value to cast it.

module.exports = {
    GraphModel : GraphModel,
    GraphView : GraphView
};
