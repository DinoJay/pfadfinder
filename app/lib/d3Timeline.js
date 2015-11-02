import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
import _ from "lodash";

const D2R = Math.PI / 180;
// var countries = require("i18n-iso-countries");
// var convTable = require("json!./map_data/ioc_iso_conv.json");
// var continents = require("json!./map_data/continents.json");

// var NODE_RAD = 20;
// var NODE_PADDING = 20;
// var LABEL_OFFSET = 15;
//
// var INIT_RAD_LAYOUT = 150;
// var INIT_NODE_PADDING = 20;
//
// var LAYOUT_RAD = 125;
//
// var DOC_URL = "https://cdn4.iconfinder.com/data/icons/flat-icon-set/128/"
//               + "flat_icons-graficheria.it-11.png";
// var EMAIL_URL = "https://cdn0.iconfinder.com/data/icons/social-icons-20/200"
//                 + "/mail-icon-128.png";
// var CALENDAR_URL = "https://cdn1.iconfinder.com/data/icons/education-colored-"
//                    +"icons-vol-3/128/145-128.png";

// misc
Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};
Array.prototype.last = function() {
    return this[this.length-1];
}

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
  console.log("hey");
  var currentAngleRadians = d.angle * D2R;
  console.log("currentAngleRadians", currentAngleRadians);

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

    if (e.alpha < 0.05 && d3.select("#background-arc1").empty()) {
      d3.select("#vis-cont svg")
        .insert("path", ":first-child")
        .attr("d", backgroundArc(LAYOUT_RAD - (NODE_RAD + LABEL_OFFSET) ))
        .attr("id", "background-arc1")
        .attr("transform", "translate(" + width/2 + "," +  height/2  + ")")
        .style("stroke-width", 1)
        .attr("fill", "lightgrey");
    }
  };

}

function tickContextView(node, link, width, height) {
  function lineData(d){
    var straightLine = d3.svg.line()
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
  var lastGroup = nodeGroups[nodeGroups.length - 1];

  return function(e) {
    nodeGroups.forEach(group => {
      group.values.forEach(d => {
        radial(d, d.dim*LAYOUT_RAD, e.alpha, 0.5, {x: width/2, y: height/2});
      });
    });
    node.each(collide(node.data(), 0.1, 10 + LABEL_OFFSET));

    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    link.attr("d", lineData);

    if (e.alpha < 0.1 && d3.select("#background-arc" + lastGroup.key).empty()) {
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
function update(props) {
  var svg = d3.select("#vis-cont svg");
  console.log("update", props);
  var selectedNode = props.selected.last();
  force.nodes(props.data.nodes);
  console.log("force", force);

  var edges = [];
  if (props.selected.last()) {
    var nbs = [];
    var sumRadius = 0;

    if (selectedNode.values) {
      selectedNode.values.forEach(d => {
        edges.push({
          id: selectedNode.id + "-" + d.id,
          source: selectedNode,
          target: d,
          value: 1
        });
        d.dim = selectedNode.dim + 1;
        nbs.push(d);
        sumRadius += d.radius + NODE_PADDING;
      });
    } else {
      props.linkedByIndex.nbs(selectedNode, "Authorship").forEach(d => {
        if (!d.selected){
          edges.push({
            id: selectedNode.id + "-" + d.id,
            source: selectedNode,
            target: d,
            value: 1
          });
          d.dim = selectedNode.dim + 1;
          nbs.push(d);
          sumRadius += d.radius + NODE_PADDING;
        }
      });
      console.log("NBS linkedByIndex", nbs);
    }
    edges = edges.concat(makeEdges(props.selected.slice()));

    nbs.forEach((d, i) => {
      // crazy formula, I know
      d.angle = selectedNode.angle - (sumRadius / (d.dim*2))
                + ((i * (d.radius + NODE_PADDING)) / d.dim );
    });

    // filter out duplicates
    props.data.nodes = _.uniq(props.data.nodes.concat(nbs), "id");
    force.links(edges);
  }

  force.nodes(props.data.nodes);

  // TODO: fix ID issue
  var node = svg.selectAll("g.group")
                .data(props.data.nodes, d => d.id);

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
    .attr("d", labelArc(NODE_RAD, NODE_RAD))
    // .attr("fill", "lightgrey")
    .attr("id", (_, i) => "arc"+i)
    .style("font-size", 20)
    .attr("alignment-baseline", "middle")
    .attr("text-anchor", "middle");
    // .attr("opacity", 0.5);

  group.append("text")
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

  group.append("path")
    .attr("d", labelArc(NODE_RAD, NODE_RAD + LABEL_OFFSET))
    .attr("fill", "lightgrey")
    .attr("alignment-baseline", "middle")
    .style("font-size", 20)
    .attr("text-anchor", "middle")
    .attr("opacity", 0.5);


  svg.selectAll("path.link")
    .data([]).exit().remove();

  svg.selectAll(".group-label")
    .data([]).exit().remove();

  node
    .on("click", function(d) {
      console.log("clickclick", d);
      if (!d.selected) {
        console.log("click", d);
        // d.fixed = true;
        d.selected = true;
        // d3.select(this).select("path").style("fill", "blue");
        props.selected.push(d);
        update(props);
      } else {
        console.log("UNclick", d);
        d.selected = false;
        props.selected.pop();
        update(props);
      }

    })
    .on("mouseover", function() { });

  console.log("node", props.data.nodes);
  var link = d3.select("#vis-cont svg").selectAll(".link")
      .data(edges, d => d.source.id + "-" + d.target.id);

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

  // d3.selectAll("path.dbar").data([]).exit().remove();
  force.start();
}


const d3Timeline = {};

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
d3Timeline.create = function(el, props) {
  var docs = props.data.documents;

  docs.forEach(d => {
    d.date = new Date(d.createdDate);
    console.log("date getTime", d.date.getTime());
  });

  docs.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log("sortedDocs", props.data.documents);

  var x = d3.time.scale()
      .domain([docs[0].date, docs[docs.length - 1].date])
      .rangeRound([0, props.width - props.margin.left - props.margin.right]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("right")
      .ticks(d3.time.days, 1)
      .tickFormat(d3.time.format("%a %d"))
      .tickSize(0)
      .tickPadding(8);

  console.log("props init data", props.initDataType);

  //TODO: props to include as arg
  d3.select(el).append("svg")
    // .attr("id", "pf")
    .attr("width", props.width)
    .attr("height", props.height)
    .append("g")
    .call(xAxis);

  // force.size([props.width, props.height]);

  // this.update(props);
};

d3Timeline.update = update;

export default d3Timeline;
