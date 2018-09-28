var colorFunction = function(groupId) {
    return d3.scaleOrdinal()
    .domain(_.range(100)) // This should be changed to the max number of groups
    .range(d3.schemeCategory10)(groupId);
};

