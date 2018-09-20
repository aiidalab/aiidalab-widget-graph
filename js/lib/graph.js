var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var d3 = require('d3');

window.$d3 = d3;

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var GraphModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'GraphModel',
        _view_name : 'GraphView',
        _model_module : 'aiidalab-widget-graph',
        _view_module : 'aiidalab-widget-graph',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        nodes : [],
        edges: []
    })
});


// Custom View. Renders the widget model.
var GraphView = widgets.DOMWidgetView.extend({

    nodeWrapper: function(nodes) {return _.map(nodes, function(nodeId) {
        return {
            "id": nodeId,
            "group": nodeId,
            };
        })},

    edgeWrapper: function(edges) {return _.map(edges, function(edge) {
        return {
            "source": edge[0], 
            "target": edge[1], 
            "value": 1
            };
        })},

    ticked: function(d3this) {
        //this.d3Simulation.stop();
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

    updateGraph: function(nodeData, edgeData) {
        var _this = this;

        var colorFunction = function(groupId) {
            return d3.scaleOrdinal()
            .domain(_.range(100)) // TODO: Put here the max number of groups you have
            .range(d3.schemeCategory10)(groupId);
        };

        // Stop it first; prevent to enter infinite loops if there is a link pointing to unknown nodes
        // Note that this is still not enough to prevent problems
        this.d3Simulation.stop();

        this.d3Link = this.d3Link.data(edgeData, function(d) { return d.source.id + "-" + d.target.id; });
        this.d3Link.exit().remove();
        this.d3Link = this.d3Link
            .enter().append("line").merge(this.d3Link)
            .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

        this.d3Node = this.d3Node.data(nodeData, function(d) { return d.id;});
        this.d3Node.exit().remove();
        this.d3Node = this.d3Node
            .enter().append("circle").merge(this.d3Node)
            .attr("r", 5)
            .attr("fill", function(d) { return colorFunction(d.group); })
            .call(d3.drag()
            .on("start", function(d,i) { _this.dragstarted(d,i,this); })
            .on("drag", function(d,i) { _this.dragged(d,i,this); })
            .on("end", function(d,i) { _this.dragended(d,i,this); }));
        
        //this.d3Node.append("title")
        //   .text(function(d) { return d.id; });

        this.d3Simulation
            .nodes(nodeData);
        this.d3Simulation.force("link")
          .links(edgeData); 
        this.d3Simulation.alpha(1).restart();
    },

    render: function() {
        var theWidth = 400;
        var theHeight = 400;
        var _this = this;

        // Maybe this can be removed
        this.elId = 'graph-'+this.model.cid;
        this.el.id = this.elId;
        // Up to here

        var svgTag = '<svg id width="' + theWidth + '" height="' + theHeight + '"></svg>';
        this.el.innerHTML = svgTag;
        this.d3Elem = d3.select(this.el).select('svg');
        //console.log('render', this.el, this.d3Elem);
        
        this.d3Simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.id; }))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(theWidth / 2, theHeight / 2))
          .alphaTarget(1)
          .on("tick", function() { _this.ticked(this); }); // In this way 'this' inside the function is the View and not the d3 selection, and we pass the d3 selection as a parameter if needed

        var edgeData = this.edgeWrapper(this.model.get('edges'));
        this.d3Link = this.d3Elem.append("g")
            .attr("class", "links")
            .selectAll("line");

        var nodeData = this.nodeWrapper(this.model.get('nodes'));
        this.d3Node = this.d3Elem.append("g")
            .attr("class", "nodes")
            .selectAll("circle");

        this.updateGraph(nodeData, edgeData);


        this.model.on('change:nodes change:edges', this.graph_changed, this);
    },

    graph_changed: function() {
        var edges = this.edgeWrapper(this.model.get('edges'));
        var nodes = this.nodeWrapper(this.model.get('nodes'));

        console.log(edges, nodes);
        this.updateGraph(nodes, edges);

        //this.d3Link.attr('d', edges);
        //this.d3Node.attr('d', nodes);
    }
});

// TODO:
// - Make sure that when nodes are removed, also the corresponding edges are removed
//   (and they should be removed first!!) Otherwise it crashes in JS
// - Make a single call to change edges and nodes at the same time? Maybe provide
//   a Python Object on the other side?
// - Change the data format so that we can fix the group/color and the weight of links from python
// - rename link/edge, and put nodes always first
// - set default graph in python to be empty

module.exports = {
    GraphModel : GraphModel,
    GraphView : GraphView
};
