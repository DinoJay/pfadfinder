import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
import _ from "lodash";

const D2R = Math.PI / 180;
// var countries = require("i18n-iso-countries");
// var convTable = require("json!./map_data/ioc_iso_conv.json");
// var continents = require("json!./map_data/continents.json");

var NODE_RAD = 15;
var NODE_PADDING = 20;
var LABEL_OFFSET = 10;

var INIT_RAD_LAYOUT = 150;
var INIT_NODE_PADDING = 20;

var LAYOUT_RAD = 125;

var DOC_URL = "https://cdn4.iconfinder.com/data/icons/flat-icon-set/128/"
              + "flat_icons-graficheria.it-11.png";
var EMAIL_URL = "https://cdn0.iconfinder.com/data/icons/social-icons-20/200"
                + "/mail-icon-128.png";

var CALENDAR_URL = "https://cdn1.iconfinder.com/data/icons/education-colored-"
                   +"icons-vol-3/128/145-128.png";

Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};

function makeEdges(stack) {
  console.log("stack", stack);
  var edges = [];
  while(stack.length > 1) {
    var target = stack.pop();
    var edge  = {
      id: stack[stack.length - 1] + "-" + target,
      source: stack[stack.length - 1],
      target: target,
      value: 5
    };
    edges.push(edge);
  }
  return edges;
}

function arc(radius) {
  return d3.svg.arc()
           .innerRadius(radius)
           .outerRadius(radius - 1)
           .startAngle(0)
           .endAngle(2 * Math.PI);
}

function cropLen(d) {
  var circum = d3MeasureText(d.name).width + 10;
  // var needLen = circum;
  var needLen = circum / Math.PI / 2;
  // var availLen = d.radius * 2 * Math.PI;
  var availLen = d.radius - (79/320 * d.radius);
  if (availLen > needLen) return d.name.length;
  else {
    var offset = parseInt(needLen - availLen);
    var len = d.name.length - offset;
    return len;
  }
}

// var groupPath = function(d) {
//     var ret ="M" +
//       d3.geom.hull(d.values.map(function(e) { return [e.x, e.y]; }))
//         .join("L")
//     + "Z";
//     return ret !== "MZ" ? ret : null;
// };

// var groupFill = function(d, i) { return fill(i & 3); };
// var fill = d3.scale.category10();

var force = d3.layout.force()
    .charge(0)
    .gravity(0.2)
    .friction(0.9)
    .linkDistance(0)
    .linkStrength(0);


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


function radial(d, radius,  alpha, energy, center) {
    // var currentAngle = d.angle || (1 * index);
    var currentAngleRadians = d.angle * D2R;

    var radialPoint = {
      x: center.x + radius * Math.cos(currentAngleRadians),
      y: center.y + radius * Math.sin(currentAngleRadians)
    };

    var affectSize = alpha * energy;

    d.x += (radialPoint.x - d.x) * affectSize;
    d.y += (radialPoint.y - d.y) * affectSize;
}


// function movePos(pos, alpha) {
//     return function(d) {
//         d.x = d.x + (pos.x - d.x) * (0.1 + 0.02) * alpha * 1.1;
//         d.y = d.y + (pos.y - d.y) * (0.1 + 0.02) * alpha * 1.1;
//     };
// }


function defaultTick(node, width, height) {
  return function(e) {
    // node.each(movePos({x: width / 2, y: height / 2}, 0.2));
    node.data().forEach((d, i) => {
      d.angle = 360 / node.data().length * i;
      radial(d, d.dim*LAYOUT_RAD, e.alpha, 0.5, {x: width/2, y: height/2});
    });
    node.each(collide(node.data(), 0.1, /* INIT_NODE_PADDING + */ LABEL_OFFSET));
    // node.each(bindToBorderBox);
    // sometimes out of bounds the coords
    node.attr("transform", d => "translate(" + d.x + "," +  d.y  + ")");
  };

}

function tickContextView(node, link, width, height) {
  function lineData(d){
    var straightLine = d3.svg.line().interpolate("bundle")
            .x(d => d.x)
            .y(d => d.y);

    var points = [
        {x: d.source.x, y: d.source.y},
        {x: d.target.x, y: d.target.y}
    ];
    return straightLine(points);
  }

  var nodeGroups = d3.nest()
                   .key(d => d.dim)
                   .entries(node.data());
  // var lastGroup = nodeGroups[nodeGroups.length - 1].values;

  return function(e) {
    nodeGroups.forEach(group => {
      group.values.forEach(d => {
        radial(d, d.dim*LAYOUT_RAD, e.alpha, 0.5, {x: width/2, y: height/2});
      });
    });
    node.forEach(collide(node.data(), 0.1, LABEL_OFFSET));

    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    link.attr("d", lineData);
  };
}

