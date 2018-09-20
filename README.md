aiidalab-widget-graph
===============================

A Jupyter widget to visualize interactive graphs

Installation
------------

To install use pip:

    $ pip install aiidalab_widget_graph
    $ jupyter nbextension enable --py --sys-prefix aiidalab_widget_graph


For a development installation (requires npm),

    $ git clone https://github.com/aiidalab/aiidalab-widget-graph.git
    $ cd aiidalab-widget-graph
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix aiidalab_widget_graph
    $ jupyter nbextension enable --py --sys-prefix aiidalab_widget_graph
