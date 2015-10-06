import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};

const width = 1100;
const height = 800;
// const center = {
//     x: width / 2,
//     y: height / 2
// };
// const margin = {left: 100, right: 100, top: 100, bottom: 100};

// const color = d3.scale.linear()
//     .domain([10, 15, 20, 25, 30, 40, 50, 55, 60, 80, 90, 95, 97, 98, 99, 150])
    // .range((["#041d4c", "#041d4c", "#041d4c", "#041d4c", "#041d4c",
    //     "#003269", "#003269", "#003269", "#003269", "#31669e",
    //     "#041d4c", "#041d4c", "#31659d", "#38507e", "#979696",
    //     "#939393"
    // ]));

const color2 = d3.scale.linear()
    .domain([10, 15, 20, 25, 30, 40, 50, 55, 60, 80, 90, 95, 97, 98, 99,
        150
    ])
    .range(["#ffffe0", "#fff6cf", "#ffeec1", "#ffe6b2", "#ffdda7",
        "#ffd59b", "#ffcb91", "#ffc287", "#ffb880", "#ffaf79",
        "#ffa474", "#ff9a6e", "#fe8f6a", "#fb8767", "#f87d64",
        "#f47361", "#f06a5e", "#eb615b", "#e65758", "#e14f55",
        "#db4551", "#d53d4c", "#ce3447", "#c82b42", "#c0223b",
        "#b81b34", "#b0122c", "#a70b24", "#9e051b", "#94010f",
        "#8b0000"
    ].reverse());

var data = require("json!./miserables.json");

const GRID_SIZE = 40;

const force = d3.layout.force()
    .charge(d =>  {
      return - Math.pow(d.radius, 2);
    })
    .gravity(0.2)
    .friction(0.9)
    .size([width, height])
    .linkDistance(0);

var linkedByIndex = {};

// function cropLen(d) {
//   var circum = d3MeasureText(d.name).width + 10;
//   // var needLen = circum;
//   var needLen = circum / Math.PI / 2;
//   // var availLen = d.radius * 2 * Math.PI;
//   var availLen = d.radius - (79/320 * d.radius);
//   if (availLen > needLen) return d.name.length;
//   else { var offset = parseInt(needLen - availLen);
//     var len = d.name.length - offset;
//     return len;
//   }
// }

function collide(data, alpha, padding) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
      var r = d.radius + padding,
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + padding + quad.point.radius;

          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

// Resolves collisions between d and all other circles.
// function collide(data, alpha, padding) {
//   var quadtree = d3.geom.quadtree(data);
//   var radius = GRID_SIZE / 2 + padding;
//
//   return function(d) {
//       // TODO: change
//         var nx1 = d.x - radius,
//           nx2 = d.x + radius,
//           ny1 = d.y - radius,
//           ny2 = d.y + radius;
//       quadtree.visit(function(quad, x1, y1, x2, y2) {
//           if (quad.point && (quad.point !== d)) {
//               var x = d.x - quad.point.x,
//                   y = d.y - quad.point.y,
//                   l = Math.sqrt(x * x + y * y),
//                   r = quad.point.radius;
//
//               if (l < r) {
//                   l = (l - r) / l * alpha;
//                   d.x -= x *= l;
//                   d.y -= y *= l;
//                   quad.point.x += x;
//                   quad.point.y += y;
//               }
//           }
//           return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
//       });
//   };
// }


function radial(d, index, alpha, radius, length, energy, startAngle, center) {
    const D2R = Math.PI / 180;
    var currentAngle = startAngle + (360 / length * index);
    var currentAngleRadians = currentAngle * D2R;

    //console.log(360/length);
    var radialPoint = {
        x: center.x + radius * Math.cos(currentAngleRadians),
        y: center.y + radius * Math.sin(currentAngleRadians)
    };

    var affectSize = alpha * energy;

    d.x += (radialPoint.x - d.x) * affectSize;
    d.y += (radialPoint.y - d.y) * affectSize;
    d.angle = currentAngle;
}


// function movePos(pos, alpha) {
//     return function(d) {
//         d.x = d.x + (pos.x - d.x) * (0.1 + 0.02) * alpha * 1.1;
//         d.y = d.y + (pos.y - d.y) * (0.1 + 0.02) * alpha * 1.1;
//     };
// }


