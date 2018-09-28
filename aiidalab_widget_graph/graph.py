import six
import ipywidgets as widgets
from traitlets import Unicode, List, Dict
from collections import OrderedDict

@widgets.register
class GraphWidget(widgets.DOMWidget):
    """A widget to visualize a force-directed graph."""
    _view_name = Unicode('GraphView').tag(sync=True)
    _model_name = Unicode('GraphModel').tag(sync=True)
    _view_module = Unicode('aiidalab-widget-graph').tag(sync=True)
    _model_module = Unicode('aiidalab-widget-graph').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    _graph = Dict().tag(sync=True)

    _scheme_category_10 = [
        "#1f77b4", "#ff7f0e", 
        "#2ca02c", "#d62728", 
        "#9467bd", "#8c564b", 
        "#e377c2", "#7f7f7f", 
        "#bcbd22", "#17becf"
        ] 

    def __init__(self, *args, **kwargs):
        """
        Initialize the variables
        """
        super(GraphWidget, self).__init__(*args, **kwargs)
        self._nodes = {}
        self._links = OrderedDict()

    def clean(self):
        """
        Empty the graph from all nodes and links
        """
        self._nodes = {}
        self._links = OrderedDict()
        self.update_graph()

    def update_graph(self):
        """
        Send the graph info to the JS visualization.
        """
        self._graph = {
            'nodes': self.get_nodes(), 
            'links': self.get_links(),
            }

    def add_node(self, node_id, node_meta=None):
        """
        Add a node to the graph, or completely replace it with the new meta
        """
        if node_meta is None:
            node_meta = {}
        if not isinstance(node_id, six.string_types):
            raise TypeError("The node id must be a string")
        if not isinstance(node_meta, dict):
            raise TypeError("The node meta must be a dict")
        self._nodes[node_id] = node_meta
    
    def add_node_meta(self, node_id, meta_key, meta_value):
        """
        Add (or replace) a specific node meta.
        Note: the node should already exist.
        """
        # I need to do this detour to make a copy and ensure the 
        # dict is updated
        try:
            new_meta =  {k: v for k, v in self._nodes[node_id].items()}
        except KeyError:
            raise ValueError("No node with node_id '{}'".format(node_id))
        new_meta[meta_key] = meta_value    
        self._nodes[node_id] = new_meta

    def remove_node_meta(self, node_id, meta_key):
        """
        Remove the specific meta (ignore if either the node or the meta do
        not exist)
        """
        new_meta = {k: v for k, v in self._nodes[node_id].items()}

        try:
            del new_meta[meta_key]
        except KeyError:
            pass

        self._nodes[node_id] = new_meta
        
    def remove_node(self, node_id):
        """
        Remove a node from the graph. Ignore if the node is not present.
        Also remove all links that are referencing to the removed node.
        """
        try:
            del self._nodes[node_id]
        except KeyError:
            pass

        # Remove links
        # Note: for large graphs this might not be very efficient 
        for pair in list(self._links):
            if link[0] == node_id or link[1] == node_id:
                del self._links[pair]

        self._links = [
            link for link in self._links 
            if link[0] != node_id and link[1] != node_id
            ]
    
    def add_link(self, source_id, dest_id, link_meta=None):
        """
        Add a new link (or replace it with the suggested meta).
        """
        if link_meta is None:
            link_meta = {}

        if source_id not in self._nodes:
            raise ValueError(
                "Source node '{}' not present in the graph".format(source_id))
        if dest_id not in self._nodes:
            raise ValueError(
                "Dest node '{}' not present in the graph".format(dest_id))

        if not isinstance(link_meta, dict):
            raise TypeError("The link meta must be a dict")

        self._links[source_id, dest_id] = self._prepare_link(
            source_id, dest_id, link_meta)

    def remove_link(self, source_id, dest_id):
        """
        Remove a given link; ignore if the link does not exist
        """
        try:
            del self._links[(source_id, dest_id)]
        except KeyError:
            pass
        
    def get_nodes(self):
        """
        Get the graph nodes in the following format::

          {"node_id": node_meta, ...}

        where node_meta is a dictionary of meta.
        """
        return dict(self._nodes)
    
    def get_links(self):
        """
        Get the graph links in the following format::

          [source_id, dest_id, meta_dict]

        Internally, an OrderedDict is used so the order is preserved.
        """
        return [
            [link['source'], link['dest'], link['meta']] 
            for link in self._links.values()]

    def add_link_meta(self, source_id, dest_id, meta_key, meta_value):
        """
        Set a single meta. If the link with given source_id and dest_id does not
        exist, raise a ValueError.
        """
        try:
            new_meta =  {k: v for k, v in self._links[(source_id, dest_id)]['meta'].items()}
        except KeyError:
            raise ValueError(
                "No link with source_id '{}' and dest_id '{}'".format(
                    source_id, dest_id)
                ) 
        new_meta[meta_key] = meta_value    
        self._links[(source_id, dest_id)] = self._prepare_link(
            source_id, dest_id, new_meta) 

    @staticmethod
    def _prepare_link(source_id, dest_id, link_meta):
        """
        Convert to the internal format
        """
        return {
            'source': source_id,
            'dest': dest_id,
            'meta': link_meta}

    def remove_link_meta(self, source_id, dest_id, meta_key):
        """
        Remove the specific meta of the link (ignore if either the link or 
        the meta do not exist)
        """

        new_meta = {k: v for k, v in self._links[(source_id, dest_id)]['meta'].items()}

        try:
            del new_meta[meta_key]
        except KeyError:
            pass

        self._links[(source_id, dest_id)] = self._prepare_link(
            source_id, dest_id, new_meta)


