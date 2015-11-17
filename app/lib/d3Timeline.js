import d3 from "d3";
import moment from "moment";

import { makeEdges } from "./misc.js";


var DOC_URL = "https://cdn4.iconfinder.com/data/icons/flat-icon-set/128/"
              + "flat_icons-graficheria.it-11.png";
var EMAIL_URL = "https://cdn0.iconfinder.com/data/icons/social-icons-20/200"
                + "/mail-icon-128.png";
var CALENDAR_URL = "https://cdn1.iconfinder.com/data/icons/education-colored-"
                   +"icons-vol-3/128/145-128.png";

// const BOXWIDTH  = 140;
// const BOXHEIGHT = 40;

// misc
Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};
Array.prototype.last = function() {
    return this[this.length-1];
};

function collide(data, alpha, padding) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
      var r = d.radius + padding,
          // nx1 = d.x - r,
          // nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var y = d.y - quad.point.y,
              l = Math.abs(y),
              r = d.radius + padding + quad.point.radius;

          console.log("lr quadPoint", l, r, quad.point.radius);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.y -= y *= l;
            quad.point.y += y;
          }
        }
        return y1 > ny2 || y2 < ny1;
    });
  };
}

function overlap(a, b) {
    // return ( (a.x < b.x < a.x2() && a.y < b.y < a.y2()) || (a.x < b.x2() < a.x2() && a.y < b.y2() < a.y2()) );
    // TODO: understand
    var ref, ref1, ref2, ref3;
    return ((a.x < (ref = b.x) && ref < a.x2()) && (a.y < (ref1 = b.y) && ref1 < a.y2())) || ((a.x < (ref2 = b.x2()) && ref2 < a.x2()) && (a.y < (ref3 = b.y2()) && ref3 < a.y2()));
}


// function movePos(pos, alpha) {
//     return function(d) {
//         d.x = d.x + (pos.x - d.x) * (0.1 + 0.02) * alpha * 1.1;
//         d.y = d.y + (pos.y - d.y) * (0.1 + 0.02) * alpha * 1.1;
//     };
// }

function pushAxis(d, posY, posX, alpha, energy) {
    var affectSize = alpha * energy;
    d.y += (posY - d.y) * affectSize;
    d.x += (posX - d.x) * affectSize;
}

function tick(detailBox, yScale, link, linkText, width, height) {

  return function(e) {
    // detailBox.each(movePos(pos, alpha));
    detailBox.each((d, i) => pushAxis(d, yScale(i), width/2,
                                      e.alpha, 0.5));
    // detailBox.each(collide(detailBox.data(), e.alpha, 10));
    // link.attr("d", lineData);
    link.attr("d", d => {
      var sourceX, centerX, targetX;
      if ( d.counter % 2 === 0 ) {
          sourceX =  d.source.x;
          centerX = d.source.centerX() - 200;
          targetX = d.target.x;
       }
      else {
        sourceX =  d.source.x2();
        centerX = d.source.centerX() + 200;
        targetX = d.target.x2();
      }
      var centerY = (d.source.y2() + d.target.y)/2;

          return "M" + sourceX + "," + d.source.y2()
              + "S" + centerX + "," + centerY
              + " " + targetX + "," + d.target.y;
    });

    detailBox
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");
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
function update(el, props) {
  var onEnterDetailBox = function() {

    var container = this
      .insert("div", ":first-child")
        .attr("class", "tooltip")
      .append("span")
        .attr("class", "content");

      container.append("div")
        .attr("class", "title")
        .text(d => d.title);

    container
      .append("img")
      .attr("src", DOC_URL)
      .attr("class", "doc-pic")
      .text(d => d.title);

    var subcontent = container
      .append("div")
      .attr("class", "sub-content");

    subcontent
      .append("p")
      .attr("class", "authors")
      .append("span")
      .attr("class", "text-muted")
      .text("Authors: ");

    subcontent.select(".authors")
        .append("span")
        .text(d => d.authors.join(", "));

    subcontent
    .append("p")
    .attr("class", "keywords")
    .append("span")
    .attr("class", "text-muted")
    .text("Keywords: ");
    subcontent.select(".keywords")
    .append("span")
    .text(d => d.keywords ? d.keywords.join(", ") : null);

    subcontent
      .append("p")
      .attr("class", "date")
      .append("span")
      .attr("class", "text-muted")
      .text("Date: ");

    subcontent.select(".date")
      .append("span")
      .text(d => moment(d.date).format("MMMM Do YYYY, h:mm:ss a"));

    subcontent
      .append("p")
      .attr("class", "task")
      .append("span")
      .attr("class", "text-muted")
      .text("Tasks: ");

    subcontent.select(".task")
      .append("span")
      .text(d => d.tasks.join(", "));
  }

  if (props.data.length === 0) return;

  var nodes = props.data.slice();
  var edges = makeEdges(nodes.slice());

  var height = nodes.length * 500;
  var div = d3.select(el);

  div.select("svg")
      .attr("height", height);

  var svg = div.select("svg")
               .attr("height", height);

  var yScale = d3.scale.ordinal()
      .domain(d3.range(nodes.length))
      // .rangeRoundBands([0, 100], 200, 0);
      .rangeRoundBands([props.margin.top, props.margin.top + height], 0.4, 0);

  this.force.nodes(nodes);
  this.force.links(edges);

  // TODO: fix ID issue
  var detailBox = div.selectAll(".tooltip")
                .data(nodes, d => d.id+"detailBox");


  detailBox.enter()
    .call(onEnterDetailBox);

  detailBox.select("span").each(function(d){
    var height = this.getBoundingClientRect().height;
    var width = this.getBoundingClientRect().width;
    d.x2 = function() {
        return this.x + width;
    };
    d.y2 = function() {
        return this.y + height;
    };
    d.centerX = function() {
        return this.x + width / 2;
    };
  });

  var link = svg.selectAll(".link-detail")
      .data(edges, d => d.id);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link-detail")
    .attr("id",function(d) { return "linkId_" + d.id; })
    .style("stroke", 20)
    .attr("marker-end", "url(#end)");

  var linkText = svg.selectAll(".linkText")
    // TODO: update mechanism
    .data(this.force.links(), d => "label" + d.id);

  linkText.enter()
    .append("g")
    .append("text")
      .attr("class","linkText")
      .attr("dx", -5)
      .attr("dy", 20)
      .style("fill", "DarkSlateGray")
    .append("textPath")
      .attr("xlink:href",function(d) { return "#linkId_" + d.id;})
      .attr("transform", "rotate(-90)")
      .attr("startOffset", "25%")
      .style("text-anchor", "start")
    .text(d => d.type);


  // build the arrow.
  svg.append("svg:defs").selectAll("marker")
      .data(["end"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("markerWidth", 3)
      .attr("markerHeight", 3)
      .attr("orient", "auto")
      .style("fill", "DarkSlateGray")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  console.log("linkText", linkText.data());

  this.force.on("tick", tick(detailBox, yScale, link, linkText, props.width, props.height));

  detailBox.exit().remove();
  link.exit().remove();
  linkText.exit().remove();

  this.force.start();
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
const d3Timeline = new function(){
  return {
    force: d3.layout.force()
              .charge(0)
              .gravity(0.2)
              .friction(0.9)
              .linkDistance(0)
              .linkStrength(0),

    update: update,

    create: function(el, props) {
      d3.select(el)
      .append("svg")
        .attr("width", props.width);

      update(el, props);
    }
  };
};

export default d3Timeline;