function defaultTick(node, data) {
  return function() {

    var svg = d3.select("#vis svg");
    svg.select("g.gridcanvas").remove();
    grid.init();
    var gridCanvas = svg.append("svg:g").attr("class", "gridcanvas");
    grid.cells.forEach(c => {
      gridCanvas.append("svg:circle").attr("cx", c.x).attr("cy", c.y).attr("r", 2).style("fill", "#555").style("opacity", .3);
    });

    node.each(collide(data, 0.8, 1));
    node.each(griddlePos);
    node.attr("transform", d => "translate(" + d.screenX + "," + d.screenY + ")");
  };
}


function tickContextView(data, nbs, node, selectedNode, link) {

  function lineData(d){
    var straightLine = d3.svg.line().interpolate("step")
            .x(d => d.x)
            .y(d => d.y);

    var points = [
        {x: d.source.screenX, y: d.source.screenY},
        {x: d.target.screenX, y: d.target.screenY}
    ];
    return straightLine(points);
  }
  return function(e) {
    var svg = d3.select("#vis svg");
    svg.select("g.gridcanvas").remove();
    grid.init();
    var gridCanvas = svg.append("svg:g").attr("class", "gridcanvas");
    grid.cells.forEach(c => {
      gridCanvas.append("svg:circle")
        .attr("cx", c.x).attr("cy", c.y)
        .attr("r", 2).style("fill", "#555")
        .style("opacity", .3);
    });

    nbs.forEach((d, i) => {
        radial(d, i, e.alpha, 75, nbs.length, 0.5, 0, selectedNode);
    });

    node.each(collide(data.nodes, 1, 20));
    node.each(griddlePos);
    node.attr("transform", d => "translate(" + d.screenX + "," + d.screenY + ")");

    // link
    //   .attr("d", lineData);
    link.call(updateLink);
  };
}

function contextView(data, node, selectedNode) {
  // force.stop();
  // d3.selectAll("g.group path").style("fill", "blue");
  // d3.select(selectedNode).call(function(){
  //   d3.select(this).style("fill", "blue");
  // });

  selectedNode.fixed = true;

  console.log("selectNode", selectedNode);
  // var oldEdges = d3.selectAll(".hlink").data();
  var edges = [];
  var nbs = [];

  force.links(data.links);
  console.log("linkedByIndex", linkedByIndex);
  data.links.forEach(function(d) {
    linkedByIndex[d.source + "," + d.target] = true;
  });

  node.each(d => {
    if (isConnected(selectedNode, d)) {
      nbs.push(d);
      edges.push({
          id: selectedNode.index + d.index,
          source: selectedNode,
          target: d
      });
    }
  });

  // var newEdges = oldEdges.concat(edges);
  console.log("selectedNode", selectedNode);
  console.log("nbs", nbs);

  var link = d3.select("#vis svg").selectAll(".hlink")
      .data(edges, d => d.source.index + "-" + d.target.index);


  link
    .enter()
    .insert("line", ":first-child")
    .attr("class", "hlink")
      .style("stroke-width", () => {
          return 5;
      })
      .style("stroke", () => 20);

  force.links(edges);

  // node.each(d => d.fixed = true);
  force.linkStrength(0);
  // force.linkDistance(200);
  console.log("where is my data", data);
  force.on("tick", tickContextView(data, nbs, node, selectedNode, link));

  link.exit()
      .remove();

  // force.start();
}

function isConnected(a, b) {
    return isConnectedAsTarget(a, b) || isConnectedAsSource(a, b);
}

function isConnectedAsSource(a, b) {
    return linkedByIndex[a.index + "," + b.index];
}

function isConnectedAsTarget(a, b) {
    return linkedByIndex[b.index + "," + a.index];
}

function isEqual(a, b) {
    return a.index == b.index;
}

