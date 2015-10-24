
function recapView({node: node, links: links}) {

  // for artifical nodes for rounded links
  var tmpNodes = node.data().slice();
  var tmpLinks = [];
  var bilinks = [];

  links.forEach(function(link) {
    var s = tmpNodes[link.source],
        t = tmpNodes[link.target],
        // intermediate node
        i = {type: "tmp", group: (s.group + t.group) / 2 };

    if (s.group !== t.group) {
      tmpNodes.push(i);
      tmpNodes.push({source: s, target: i}, {source: i, target: t});
      bilinks.push([s, i, t]);
    }
  });

  console.log("recapView", force.links());

  force.links(tmpLinks);
  force.nodes(tmpNodes);

  var groups = d3.nest()
                 .key(d => d.group)
                 .entries(node.data());
  // used to scale node index to x position
  var xScale = d3.scale.linear()
      .domain([0, groups.length])
      .range([margin.left, margin.left + width]);

  var link = d3.select("#vis svg").selectAll("path.link")
    .data(bilinks);

  link
    .enter()
    .append("path")
    .attr("class", "link");

  var label = d3.select("#vis svg").selectAll(".group-label")
    .data(groups, d => d.key);

  label
    .enter()
    .append("text")
    .attr("class", "group-label")
    .attr("text-anchor", "middle")
    .attr("x", d => xScale(d.key))
    .attr("y", 250)
    .text(d => d.key);

  force
    .charge(0)
    // .charge(d => - Math.pow(d.radius, 1.5))
    // .size([0, 0])
    .gravity(0)
    // .friction(0.6)
    .linkStrength(0)
    // TODO
    .on("tick", tickRecapView(force.nodes(), node, link, groups, xScale));

    label.exit()
         .remove();

    link.exit()
        .remove();

  d3.selectAll("*").on("click", d => console.log(d));
}

