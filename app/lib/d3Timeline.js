import d3 from "d3";
import moment from "moment";
// import _ from "lodash";

import {
  makeEdges,
  relationColors,
  DOC_URL,
  EMAIL_URL,
  CALENDAR_URL } from "./misc.js";

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

// function collide(data, alpha, padding) {
//   var quadtree = d3.geom.quadtree(data);
//   return function(d) {
//       var r = d.radius + padding,
//           // nx1 = d.x - r,
//           // nx2 = d.x + r,
//           ny1 = d.y - r,
//           ny2 = d.y + r;
//       quadtree.visit(function(quad, x1, y1, x2, y2) {
//         if (quad.point && (quad.point !== d)) {
//           var y = d.y - quad.point.y,
//               l = Math.abs(y),
//               r = d.radius + padding + quad.point.radius;
//
//           if (l < r) {
//             l = (l - r) / l * alpha;
//             d.y -= y *= l;
//             quad.point.y += y;
//           }
//         }
//         return y1 > ny2 || y2 < ny1;
//     });
//   };
// }
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

// function pushAxis(d, posY, posX, alpha, energy) {
//     var affectSize = alpha * energy;
//     d.y += (posY - d.y) * affectSize;
//     d.x += (posX - d.x) * affectSize;
// }

function tick(detailBox, link, linkContainer, width) {
  return function(e) {
    // detailBox.each((d, i) => pushAxis(d, yScale(d.title), width/2, e.alpha, 0.5));
    detailBox.each((d, i) => {
      var affectSize = e.alpha * 0.5;
      // TODO: fix calculation
      d.y += (i * 600 - d.y) * affectSize;
      d.x += (width/2 - d.x) * affectSize;
    });

    linkContainer.each(d => {
        var centerY = d.source.y2() + ((d.target.y - d.source.y2()) / 2) - d.height / 2 ;
        var centerX = d.source.x + d.source.width/2 - d.width/2  ;
        d.x = centerX;
        d.y = centerY;
    });

    link.attr("d", d => {
      var sourceX =  d.source.centerX();
      var targetX = d.target.centerX();
      return "M" + sourceX + "," + d.source.y2()
              + " " + targetX + "," + d.target.y;
    });

    linkContainer
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

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
function update(el, props, data) {

  var nodes = data;
  var orgEdges = makeEdges(nodes.slice());
  var edges = [];

  console.log("orgEdges", orgEdges);

  orgEdges.forEach(e => {
    var s = e.source;
    var t = e.target;
    var i = {
      id: "inter" + s.id + t.id,
      metatype: "inter",
      source: s,
      target: t,
      type: e.type,
      value: e.value
    };

    nodes.push(i);

    edges.push({
      id: "start"+ s.id+i.id,
      source: s,
      target: i,
      type: e.type
    },
    {
      id: "end"+s.id+i.id,
      source: i,
      target: t,
      type: e.type
    });
  });

  console.log("nodes", nodes.filter(d => d.metatype === "inter"));
  // adjust height growth
  var height = nodes.filter(d => d.metatype === "doc").length * 400;
  var div = d3.select(el);

  div.select("svg")
     .attr("height", height);

  var svg = div.select("svg")
               .attr("height", height);

  // TODO: fix coord calculation
  // var yScale = d3.scale.ordinal()
  //     .domain(nodes.filter(d => d.type ==="doc").map(d => d.title))
  //     .rangeRoundBands([0, 600]);
      // .range([props.margin.top, props.margin.top + height]);


  this.force.nodes(nodes);
  this.force.links(edges);

  var detailBox = div.selectAll(".tooltip")
                     .data(nodes.filter(d => d.metatype === "doc"),
                           d => d.id+"detailBox");

  detailBox.enter()
    .call(function() {
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
        .attr("src", d => {
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
    });

  detailBox
    .select(".content").each(function(d){
      d.height = this.getBoundingClientRect().height;
      d.width = this.getBoundingClientRect().width;
      d.x2 = function() {
        return this.x + d.width;
      };
      d.y2 = function() {
        return this.y + d.height;
      };
      d.centerX = function() {
        return this.x + d.width / 2;
      };
  });


  var linkContainer = div.selectAll(".linkContainer")
    .data(nodes.filter(d => d.metatype === "inter"),
          d => "linkContainer" + d.id);

  linkContainer.enter()
    .call(function() {
      this
        .insert("div", ":first-child")
          .attr("class", "linkContainer")
        .append("div")
          .attr("class", "content")
        .append("div")
          .attr("class", "center")
          .style("background", d => relationColors[d.type])
          .style("transform", d => {
            var transformX;
            switch (d.value.length) {
              case 1:
                transformX = 200;
                break;
              case 2:
                transformX = 75;
                break;
              case 3:
                transformX = 25;
                break;
              case 4:
                transformX = 10;
                break;
              default:
                transformX = 75;
            }
            return "translate(-50%," + transformX + "%)";
          })
          .text(d => d.value.join(", "));
    });

  linkContainer
    .select(".content").each(function(d){
      d.height = this.getBoundingClientRect().height;
      d.width = this.getBoundingClientRect().width;
      d.x2 = function() {
          return this.x + d.width;
      };
      d.y2 = function() {
          return this.y + d.height;
      };
      d.centerX = function() {
          return this.x + d.width / 2;
      };
  });

  var link = svg.selectAll(".link-detail")
      .data(edges, d => d.id);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link-detail")
    .attr("id", d => "linkId_" + d.id)
    .style("stroke", 20)
    .attr("marker-end", "url(#end)");

  var linkLabel = svg.selectAll(".linkLabel")
    .data(this.force.links(), d => "label" + d.id);

  linkLabel.enter()
    .call(function() {
      this
        .append("g")
        .append("text")
          .attr("class","linkLabel")
          .attr("dx", -5)
          .attr("dy", 20)
          .style("fill", "DarkSlateGray")
        .append("textPath")
          .attr("xlink:href", d => "#linkId_" + d.id)
          .attr("transform", "rotate(-90)")
          .attr("startOffset", "10%")
          .style("text-anchor", "start")
        .text(d => d.type);
    });

  // build the arrow.
  svg.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
    .enter()
    .call(function() {
      this
        .append("svg:marker")    // This section adds in the arrows
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
    });

  this.force.on("tick", tick(detailBox, link, linkContainer, props.width));

  detailBox.exit().remove();
  link.exit().remove();
  linkLabel.exit().remove();
  linkContainer.exit().remove();

  this.force.start();
}

function create(el, props) {
  d3.select(el)//.select("#timeline-cont")
    .append("svg")
      .attr("width", props.width);
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

    create: create
  };
};

export default d3Timeline;
