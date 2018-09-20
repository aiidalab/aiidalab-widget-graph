#!/bin/bash

pip install -e .
jupyter nbextension install --py --symlink --sys-prefix aiidalab_widget_graph
jupyter nbextension enable --py --sys-prefix aiidalab_widget_graph