function tickRecapView(nodes, node, link, groups, xScale) {

  return function(e) {
    nodes.forEach((d, i) => pushAxis(d, i, xScale, e.alpha, 0.5));
    node.each(collide(node.data(), 0.1, -8));

    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    link.attr("d", function(d) {
          return "M" + d[0].x + "," + d[0].y
              + "S" + d[1].x + "," + d[1].y
              + " " + d[2].x + "," + d[2].y;
    });
    d3.select("#vis svg").selectAll("path.hull")
      .data(groups)
        .attr("d", groupPath)
      .enter().append("path")
        .attr("class", "hull")
        .style("fill", groupFill)
        .style("stroke", groupFill)
        .style("stroke-width", 40)
        .style("stroke-linejoin", "round")
        .style("opacity", .2)
        .attr("d", groupPath);
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

function worldView({node: node, links: links}) {
  var svg = d3.select("#vis svg");

  var pointScale = d3.scale.sqrt().domain([0, 80]).range([0, 75]);
  var pixelLoc = d3.geo.mercator()
                       .scale(400)
                       .translate([480, 500]);

  // var proj = d3.geo.mercator()
  //                      // .scale(400)
  //                      .translate([480, 500]);

  var xs = [];
  var ys = [];

  for (var alias in coordinates) {
    xs.push(coordinates[alias][0]);
    ys.push(coordinates[alias][1]);
  }

  var minX = d3.min(xs);
  var maxX = d3.max(xs);

  console.log("minX", minX, "maxX", maxX);

  var xScale = d3.scale.linear().domain([minX, maxX])
                 .range([-50, -24]);
                 // .clamp(true);
                 // .range([margin.left, margin.left + width]);

  var minY = d3.min(ys);
  var maxY = d3.max(ys);

  var yScale = d3.scale.linear().domain([minY, maxY])
                 .range([-20, -12]);
                 // .clamp(true);
                 // .range([-margin.left, -(margin.left + width)]);

  console.log("xscale", xScale.range());
  console.log("yscale", yScale.range());

  var nodeCoords = {};
  node.data().forEach(d => {
    d.continent = getContinent(d.alias);
    d.coordinates = coordinates[d.alias];
    // map world coords to coords in svg
    d.cx = xScale(pixelLoc(d.coordinates)[0]);
    d.cy = yScale(pixelLoc(d.coordinates)[1]);
    d.radius = 7;//pointScale(node.points);

    nodeCoords[d.alias] = coordinates[d.alias];

  });

  console.log("node data", node.data().length);

  var dumbNodes = [];
  for (var key in coordinates){
    if(!nodeCoords.hasOwnProperty(key)) {
      var cont = getContinent(key);
      dumbNodes.push({
        alias: key,
        continent: cont,
        coordinates: coordinates[key],
        cx: xScale(pixelLoc(coordinates[key])[0]),
        cy: yScale(pixelLoc(coordinates[key])[1]),
        radius: 7
      });
    }
  }

  var tmpNodes = node.data().concat(dumbNodes);

  console.log("tmpNodes", tmpNodes.length, "node data", node.data().length, "dumbNodes", dumbNodes.length);

  var circle = d3.select("#vis svg").selectAll("g.group1")
                .data(tmpNodes);

  var group = circle
    .enter()
    .append("g")
    .attr("class", "group1");

  group.append("circle")
    .attr("class", "node")
    .attr("r", d => d.radius)
    .style("opacity", 1)
    .style("fill", d => color2(d.radius))
    .call(force.drag);

  force
    .nodes(tmpNodes)
    .links([])
    .size([width, height])
    .charge(function(d) {
      - Math.pow(d.radius*5.0, 2.0) / 8;
    })
    .gravity(1.7);

    // svg.append("path")
    //    .datum(topojson.feature(world, world.objects.countries))
    //    .attr("d", d3.geo.path().projection(pixelLoc));

  // console.log("node.data 1", node.data());
  //
  // svg.selectAll(".group circle").attr("r", 20);

    // console.log("circle", circle);

  force.on("tick", tickWorldView(node, tmpNodes, pointScale));

  d3.selectAll("*").on("click", d => console.log(d));

}

function tickWorldView(node, tmpNodes, pointScale){

  d3.selectAll(".hull").remove();

  var continents = d3.nest()
                 .key(d => d.continent)
                 .entries(tmpNodes);

  return function(e) {

    var k = 10 * e.alpha;
    for (var i=0; i < tmpNodes.length; i++) {
      tmpNodes[i].x += k * tmpNodes[i].cx;
      tmpNodes[i].y += k * tmpNodes[i].cy;
    }


    node
       // .each(collide(.1, node.data(), pointScale))
       // .each(collide(tmpNodes, 0.1, 0))
       // .attr("cx", d => d.x)
       // .attr("cy", d => d.y)
       .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    // svg.selectAll("text")
    //    .attr("x", function(node) { return node.x; })
    //    .attr("y", function(node) { return node.y+5; })
    //    .attr("opacity", function(node) {
    //      if (node.radius < 17) {
    //        return 0;
    //      }
    //      return 1;
    //    });
    d3.select("#vis svg").selectAll("path.hull")
      .data(continents)
        .attr("d", groupPath)
      .enter().append("path")
        .attr("class", "hull")
        .style("fill", groupFill)
        .style("stroke", groupFill)
        .style("stroke-width", 10)
        .style("stroke-linejoin", "round")
        .style("opacity", .2)
        .attr("d", groupPath);
  };
}

function bindToBorderBox(d) {
  d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
  d.y = Math.max(margin.top * 2 + d.radius * 2, Math.min(height - d.radius, d.y));
  // d.screenX = Math.max(d.radius, Math.min(width - d.radius, d.screenX));
  // d.screenY = Math.max(d.radius, Math.min(height - d.radius, d.screenY));
}

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

function getContinent(alpha3) {
  var alpha2 = countries.alpha3ToAlpha2(alpha3);
  if (!alpha2) {
    alpha2 = countries.alpha3ToAlpha2(convTable[alpha3]);
  }
  return continents[alpha2];
}

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

