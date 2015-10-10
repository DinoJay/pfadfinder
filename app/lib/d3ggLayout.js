import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};

const margin = {
    left: 120,
    right: 80,
    top: 40,
    bottom: 40
  };

const width = 1350 - margin.left - margin.right;
const height = 620 - margin.top - margin.bottom;
// const center = {
//     x: width / 2,
//     y: height / 2
// };

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

const GRID_SIZE = 40;

const force = d3.layout.force()
    .charge(d => - Math.pow(d.radius, 2))
    .gravity(0.2)
    .friction(0.9)
    // .alpha(0.5)
    // push center of force down
    .size([width + margin.left + margin.right, height + margin.top + margin.bottom + 100])
    .linkDistance(0);

var linkedByIndex = new function() {
  return {
    index: {},
    init: function(links) {
      links.forEach(d => this.index[d.source + "," + d.target] = true);
    },
    isConnected: function(a, b) {
        return this.index[a.index + "," + b.index] || this.index[b.index + "," + a.index];
    }
  };
};


var Grid = function(width, height) { return {
    cells : [],
    init : function() {
      this.cells = [];
      for(var i = 0; i < width / GRID_SIZE; i++) {
        for(var j = 0; j < height / GRID_SIZE; j++) {
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


function griddlePos(d) {
  var gridpoint = Grid.occupyNearest(d);
  if(gridpoint) {
    d.screenX = d.screenX || gridpoint.x;
    d.screenY = d.screenY || gridpoint.y;
    d.screenX += (gridpoint.x - d.screenX) * .2;
    d.screenY += (gridpoint.y - d.screenY) * .2;

    d.x += (gridpoint.x - d.x) * .05;
    d.y += (gridpoint.y - d.y) * .05;
  }
}


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


// function movePos(pos, alpha) {
//     return function(d) {
//         d.x = d.x + (pos.x - d.x) * (0.1 + 0.02) * alpha * 1.1;
//         d.y = d.y + (pos.y - d.y) * (0.1 + 0.02) * alpha * 1.1;
//     };
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


function defaultTick(nodes, node) {
  return function() {

    Grid.init();

    // node.each(movePos({x: width / 2, y: height / 2}, 0.2));
    node.each(collide(nodes, 0.8, 1));
    // node.each(bindToBorderBox);
    node.each(griddlePos);
    // sometimes out of bounds the coords
    node.attr("transform", d => "translate(" + ( d.screenX || 0 ) + "," + ( d.screenY || 0 ) + ")");
  };
}


function tickContextView(node, neighbor, selectedNode, link) {
  function lineData(d){
    var straightLine = d3.svg.line().interpolate("step-before")
            .x(d => d.x)
            .y(d => d.y);

    var points = [
        {x: d.source.screenX, y: d.source.screenY},
        {x: d.target.screenX, y: d.target.screenY}
    ];
    return straightLine(points);
  }
  return function(e) {

    Grid.init();

    neighbor.each((d, i) => {
        radial(d, i, e.alpha, 75, neighbor.data().length, 0.5, 0, selectedNode);
    });

    node.each(collide(node.data(), 0.8, 20));
    // node.each(bindToBorderBox);
    node.each(griddlePos);

    node.attr("transform", d => "translate(" + d.screenX + "," + d.screenY + ")");
    link
      .attr("d", lineData);
    // link.call(updateLink);
  };
}


function contextView({ links: links, node: node, selectedNode: selectedNode,
                       linkedByIndex: linkedByIndex}) {
  selectedNode.fixed = true;

  console.log("force", force);
  var edges = [];

  force.links(links);

  var neighbor = node.filter(d => {
    if (linkedByIndex.isConnected(selectedNode, d)) {
      edges.push({
        id: selectedNode.index + d.index,
        source: selectedNode,
        target: d
      });
      return true;
    }
  });

  var link = d3.select("#vis svg").selectAll(".hlink")
      .data(edges, d => d.source.index + "-" + d.target.index);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "hlink")
      .style("stroke-width", () => { return 5;
      })
      .style("stroke", () => 20);

  force.links(edges);
  force.linkStrength(0);
  force.on("tick", tickContextView(node, neighbor, selectedNode, link));

  link.exit()
      .remove();

  node.selectAll("circle").style("opacity", 0);
  neighbor.selectAll("path").style("fill", "green");
}


function render({ data: data, selectedNode:  selectedNode,
                  linkedByIndex: linkedByIndex, view: view }) {

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

    force.on("tick", defaultTick(data.nodes, node));

    node
      .on("click", function(d) {
        console.log("click", d);
        if (!d.selected) {
          d.selected = true;
          d3.select(this).select("path").style("fill", "blue");
          render({
            data:          data,
            selectedNode:  d,
            linkedByIndex: linkedByIndex,
            view:          "contextView"
          });
        }
        else render({
              data:          data,
              selectedNode:  null,
              linkedByIndex: linkedByIndex,
              view:          "overview"
            });
      })
      .on("mouseover", function() { });

    switch (view) {
      case "contextView":
        contextView({
          links:         data.links,
          node:          node,
          selectedNode:  selectedNode,
          linkedByIndex: linkedByIndex
        });
        break;

      case "recapView":
        console.log("arc diagram");
        recapView({node: node, links: data.links});
        break;

      default: console.log("overview");
    }

    node.exit()
        .remove();

    // d3.selectAll("path.dbar").data([]).exit().remove();
    // d3.selectAll(".label").data([]).exit().remove();

    force.start();

    node.style("opacity", d => d.selected ? 1 : 0.5);

}


function recapView({node: node, links: links}) {

  // var straightLine = d3.svg.line()
  //                      .x(d => d.x)
  //                      .y(d => d.y);

  var nodes = node.data().slice();
  var tmpLinks = [];
  var bilinks = [];

  links.forEach(function(link) {
      var s = nodes[link.source],
          t = nodes[link.target],
          i = {type: "tmp", group: (s.group + t.group) / 2 }; // intermediate node

      if (s.group !== t.group) {
        nodes.push(i);
        tmpLinks.push({source: s, target: i}, {source: i, target: t});
        bilinks.push([s, i, t]);
      }

    });
  console.log("recapView", force.links());

  force.links(tmpLinks);
  force.nodes(nodes);

  var groups = d3.nest()
                 .key(d => d.group)
                 .entries(node.data());

  // used to scale node index to x position
  var xScale = d3.scale.linear()
      .domain([0, groups.length])
      .range([margin.left, margin.left + width]);

    var link = d3.select("#vis svg").selectAll("path.dbar")
      .data(bilinks);


    link
      .enter()
      .append("path")
      .attr("class", "dbar");
      // .attr("transform", function(d) {
      //   // arc will always be drawn around (0, 0)
      //   // shift so (0, 0) will be between source and target
      //   var xshift = d.source.x + (d.target.x - d.source.x) / 2;
      //   return "translate(" + d.source.x + ", " + d.target.y + ")";
      //
      // })
      // .attr("d", path);

    link.exit()
        .remove();

    var label = d3.select("#vis svg").selectAll(".label")
      .data(groups, d => d.key);

    label
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      // .attr("fill", "white")
      .attr("x", d => xScale(d.key))
      .attr("y", 250)
      .text(d => d.key);

    label.exit()
         .remove();

    force
      .charge(0)
      // .charge(d => - Math.pow(d.radius, 1.5))
      // .size([0, 0])
      .gravity(0)
      // .friction(0.6)
      .linkStrength(0)
      .on("tick", tickRecapView(force.nodes(), node, link, xScale));

  // var path = function(d) {
  //   var radians = d3.scale.linear()
  //                         .range([Math.PI / 2, 3 * Math.PI / 2]);
  //
  // // var arc = d3.svg.arc()
  // //   .innerRadius(d => d.radius - 10)
  // //   .outerRadius(d => d.radius)
  // //   .startAngle(0)
  // //   .endAngle(2 * Math.PI);
  //
  //   var arcLine = d3.svg.line.radial()
  //           // .interpolate("basis")
  //           // .tension(0)
  //           .angle(function(d) { return radians(d); });
  //
  //   console.log("link", d);
  //   // get x distance between source and target
  //   var xdist = Math.abs(d.source.x - d.target.x);
  //   console.log("xdist", xdist);
  //
  //   // set arc radius based on x distance
  //   arcLine.radius(xdist / 2);
  //
  //   // want to generate 1/3 as many points per pixel in x direction
  //   var points = d3.range(0, Math.ceil(xdist / 3));
  //   console.log("points", points);
  //
  //   // set radian scale domain
  //   radians.domain([0, points.length - 1]);
  //
  //   return arcLine(points);
  //
  // };


  d3.selectAll("*").on("click", d => console.log(d));
}

function tickRecapView(nodes, node, link, xScale) {
  return function(e) {

    Grid.init();

    nodes.forEach((d, i) => pushAxis(d, i, xScale, e.alpha, 0.5));
    // node.each(bindToBorderBox);
    node.each(collide(node.data(), 0.1, -8));
    // node.each(griddlePos);
    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    link.attr("d", function(d) {
          return "M" + d[0].x + "," + d[0].y
              + "S" + d[1].x + "," + d[1].y
              + " " + d[2].x + "," + d[2].y;
        });
    // node.attr("transform", d => "translate(" + ( d.screenX || 0 ) + "," + ( d.screenY || 0 ) + ")");
    // link
    //   .attr("d", lineData);
    // // link.call(updateLink);
  };
}

function pushAxis(d, i, xScale, alpha, energy) {

    //console.log(360/length);
    var axisPoint= {
        x: xScale(d.group),
        y: d.type === "tmp" ? 400:  50
    };

    var affectSize = alpha * energy;

   //d.x = d.x + (target.x - d.x) * (@damper + 0.02) * alpha * 1.1
    d.x += (axisPoint.x - d.x) * affectSize;
    d.y += (axisPoint.y - d.y) * affectSize;
}

function bindToBorderBox(d) {
  d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
  d.y = Math.max(margin.top * 2 + d.radius * 2, Math.min(height - d.radius, d.y));
  // d.screenX = Math.max(d.radius, Math.min(width - d.radius, d.screenX));
  // d.screenY = Math.max(d.radius, Math.min(height - d.radius, d.screenY));
}
// var updateLink = function() {
//   this.attr("x1", function(d) {
//     return d.source.screenX;
//   }).attr("y1", function(d) {
//     return d.source.screenY;
//   }).attr("x2", function(d) {
//     return d.target.screenX;
//   }).attr("y2", function(d) {
//     return d.target.screenY;
//   });
// };

const d3ggLayout = {};

d3ggLayout.create = function(el, props) {
    //TODO: props to include as arg
    var svg = d3.select(el).append("svg")
                // .attr("id", "pf")
                .attr("width", margin.left + width + margin.right)
                .attr("height", margin.top + height + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var gridCanvas = svg.append("svg:g").attr("class", "gridcanvas");
                        // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    Grid.init();

    Grid.cells.forEach(c => {
      gridCanvas.append("svg:circle")
        .attr("cx", c.x).attr("cy", c.y)
        .attr("r", 2).style("fill", "#555")
        .style("opacity", .3);
    });

    props.data.nodes.forEach(d => d.radius = 15);

    this.update(svg, props);
};

d3ggLayout.update = function(svg, props) {

  force.nodes(props.data.nodes);
  linkedByIndex.init(props.data.links);

  render({
    data:          props.data,
    selectedNode:  null,
    linkedByIndex: linkedByIndex,
    view:          props.view
  });

};

export default d3ggLayout;
