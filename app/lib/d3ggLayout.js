import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

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
      radial(d, d.dim*INIT_RAD_LAYOUT, e.alpha, 0.5, {x: width/2, y: height/2});
    });
    node.each(collide(node.data(), 0.1, INIT_NODE_PADDING + LABEL_OFFSET));
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
  var lastGroup = nodeGroups[nodeGroups.length - 1].values;

  return function(e) {

    nodeGroups.forEach(group => {
      group.values.forEach(d => {
        radial(d, d.dim*LAYOUT_RAD, e.alpha, 0.5, {x: width/2, y: height/2});
      });
    });

    lastGroup.forEach(collide(lastGroup, 0.8, LABEL_OFFSET));

    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    link
      .attr("d", lineData);
    // link.call(updateLink);
  };
}

// args
// {
//  links: links,
//   node: node,
//   selectedNode: selectedNode,
//   linkedByIndex: linkedByIndex
// }
function contextView(props) {
  // props.selectedNode.fixed = true;
  console.log("contextView props", props);
  var edges = [];
  var nbs = [];
  var sumRadius = 0;
  props.selectedNode.values.forEach(d => {
    edges.push({
      id: props.selectedNode.index + d.index,
      source: props.selectedNode,
      target: d
    });
      d.dim = props.selectedNode.dim + 1;
      nbs.push(d);
      // numberNodes = 2 * Math.PI * d.radOffset / d.radius;
      sumRadius += d.radius + NODE_PADDING;
      console.log("dim", d.dim);
  });
  console.log(props.selectedNode.values);
  // props.node.data().forEach(d => {
  //   if (props.linkedByIndex.isConnected(props.selectedNode, d) && !d.selected) {
  //     edges.push({
  //       id: props.selectedNode.index + d.index,
  //       source: props.selectedNode,
  //       target: d
  //     });
  //     d.dim = props.selectedNode.dim + 1;
  //     nbs.push(d);
  //     // numberNodes = 2 * Math.PI * d.radOffset / d.radius;
  //     sumRadius += d.radius + NODE_PADDING;
  //     console.log("dim", d.dim);
  //   }
  // });

  console.log("nbs", nbs);

  props.selectedNode.values.forEach((d, i) => {
    // crazy formula, I know
    d.angle = props.selectedNode.angle - (sumRadius / (d.dim*2))
              + ((i * (d.radius + NODE_PADDING)) / d.dim );
  });

  var link = d3.select("#vis svg").selectAll(".link")
      .data(edges, d => d.source.index + "-" + d.target.index);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link")
      .style("stroke-width", () => { return 5; })
      .style("stroke", () => 20);

  force.links(edges);

  force.on("tick", tickContextView(props.node, link, props.width,
                                   props.height));
  // force.on("end", () => nbs.forEach(d => d.fixed));


  // node.selectAll("circle").style("opacity", 0);
  // neighbor.selectAll("path").style("fill", "green");

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

  var arc = d3.svg.arc()
    .innerRadius(d => d.radius )
    .outerRadius(d => d.radius + LABEL_OFFSET)
    .startAngle(0)
    .endAngle(2 * Math.PI);

  console.log("force", force);
  // TODO: fix ID issue
  var node = svg.selectAll("g.group")
                .data(props.data.nodes, d => d.name);

  // TODO: important
  var group = node
    .enter()
    .append("g")
    .attr("class", "group");

  // group.append("circle")
  //   .attr("class", "node")
  //   .attr("r", d => d.radius)
  //   .style("opacity", 1)
  //   .style("fill", d => color2(d.radius));
    // .call(force.drag);

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
    .attr("d", arc)
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


  force.on("tick", defaultTick(node, props.width, props.height));

  console.log("node", node);

  node
    .on("click", function(d) {
      if (!d.selected) {
        // d.fixed = true;
        d.selected = true;
        // d3.select(this).select("path").style("fill", "blue");
        props.selectedNode = d;
        props.view = "contextView";
      }
      else {
        props.view = "overview";
      }
      update(props);
    })
    .on("mouseover", function() { });

  switch (props.view) {
    case "contextView":
      contextView({
        links:         props.data.links,
        node:          node,
        selectedNode:  props.selectedNode,
        linkedByIndex: props.linkedByIndex,
        width:         props.width,
        height:        props.height
      });
      break;

    default: console.log("overview");
  }

  node.exit()
      .remove();

  // d3.selectAll("path.dbar").data([]).exit().remove();
  // d3.selectAll(".label").data([]).exit().remove();

  force.start();

  // node.style("opacity", d => d.selected ? 1 : 0.5);

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
  props.data.nodes.forEach(d => {
    d.dim = 1;
    d.radius = NODE_RAD;
    d.values = [];
    // d.group = parseInt(d.group) % 4;
  });

  props.data.nodes.forEach(d => {
    props.data.nodes.forEach(e => {
      if (props.linkedByIndex.isConnected(d, e) && !d.selected) {
        d.values.push(e);
      }
    });
  });
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
  console.log("groups", props.data.nodes);

  //TODO: props to include as arg
  d3.select(el).append("svg")
    // .attr("id", "pf")
    .attr("width", props.width)
    .attr("height", props.height);

  force.size([props.width, props.height]);

  this.update(props);

};

d3ggLayout.update = update;


export default d3ggLayout;
