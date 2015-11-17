/* @flow */
import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
import _ from "lodash";
import { makeEdges } from "./misc.js";

const D2R = Math.PI / 180;

var NODE_RAD = 20;
var NODE_PADDING = 20;
var LABEL_OFFSET = 15;

// var INIT_RAD_LAYOUT = 150;
// var INIT_NODE_PADDING = 20;

var LAYOUT_RAD = 150;

var DOC_URL = "https://cdn4.iconfinder.com/data/icons/flat-icon-set/128/"
              + "flat_icons-graficheria.it-11.png";
var EMAIL_URL = "https://cdn0.iconfinder.com/data/icons/social-icons-20/200"
                + "/mail-icon-128.png";

var CALENDAR_URL = "https://cdn1.iconfinder.com/data/icons/education-colored-"
                   +"icons-vol-3/128/145-128.png";

Array.prototype.last = function() {
    return this[this.length-1];
};


function backgroundArc(radius) {
  return d3.svg.arc()
           .innerRadius(radius)
           .outerRadius(radius - 1)
           .startAngle(0)
           .endAngle(2 * Math.PI);
}
function labelArc(innerRadius, outerRadius) {
  return d3.svg.arc()
           .innerRadius(innerRadius)
           .outerRadius(outerRadius)
           .startAngle(0)
           .endAngle(2 * Math.PI);
}

// function wrap() {
//         var self = d3.select(this),
//             textLength = self.node().getComputedTextLength(),
//             text = self.text();
//         while (textLength > 12 && text.length > 0) {
//             // text = text.slice(0, -1);
//             self.text(text + "...");
//             textLength = self.node().getComputedTextLength();
//         }
//     }
// function wrap(title, width) {
//     var text = d3.select(this),
//         words = title.split(/\s+/).reverse(),
//         word,
//         line = [],
//         lineNumber = 0,
//         lineHeight = 1.1, // ems
//     while (word = words.pop()) {
//       line.push(word);
//       tspan.text(line.join(" "));
//       if (tspan.node().getComputedTextLength() > width) {
//         line.pop();
//         tspan.text(line.join(" "));
//         line = [word];
//         tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
//       }
//     }
// }

