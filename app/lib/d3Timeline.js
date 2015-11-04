import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

import { makeEdges } from "./misc.js";


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

function collideBox(data) {
    var quadtree = d3.geom.quadtree(data);
    return function(detailBox) {
      var nx1, nx2, ny1, ny2, padding;
      padding = 40;
      nx1 = detailBox.x - padding;
      nx2 = detailBox.x2() + padding;
      ny1 = detailBox.y - padding;
      ny2 = detailBox.y2() + padding;

      quadtree.visit(function(quad, x1, y1, x2, y2) {
          // var dx;
          var dy;
          if (quad.point && (quad.point !== detailBox)) {
              if (overlap(detailBox, quad.point)) {
                dy = Math.min(detailBox.y2() - quad.point.y,
                              quad.point.y2() - detailBox.y) / 2;
                detailBox.y -= dy;
                quad.point.y += dy;
              }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
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

// function pushAxis(d, yScale, alpha, energy) {
//
//     var affectSize = alpha * energy;
//     d.y += (yScale(d.date) - d.y) * affectSize;
// }

function tick(detailBox, yScale, link, width, height) {
  function lineData(d){
    var straightLine = d3.svg.line().interpolate("step-before")
            .x(d => d.x + 30)
            .y(d => d.y);

    var points = [
        {x: d.source.x, y: d.source.y},
        {x: d.target.x, y: d.target.y}
    ];
    return straightLine(points);
  }

  return function(e) {
    // detailBox.each(movePos(pos, alpha));
    link.attr("d", lineData);
    // detailBox.each(d => pushAxis(d, yScale, e.alpha, 0.5));
    detailBox.each(collideBox(detailBox.data()));

    detailBox
      .style("right", d => d.x + "px")
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
  if (props.data.length === 0) return;

  console.log("Timeline Update", props);

  var docs = props.data;
  docs.forEach(d => {
    // d.date = new Date(d.createdDate);
    d.x2 = function() {
        return this.x + 140;
    };
    d.y2 = function() {
        return this.y + 100;
    };
  });
  // docs.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log("sortedDocs", props.data.documents);

  var yScale = d3.scale.linear()
      .domain([0, docs.length])
      .range([props.margin.left, props.margin.left + props.width]);

  // var yScale = d3.time.scale()
  //       .domain(new Date(), new Date())
  //       .rangeRound([0, props.width - props.margin.left
  //                   - props.margin.right]);

  // if (docs.length > 0) yScale .domain(docs[0].date, docs.last().date);

  var div = d3.select(el);
  this.force.size([props.width, props.height]);
  this.force.nodes(docs);
  console.log("edges", makeEdges(docs.slice()));
  this.force.links(makeEdges(docs.slice()));

  console.log("links", this.force.links());

  // TODO: fix ID issue
  var detailBox = div.selectAll(".tooltip-right")
                .data(docs, d => d.id+"detailBox");

  detailBox.enter()
      .insert("div", ":first-child")
      .attr("class", "tooltip-right") // TODO
      .attr("id", (d, i) => d.id+"detailBox"+i)
      .style("opacity", 0.9)
    .append("span").text(d => d.title);

  detailBox
    .on("click", function(d) {
      console.log("click", d.date);
    })
    .on("mouseover", function() { });

  var link = d3.select(el).select("svg").selectAll(".link")
      .data(this.force.links(), d => d.source.title + "-" + d.target.title);

  link.style("stroke-width", d => d.value);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link")
    .style("stroke", 20);

  this.force.on("tick", tick(detailBox, yScale, link, props.width,
                             props.height));

  detailBox.exit()
      .remove();

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
      console.log("create Timeline", props);
      d3.select(el).append("svg")
        .attr("width", props.width)
        .attr("height", props.height);

      update(el, props);
    }
  };
};

export default d3Timeline;
