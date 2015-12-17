import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

import _ from "lodash";

import { makeEdges, DOC_URL, EMAIL_URL, CALENDAR_URL,
  relationColors, NOTE_URL
} from "./misc.js";

const D2R = Math.PI / 180;

var NODE_RAD = 20;
// var NODE_PADDING = 20;
var LABEL_OFFSET = 15; // var INIT_RAD_LAYOUT = 150;
// var INIT_NODE_PADDING = 20;
var INIT_LAYOUT_RAD = 260;
var LAYOUT_RAD = 175;

Array.prototype.last = function() {
    if (this.length > 0)
      return this[this.length-1];
    else return null;
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


function cropLen(string) {
  if (string.length > 13) return string.substring(0, 14).concat("...");
  else return string;
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


function radial(d, radius, alpha, energy, center) {
  var currentAngleRadians = d.angle * D2R;

  var radialPoint = {
    x: center.x + radius * Math.cos(currentAngleRadians),
    y: center.y + radius * Math.sin(currentAngleRadians)
  };

  var affectSize = alpha * energy;

  d.x += (radialPoint.x - d.x) * affectSize;
  d.y += (radialPoint.y - d.y) * affectSize;
}


function tick(node, link, width, height) {
  var lineData = function(d){
    var straightLine = d3.svg.line().interpolate("bundle")
            .x(d => d.x)
            .y(d => d.y);

    var points = [
        {x: d.source.x - (NODE_RAD - LABEL_OFFSET), y: d.source.y},
        {x: d.target.x, y: d.target.y}
    ];
    return straightLine(points);
  };

  var nodeGroups = d3.nest()
                   .key(d => d.dim)
                   .entries(node.data());
  // var lastGroup = nodeGroups[nodeGroups.length - 1];

  return function(e) {
    nodeGroups.forEach(group => {
      group.values.forEach((d, i) => {
        var radius = INIT_LAYOUT_RAD + (d.dim - 1) * LAYOUT_RAD;
        d.angle = d.angle || 360 / group.values.length * i;
        // d.offset = NODE_RAD + LABEL_OFFSET + 50;
        radial(d, radius + d.offset, e.alpha, 0.9, {x: width/2, y: height/2});
      });
    });

    if (e.alpha < 0.4) {
      node.each(collide(node.data(), 0.1, NODE_RAD + LABEL_OFFSET));
      node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      link.attr("d", lineData);
    }

    // var arc = d3.select("#background-arc" + lastGroup.key);
    // if (lastGroup.key > 1 && e.alpha < 0.1 && arc.empty()) {
    //   var radius = INIT_LAYOUT_RAD + lastGroup.key * (LAYOUT_RAD - NODE_RAD - LABEL_OFFSET);
    //     d3.select("#vis-cont svg")
    //       .insert("path", ":first-child")
    //       .attr("d", backgroundArc(radius))
    //       .attr("id", "background-arc" + lastGroup.key)
    //       .attr("transform", "translate(" + width/2 + "," +  height/2  + ")") .style("stroke-width", 1)
    //       .attr("fill", "lightgrey");
    // }
  };
}

function contextMenu(d, props, state, that) {

    var nbsList = [];
    ["Authorship", "Keyword", "Task"].forEach(facet => {
      var nbs = props.linkedByIndex.nbs(d, facet);
      if (nbs.length > 0) nbsList.push({key: facet, values: nbs});
    });

    if (nbsList.length == 0) return;

    var topContextMenu = len => {
          switch (len) {
            case 1:
              return 25;
            case 2:
              return 60;
            case 3:
              return 100;
      }
    };

    var ul = d3.select("#vis-cont")
      .insert("div")
      .attr("class", "context-menu")
      .insert("ul", ":first-child")
      .attr("class", "list")
      .style("position", "absolute")
      .style("left", d.x + "px")
      .style("top", d.y  - (topContextMenu(nbsList.length)) + "px")
      .style("margin-top", -75 + "px")
      .style("display", "inline");

    ul.selectAll("li")
      .data(nbsList)
      .enter()
    .append("li")
    .text(d => d.key)
    .on("click", d => {
        state.dataStack.pop();
        d3.select(".context-menu").remove();
        state.nbs = d.values;
        console.log("d.values", d.values);
        state.nbsStack.push(d.values);
        update(props, state, that, d.values);
    });
}

var create = function(el, props) {

  var state = {};
  var data = props.data.map(d => {
    d.radius = NODE_RAD;
    return d;
  });

  console.log("data", data);
  // var nestedData = d3.nest()
  //   .key(d => d.datatype)
  //   .entries(data).map(d => {
  //     d.id = "id" + d.key;
  //     d.title = d.key;
  //     d.radius = NODE_RAD;
  //     return d;
  //   });

  console.log("nestedData");
  state.dataStack = [data];
  state.nbsStack = [];

  d3.select(el).append("svg")
    .attr("width", props.width)
    .attr("height", props.height);

  this.force.size([props.width, props.height]);

  d3ggLayout.update(props, state, this, []);
  return this;
};

function update(props, state, that, nbs) {
  var svg = d3.select("#vis-cont svg");
  var edges = [];
  var selectedNode = props.path.last();

  // console.log("selectedNode", selectedNode);

  if (selectedNode) {
    var sumRadius = d3.sum(nbs, d => d.radius);

    nbs.forEach((d, i) => {
      edges.push({
        id: selectedNode.title + "-" + d.title,
        source: selectedNode,
        target: d,
        value: 1,
        type: d.connectedByType
      });
      // d.connectedByType = type;
      d.dim = selectedNode.dim + 1;

      d.angle = selectedNode.angle - (sumRadius / (d.dim*2))
                + ((i * (d.radius)) / d.dim );
      d.offset = selectedNode.offset;
    });

    edges = edges.concat(makeEdges(props.path.slice()));

    // attach nbs
    if (props.forward) {
      state.dataStack.push(_.uniq(props.path.concat(nbs), "id"));
    }

    // console.log("update Graph inner", this);
    that.force.links(edges);
  }

  that.force.nodes(state.dataStack.last());

  var node = svg.selectAll("g.group")
                .data(state.dataStack.last(), d => d.id);

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
              return NOTE_URL;
            default:
              return CALENDAR_URL;
          }
        })
        .attr("x", d => - d.radius)
        .attr("y", d => - d.radius)
        .attr("height", d => d.radius * 2)
        .attr("width", d => d.radius * 2);

      g.append("path")
        .attr("d", labelArc(NODE_RAD, NODE_RAD))
        // .attr("fill", "lightgrey")
        .attr("id", (_, i) => "arc"+i)
        .style("font-size", 20)
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "middle");

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
        .text(d => cropLen(d.title));

      g.append("path")
        .attr("d", labelArc(NODE_RAD, NODE_RAD + LABEL_OFFSET))
        .attr("fill", "lightgrey")
        .attr("alignment-baseline", "middle")
        .style("font-size", 20)
        .attr("text-anchor", "middle")
        .attr("opacity", 0.5);
    });

  var maxDim = d3.max(node.data(), d => d.dim);
  node
    .attr("opacity", d => {
      if (d.dim < maxDim && !d.selected) return 0.1;
      // TODO: delete later
      // if (d.dim === maxDim && !d.selected) return 0.5;
      // return 1;
    });

  node
    .on("click", function(d) {
      d3.event.stopPropagation();
      if (!d.selected) {
        d.fixed = true;
        d.selected = true;
        // TODO: change to state
        props.path.push(d);
        props.forward = true;

        props.getPath(props.path);
        contextMenu(d, props, state, that);

        update(props, state, that, []);
      } else {
        d3.select(".context-menu").remove();

        if (props.path.last().id !== d.id) return;
        d.fixed = false;
        d.selected = false;

        props.path.pop();
        props.forward = false;
        state.dataStack.pop();

        // send path to parent component
        props.getPath(props.path);
        state.dataStack.last().forEach(e => {
          if (e.dim > d.dim) e.dim = d.dim;
        });
        // reset angles
        if (d.dim === 1) state.dataStack.last().forEach(e => e.angle = null );

        update(props, state, that, state.nbsStack.last());
      }
    })
    .on("touchend", function(d) {
        d3.event.stopPropagation();
        if (!d.selected) return;
        d3.select(".context-menu").remove();

        if (props.path.last().id !== d.id) return;
        d.fixed = false;
        d.selected = false;

        props.path.pop();
        props.forward = false;
        state.dataStack.pop();

        // send path to parent component
        props.getPath(props.path);
        state.dataStack.last().forEach(e => {
          if (e.dim > d.dim) e.dim = d.dim;
        });
        // reset angles
        if (d.dim === 1) state.dataStack.last().forEach(e => e.angle = null );


        update(props, state, that, state.nbs);

    });

  var link = d3.select("#vis-cont svg").selectAll(".link")
        .data(edges, d => d.source.title + "-" + d.target.title);

  link
    .style("stroke-width", d => d.target.selected ? 15 : 1)
    .style("stroke", d => d.target.selected ? relationColors[d.type] : null);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link");
    // .style("stroke-width", d => d.value)
    // .style("stroke", 20);

  that.force.on("tick", tick(node, link, props.width, props.height));

  that.force.start();

  link.exit().remove();
  node.exit().remove();

}

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

// class d3ggLayout2 {
//   constructor() {
//       this.force = d3.layout.force()
//                       .charge(0)
//                       .gravity(0.2)
//                       .friction(0.9)
//                       .linkDistance(0)
//                       .linkStrength(0);
//     }
//     update() {
//       update();
//     }
// }

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