function render(data, linkedByIndex, selectedNode) {
    console.log("render data", data);

    // TODO: fix ID issue
    var node = d3.select("#vis svg").selectAll("g.group")
                  .data(data.nodes, d => d.name);

    console.log("node", node);

    var arc = d3.svg.arc()
      .innerRadius(d => d.radius - 10)
      .outerRadius(d => d.radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    // TODO: important
    var group = node
      .enter()
      .append("g")
      .attr("class", "group");

    group.append("circle")
      .attr("class", "node")
      .attr("r", d => d.radius)
      .style("opacity", 1)
      .style("fill", d => color2(d.radius))
      .call(force.drag);

    group.append("path")
      .attr("d", arc)
      .attr("fill", "lightgrey")
      .attr("id", (_, i) => "arc"+i);
      // .style("font-size", 20)
      // // .attr({
      // //       "alignment-baseline": "middle",
      // //       "text-anchor": "middle"
      // //     })
      // .text(d => d.key);

    // group.append("text")
    //   // .attr("x", 8)
    //   .attr("dy", 10)
    //   .append("textPath")
    //   .attr("textLength", d => {
    //     return d3MeasureText(d.name.substring(0, cropLen(d))).width + 10;
    //   })
    //   .attr("xlink:href",(_, i) => "#arc"+i)
    //   .attr("startOffset", 3/20)
    //   .attr("dy","-1em")
    //   .text(d => d.size > 20 ? d.name.substring(0, cropLen(d)) : null);

    force.on("tick", defaultTick(node, data.nodes));

    node
      .on("click", function(d) {
        console.log("click", d);
        if (!d.selected) {
          d.selected = true;
          d3.select(this).select("path").style("fill", "blue");
          render(data, linkedByIndex, d);
        }
        else render(data, linkedByIndex, null);
      })
      .on("mouseover", function() { });

    // contextView(d);
    if (selectedNode) contextView(data, node, selectedNode);

    node.exit()
        .remove();

    force.start();

    node.style("opacity", d => d.selected ? 1 : 0.5);

}

var grid = function(width, height) {
  return {
    cells : [],
    init : function() {
      this.cells = [];
      for(var i = 0; i < width / GRID_SIZE; i++) {
        for(var j = 0; j < height / GRID_SIZE; j++) {
          // HACK: ^should be a better way to determine number of rows and cols
          var cell = {
                x: i * GRID_SIZE,
                y: j * GRID_SIZE,
                selected: false
              };
          this.cells.push(cell);
        }
      }
    },
    sqdist : function(a, b) {
      return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    },
    occupyNearest : function(p) {
      var minDist = 100000;
      var candidate = null;
      for(var i = 0; i < this.cells.length; i++) {
        var d = this.sqdist(p, this.cells[i]);
        if(!p.selected && !this.cells[i].selected && !this.cells[i].occupied && d < minDist) {
          minDist = d;
          candidate = this.cells[i];
        }
      }
      if(candidate){
          candidate.occupied = true;
          candidate.selected = true;
        }
      return candidate;
    }
  };
} (width, height);

const d3ggLayout = {};

d3ggLayout.create = function(el, props) {
    //TODO: props to include as arg
    var svg = d3.select(el).append("svg")
                // .attr("id", "BubbleCloud")
                .attr("width", width)
                .attr("height", height)
                .append("g");
                // .attr("transform", "translate(545,300)");

    data.nodes.forEach(d => d.radius = 15);
    console.log("data", data);
    this.update(svg, data);
};

d3ggLayout.update = function(svg, data) {

  force.nodes(data.nodes);
  console.log("linkedByIndex", linkedByIndex);

  render(data, linkedByIndex, null);
};

// var updateNode = function() {
//   this.attr("transform", function(d) {
//       var gridpoint = grid.occupyNearest(d);
//       if(gridpoint) {
//         d.screenX = d.screenX || gridpoint.x;
//         d.screenY = d.screenY || gridpoint.y;
//         d.screenX += (gridpoint.x - d.screenX) * .2;
//         d.screenY += (gridpoint.y - d.screenY) * .2;
//
//         d.x += (gridpoint.x - d.x) * .05;
//         d.y += (gridpoint.y - d.y) * .05;
//       }
//     return "translate(" + d.screenX + "," + d.screenY + ")";
//   });
// };

var griddlePos = function(d) {
  var gridpoint = grid.occupyNearest(d);
  if(gridpoint) {
    d.screenX = d.screenX || gridpoint.x;
    d.screenY = d.screenY || gridpoint.y;
    d.screenX += (gridpoint.x - d.screenX) * .2;
    d.screenY += (gridpoint.y - d.screenY) * .2;

    d.x += (gridpoint.x - d.x) * .05;
    d.y += (gridpoint.y - d.y) * .05;
  }
};


var updateLink = function() {
  this.attr("x1", function(d) {
    return d.source.screenX;
  }).attr("y1", function(d) {
    return d.source.screenY;
  }).attr("x2", function(d) {
    return d.target.screenX;
  }).attr("y2", function(d) {
    return d.target.screenY;
  });
};


export default d3ggLayout;