function cropLen(string) {
  if (string.length > 13) return string.substring(0, 14).concat("...");
  else return string;
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


function tick(node, link, width, height) {
  function lineData(d){
    var straightLine = d3.svg.line().interpolate("bundle")
            .x(d => d.x)
            .y(d => d.y);

    var points = [
        {x: d.source.x - (NODE_RAD - LABEL_OFFSET), y: d.source.y},
        {x: d.target.x, y: d.target.y}
    ];
    return straightLine(points);
  }

  var nodeGroups = d3.nest()
                   .key(d => d.dim)
                   .entries(node.data());
  var lastGroup = nodeGroups[nodeGroups.length - 1];

  return function(e) {
    nodeGroups.forEach(group => {
      group.values.forEach((d, i) => {
        d.angle = d.angle || 360 / node.data().length * i;
        radial(d, d.dim*LAYOUT_RAD, e.alpha, 0.5, {x: width/2, y: height/2});
      });
    });

    node.each(collide(node.data(), 0.1, 10 + LABEL_OFFSET));

    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    link.attr("d", lineData);

    var arc = d3.select("#background-arc" + lastGroup.key);
    if (e.alpha < 0.1 && arc.empty()) {
        d3.select("#vis-cont svg")
          .insert("path", ":first-child")
          .attr("d", backgroundArc(lastGroup.key*(LAYOUT_RAD - NODE_RAD - LABEL_OFFSET)))
          .attr("id", "background-arc" + lastGroup.key)
          .attr("transform", "translate(" + width/2 + "," +  height/2  + ")")
          .style("stroke-width", 1)
          .attr("fill", "lightgrey");
    }
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

var create = function(el, props) {

  // TODO: fix hack
  props.initData.forEach(d => {
    d.radius = NODE_RAD;
    // d.index = i;
    // d.group = parseInt(d.group) % 4;
  });

  props.dataStack = [ props.initData ];

  //TODO: props to include as arg
  d3.select(el).append("svg")
    // .attr("id", "pf")
    .attr("width", props.width)
    .attr("height", props.height);

  console.log("this Create", this);
  this.force.size([props.width, props.height]);

  this.update(props, this);
};

var update = function(props, that) {
  var svg = d3.select("#vis-cont svg");
  var edges = [];
  var selectedNode = props.path.last();

  console.log("selectedNode", selectedNode);

  if (selectedNode) {
    var type = "Keyword";
    var nbs = props.linkedByIndex.nbs(selectedNode, type);
    console.log("nbs", nbs);
    var sumRadius = d3.sum(nbs, d => d.radius);

    nbs.forEach((d, i) => {
      edges.push({
        id: selectedNode.title + "-" + d.title,
        source: selectedNode,
        target: d,
        value: 1
      });
      d.connectedByType = type;
      d.dim = selectedNode.dim + 1;
      d.angle = selectedNode.angle - (sumRadius / (d.dim*2))
                + ((i * (d.radius + NODE_PADDING)) / d.dim );
    });

    edges = edges.concat(makeEdges(props.path.slice()));

    // attach nbs
    if (props.forward) {
      props.dataStack.push(_.uniq(props.path.concat(nbs), "title"));
    }


    console.log("update Graph inner", this);
    that.force.links(edges);
  }

  that.force.nodes(props.dataStack.last());
  // console.log("dataStack", props.dataStack.last().map(d => d.title));

  // TODO: fix ID issue
  var node = svg.selectAll("g.group")
                // TODO: does not work with id
                .data(props.dataStack.last(), d => d.title);

  // TODO: important
  node
    .enter()
    .call(function() {
      var g = this.append("g")
        .attr("class", "group");

      g.append("svg:image")
        .attr("xlink:href", d => {
          switch (d.datatype) {
            case "Publication":
              return DOC_URL;
            case "Email":
              return EMAIL_URL;
            case "Note":
              return CALENDAR_URL;
            default:
              return CALENDAR_URL;
          }
        })
        .attr("x", d => - d.radius)
        .attr("y", d => - d.radius)
        .attr("height", d => d.radius * 2)
        .attr("width", d => d.radius * 2);
        // .attr("opacity", 0.7);

      g.append("path")
        .attr("d", labelArc(NODE_RAD, NODE_RAD))
        // .attr("fill", "lightgrey")
        .attr("id", (_, i) => "arc"+i)
        .style("font-size", 20)
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "middle");
        // .attr("opacity", 0.5);

      g.append("text")
        // .attr("x", 8)
        .attr("dy", - 2)
        .append("textPath")
        .attr("textLength", d => {
          return d3MeasureText(cropLen(d.title)).width;
        })
        .attr("xlink:href",(_, i) => "#arc"+i)
        .attr("startOffset", 3/40)
        .attr("dy","-1em")
        .text(d => cropLen(d.title));//.each(wrap);

      g.append("path")
        .attr("d", labelArc(NODE_RAD, NODE_RAD + LABEL_OFFSET))
        .attr("fill", "lightgrey")
        .attr("alignment-baseline", "middle")
        .style("font-size", 20)
        .attr("text-anchor", "middle")
        .attr("opacity", 0.5);
    });

  var maxDim = d3.max(node.data(), d => d.dim);
  node.attr("opacity", d => {
    if (d.dim < maxDim && !d.selected) return 0.1;
    if (d.dim === maxDim && !d.selected) return 0.5;
    return 1;
  });

  node
    .on("click", function(d) {
      if (parseFloat(d3.select(this).attr("opacity")) === 0.1) return;

      if (!d.selected) {
        d.fixed = true;
        d.selected = true;
        props.path.push(d);
        props.forward = true;

        props.getPath(_.cloneDeep(props.path));

        update(props, that);
      } else {
        d.fixed = false;
        d.selected = false;
        props.path.pop();
        props.forward = false;
        props.dataStack.pop();
        props.getPath(_.cloneDeep(props.path));
        props.dataStack.last().forEach(e => {
          if (e.dim > d.dim) e.dim = d.dim;
        });
        update(props, that);
      }
    });

  var link = d3.select("#vis-cont svg").selectAll(".link")
      .data(edges, d => d.source.title + "-" + d.target.title);

  link.style("stroke-width", d => d.value);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link")
    .style("stroke", 20);

  that.force.on("tick", tick(node, link, props.width, props.height));

  that.force.start();

  link.exit().remove();
  node.exit().remove();

};

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

const d3ggLayout = new function(){
  return {
    force: d3.layout.force()
              .charge(0)
              .gravity(0.2)
              .friction(0.9)
              .linkDistance(0)
              .linkStrength(0),
    update: update,
    create: create
  };
};

export default d3ggLayout;