// props
// {
// widthTotal:
// heightTotal: 500,
// width:
// height:
// svg: svg,
// linkedByIndex:
//  data: [],
//  view: "overview"
//  margin: {
//    left: 40,
//    right: 40,
//    top: 40,
//    bottom: 0
//  },
//}
function update(props) {
  var svg = d3.select("#vis svg");
  console.log("update", props);

  force.nodes(props.data.nodes);

  var labelArc = d3.svg.arc()
    .innerRadius(d => d.radius )
    .outerRadius(d => d.radius + LABEL_OFFSET)
    .startAngle(0)
    .endAngle(2 * Math.PI);

  console.log("force", force);

  var edges = [];
  if (props.selectedNode) {
    var nbs = [];
    var sumRadius = 0;

    if (props.selectedNode.values) {
      props.selectedNode.values.forEach(d => {
        edges.push({
          id: props.selectedNode.name + "-" + d.name,
          source: props.selectedNode,
          target: d,
          value: 1
        });
        d.dim = props.selectedNode.dim + 1;
        nbs.push(d);
        sumRadius += d.radius + NODE_PADDING;
      });
    } else {
      props.linkedByIndex.nbs(props.selectedNode).forEach(d => {
        if (!d.selected){
          edges.push({
            id: props.selectedNode.name + "-" + d.name,
            source: props.selectedNode,
            target: d,
            value: 1
          });
          d.dim = props.selectedNode.dim + 1;
          nbs.push(d);
          sumRadius += d.radius + NODE_PADDING;
        }
      });
      console.log("NBS linkedByIndex", nbs);
    }
    edges = edges.concat(makeEdges(props.selected.slice()));

    nbs.forEach((d, i) => {
      // crazy formula, I know
      d.angle = props.selectedNode.angle - (sumRadius / (d.dim*2))
                + ((i * (d.radius + NODE_PADDING)) / d.dim );
    });

    // filter out duplicates
    props.data.nodes = _.uniq(props.data.nodes.concat(nbs), "name");
    force.links(edges);
  }

  force.nodes(props.data.nodes);

  // TODO: fix ID issue
  var node = svg.selectAll("g.group")
                .data(props.data.nodes, d => d.name);

  // TODO: important
  var group = node
    .enter()
    .append("g")
    .attr("class", "group");

  group.append("svg:image")
    .attr("xlink:href", d => {
      switch (d.group % 3) {
        case 0:
          return DOC_URL;
        case 1:
          return EMAIL_URL;
        default:
          return CALENDAR_URL;
      }
    })
    .attr("x", d => - d.radius)
    .attr("y", d => - d.radius)
    .attr("height", d => d.radius * 2)
    .attr("width", d => d.radius * 2)
    .attr("opacity", 0.7);

  group.append("path")
    .attr("d", labelArc)
    .attr("fill", "lightgrey")
    .attr("id", (_, i) => "arc"+i)
    .style("font-size", 20)
    .attr("alignment-baseline", "middle")
    .attr("text-anchor", "middle")
    .attr("opacity", 0.5);

  group.append("text")
    // .attr("x", 8)
    .attr("dy", 10)
    .append("textPath")
    .attr("textLength", d => {
      return d3MeasureText(d.name.substring(0, cropLen(d))).width + 10;
    })
    .attr("xlink:href",(_, i) => "#arc"+i)
    .attr("startOffset", 3/20)
    .attr("dy","-1em")
    .text(d => d.name.substring(0, cropLen(d)));

  svg.selectAll("path.link")
    .data([]).exit().remove();

  svg.selectAll(".group-label")
    .data([]).exit().remove();

  node
    .on("click", function(d) {
      if (!d.selected) {
        console.log("click", d);
        // d.fixed = true;
        d.selected = true;
        // d3.select(this).select("path").style("fill", "blue");
        props.selectedNode = d;
        props.selected.push(d);
        update(props);
      }
    })
    .on("mouseover", function() { });

  var link = d3.select("#vis svg").selectAll(".link")
      .data(edges, d => d.source.name + "-" + d.target.name);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link")
    .style("stroke-width", d => d.value)
    .style("stroke", () => 20);

  if (edges.length > 0) {
    force.on("tick", tickContextView(node, link, props.width, props.height));
  }
  else force.on("tick", defaultTick(node, props.width, props.height));

  node.exit()
      .remove();

  force.on("end", () => {
    for(var i = 1; i < 8; i++) {
      svg.insert("path", ":first-child").attr("d", arc(i*(LAYOUT_RAD -NODE_RAD-LABEL_OFFSET*2 )))
         .attr("transform", "translate(" + props.width/2 + "," +  props.height/2  + ")")
         .style("stroke-width", 1)
         .attr("fill", "lightgrey");
    }
  });

  // d3.selectAll("path.dbar").data([]).exit().remove();
  force.start();
}


const d3ggLayout = {};

// defaultProps{
//   widthTotal: 1350,
//   heightTotal: 500,
//   margin: {
//     left: 40,
//     right: 40,
//     top: 40,
//     bottom: 0
//   },
//   data: [],
//   view: "overview"
// };
d3ggLayout.create = function(el, props) {

  // TODO: fix hack
  props.data.nodes.forEach((d, i) => {
    d.dim = 1;
    d.radius = NODE_RAD;
    d.index = i;
    // d.group = parseInt(d.group) % 4;
  });

  // TODO: not working, BUG
  // props.data.nodes.forEach(d => {
  //   props.data.nodes.forEach(e => {
  //     if (props.linkedByIndex.isConnected(d, e) && !d.selected) {
  //       console.log("source", d.name, "target", e.name);
  //       d.values.push(e);
  //     }
  //   });
  // });

  console.log("props data", props.data.nodes);

  var groupedData = d3.nest()
                 .key(d => d[props.initDataType])
                 .entries(props.data.nodes);


  // hack TODO: fix
  groupedData.forEach(d => {
    d.name = d.key;
    d.dim = 1;
    d.radius = NODE_RAD;
  });

  props.data.nodes = groupedData;
  console.log("groupedData", props.data.nodes);

  //TODO: props to include as arg
  var svg = d3.select(el).append("svg")
    // .attr("id", "pf")
    .attr("width", props.width)
    .attr("height", props.height);

  force.size([props.width, props.height]);

  this.update(props);
};

d3ggLayout.update = update;

export default d3ggLayout;
