import React from "react";
import d3 from "d3";
import "d3-svg-legend";
import _ from "lodash";

import {
  relationColors,
  sourceColors,
  DOC_URL,
  EMAIL_URL,
  NOTE_URL
} from "../lib/misc";

function relationTypeLegend(el) {
  var ordinal = d3.scale.ordinal()
    .domain(["Author", "Keyword", "Task"])
    .range(_.values(relationColors));

  var svg = d3.select(el).select("#rel-leg")
    .append("svg")
    .attr("width", 100)
    .attr("height", 100);

  svg.append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", "translate(20,20)");

  var legendOrdinal = d3.legend.color()
    .shape("path", d3.svg.symbol().type("circle").size(400)())
    .shapePadding(10)
    .scale(ordinal);

  svg.select(".legendOrdinal")
    .call(legendOrdinal);
}


function sourceLegend(el) {
  var ordinal = d3.scale.ordinal()
    .domain(["Digital", "Physical"])
    .range(_.values(sourceColors));

  var svg = d3.select(el).select("#source-leg")
    .append("svg")
    .attr("height", 100)
    .attr("width", 100);

  svg.append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", "translate(20,20)");

  var legendOrdinal = d3.legend.color()
    .shape("path", d3.svg.symbol().type("circle").size(400)())
    .shapePadding(10)
    .scale(ordinal);

  svg.select(".legendOrdinal")
    .call(legendOrdinal);
}

function picLegend(el) {
  var ordinal = d3.scale.ordinal()
    .domain(["Publication", "Email", "Note"])
    .range([0, 33, 66]);

  var svg = d3.select(el).select("#doc-leg")
    .append("svg")
    .attr("width", 130)
    .attr("height", 100);

  var cont = svg.append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", "translate(20,8)");

  var iconCont = cont.selectAll(".icon")
      .data(["Publication", "Email", "Note"])
      .enter()
      .append("g");

  iconCont.append("svg:image")
      .attr("xlink:href", d => {
        switch (d) {
          case "Publication":
            return DOC_URL;
          case "Email":
            return EMAIL_URL;
          case "Note":
            return NOTE_URL;
        }
      })
      .attr("height", 23)
      .attr("width", 23)
      .attr("x", "0")
      .attr("y", d => ordinal(d));

  iconCont.append("text")
    .text(d => d)
    .attr("class", "label")
    .attr("transform", d => "translate(34," + ( 15 + ordinal(d) ) + ")");

}

var Legend = React.createClass({

  componentDidMount: function() {
    var el = this.getDOMNode();
    relationTypeLegend(el);
    sourceLegend(el);
    picLegend(el);
  },

  render: function() {
    return (
      <div id="legends">
        <div id="rel-leg">
          <h3>Facets</h3>
        </div>
        <div id="doc-leg">
          <h3>Types</h3>
        </div>
        <div id="source-leg">
          <h3>Source</h3>
        </div>
      </div>
    );
  }
});

export default Legend;
