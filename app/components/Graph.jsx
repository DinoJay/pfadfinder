import React from "react";
import d3ggLayout from "../lib/d3ggLayout.js";
// import _ from "lodash";

var linkedByIndex = new function() {
  return {
    index: {},
    nodes: [],
    init: function(nodes, links) {
      links.forEach(d => this.index[d.source + "," + d.target] = d);
      this.nodes = nodes;
      return this;
    },
    // nbs: function(a, type) {
    //   // console.log("linkedByIndex", this.nodes, "Index", this.index);
    //   return this.nodes.filter(b => {
    //     return (this.index[a.i + "," + b.i] #<{(| || this.index[a.i + "," + b.i] |)}>#);
    //         // && this.index[a.index + "," + b.index].values.indexOf(type));
    //   });
    // },
    nbs: function(a) {
      return this.nodes.filter(b => {
        var isEdge0 = this.index[a.i + "," + b.i] && a.i !== b.i;
        // var isEdge1 = this.index[b.index + "," + a.index] || a.index !== b.index;
        return isEdge0; //|| isEdge1;
      });
    }
  };
};
var Graph = React.createClass({
  getDefaultProps: function() {
    return {
      width: 1350,
      height: 500,
      margin: {
        left: 40,
        right: 40,
        top: 40,
        bottom: 0
      },
      data: [],
      path: [],
      filter: null
    };
  },

  getInitialState: function() {
    var documents = this.props.data.documents.map((d, i) => {
      // important
      d.i = i;
      d.dim = 1;
      d.offset = 0;
      return d;
    });

    console.log("documents", documents);

    var initDocs;
    if (this.props.filter) {
      initDocs = documents.filter(d => d.datatype === this.props.filter);
    } else initDocs = documents;

    return {
      linkedByIndex: linkedByIndex.init(initDocs, this.props.data.links),
      initData: initDocs
    };
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3ggLayout.create(el, { ...this.props, ...this.state});
  },

  render: function() {
    return (
      <div id="vis-cont"></div>
    );
  }
});

export default Graph;
