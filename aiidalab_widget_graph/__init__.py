from ._version import version_info, __version__

from .graph import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'aiidalab-widget-graph',
        'require': 'aiidalab-widget-graph/extension'
    }]
