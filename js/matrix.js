(function() {
"use strict";


	function _MatrixView (_id) {

		var matrixData,
			margin = {top: 80, right: 0, bottom: 10, left: 80},
			width = 720,
			height = 720,
			x = d3.scale.ordinal().rangeBands([0, width]), 
			y = d3.scale.ordinal().rangeBands([0, height]), 
			z = d3.scale.linear().domain([0, 4]).clamp(true);

		var svgElem = d3.select(_id).append("svg")
		.style("margin-left", -margin.left + "px");

		var svg = svgElem.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var rect = svg.append("rect")
			  .attr("class", "background");

		var render = function() {
			if (!matrixData) {
				return;
			}
			var matrix = [],
			nodes = matrixData.nodes,
			n = nodes.length;

			  // Compute index per node.
			  nodes.forEach(function(node, i) {
			  	node.index = i;
			  	matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0, nodeA: nodes[j].name, nodeB: nodes[i].name}; });
			  	//add unique key that defines this first level matrix entry.
			  	matrix[i].key = function() {
			  		var zValues = matrix[i].map(function(d) {return d.z;});
			  		var nodeAValues = matrix[i].map(function(d) {return d.nodeA;});
			  		return nodes[i].name + "(" + nodeAValues.join() + ")(" + zValues.join() + ")";
			  	};
			  	//matrix row/column name
			  	matrix[i].labelName = nodes[i].name;
			  });

			  // Convert links to matrix; count character occurrences.
			  matrixData.links.forEach(function(link) {
			  	matrix[link.source][link.target].z += link.value;
			  	matrix[link.target][link.source].z += link.value;
			  	matrix[link.source][link.source].z += link.value;
			  	matrix[link.target][link.target].z += link.value;
			  });

			  // Precompute the orders.
			  var orders = {
			  	name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); })
			  };

			  // The default sort order.
			  x.domain(orders.name);
			  y.domain(orders.name);

			  var rowData = svg.selectAll(".row")
			  .data(matrix, function(d,i) {
			  	return d.key();
			  });

			  rowData.exit().remove();

			  var row = rowData.enter().append("g")
			  .attr("class", "row")
			  .each(renderRow);

			  var rowLine = row.append("line")
			  				   .attr("class", "rowLine");

			  var rowText = row.append("text")
				  .attr("x", -6)
				  .attr("dy", ".32em")
				  .attr("text-anchor", "end")
				  .attr("class", function(d) {
				  	return d.labelName+ "rowName rowText";;
				  })
				  .text(function(d, i) { 
				  	return d.labelName; 
				  });

			  var columnData = svg.selectAll(".column")
			  .data(matrix, function(d,i) { 
			  	return d.key();
			  });

			  columnData.exit().remove();

			  var column = columnData.enter().append("g")
			  .attr("class", "column");

			  var colLine = column.append("line")
			  					  .attr("class", "colLine");

			  var colText = column.append("text")
			  .attr("x", 6)
			  .attr("dy", ".32em")
			  .attr("text-anchor", "start")
			  .attr("class", function(d) {
			  	return d.labelName + "colName colText";
			  })
			  .text(function(d, i) { 
			  	return d.labelName; 
			  });

			  function renderRow(row) {
			  	var cellData = d3.select(this).selectAll(".cell")
			  	.data(row.filter(function(d) { 
			  		return d.z; 
			  	}), function(d) {
			  		return d.nodeA + '-' + parseInt(d.x) + '-' + parseInt(d.y) + '-' + parseInt(d.z) + '-' + d.nodeB;
			  	});

			  	cellData.exit().remove();

			  	var cell = cellData.enter().append("rect")
			  	.attr("class", "cell matrixCell")
			  	.style("fill-opacity", function(d) { 
			  		return z(d.z); 
			  	})
			  	.on("mouseover", mouseover)
			  	.on("mouseout", mouseout);
			  }

			  function mouseover(p) {
			  	d3.selectAll("." + p.nodeA + "colName").classed("active", true);
			  	d3.selectAll("." + p.nodeB + "rowName").classed("active", true);
			  }

			  function mouseout() {
			  	d3.selectAll("text").classed("active", false);
			  }
			  redraw();

		};

		var redraw = function() {
			svgElem.attr("width", width + margin.left + margin.right);
			svgElem.attr("height", height + margin.top + margin.bottom);
			rect.attr("width", width);
			rect.attr("height", height);
			x.rangeBands([0, width]);
			y.rangeBands([0, height]);
			var xRangeBand = x.rangeBand();
			var yRangeBand = y.rangeBand();
			if (isFinite(xRangeBand) && isFinite(yRangeBand)) {
				var row = d3.selectAll(".row")
				row.attr("transform", function(d, i) { 
			  		return "translate(0," + y(i) + ")"; 
			  	});
			  	var rowText = d3.selectAll(".rowText");
				rowText.attr("y", yRangeBand / 2);
				var rowFontSize = yRangeBand > 12 ? 12 : yRangeBand;
				rowText.attr("font-size", rowFontSize + "px");
				var rowLine = d3.selectAll(".rowLine");
				rowLine.attr("x2", height);
				
				var column = d3.selectAll(".column");
				column.attr("transform", function(d, i) { 
			  		return "translate(" + x(i) + ")rotate(-90)"; 
			  	});
			  	var colText = d3.selectAll(".colText");
				colText.attr("y", xRangeBand / 2);
				var colFontSize = xRangeBand > 12 ? 12 : xRangeBand;
				colText.attr("font-size", colFontSize + "px");
				var colLine = d3.selectAll(".colLine");
				colLine.attr("x1", -width);

				d3.selectAll(".cell")
					.attr("width", xRangeBand)
					.attr("height", yRangeBand)
					.attr("x", function(d) { return x(d.x); });
			}
		};

		this.size = function(_size) {
			if (_size) {
				width = _size.width;
				height = _size.height;
				redraw();
				return this;	
			} else {
				return {
					width: width,
					height: height
				};
			}
		};

		this.data = function(_matrixData) {
			matrixData = _matrixData;
			render();
			return this;
		};

	}

	//make a global reference to the matrix view
	window.MatrixView = _MatrixView;

})()