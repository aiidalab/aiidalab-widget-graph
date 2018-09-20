import ipywidgets as widgets
from traitlets import Unicode, List

@widgets.register
class GraphWidget(widgets.DOMWidget):
    """A widget to visualize a force-directed graph."""
    _view_name = Unicode('GraphView').tag(sync=True)
    _model_name = Unicode('GraphModel').tag(sync=True)
    _view_module = Unicode('aiidalab-widget-graph').tag(sync=True)
    _model_module = Unicode('aiidalab-widget-graph').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    nodes = List([1,2,3]).tag(sync=True)
    edges = List([[1,2],[2,3]]).tag(sync=True)
