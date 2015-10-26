import React from "react";
import d3ggLayout from "../lib/d3ggLayout.js";

var linkedByIndex = new function() {
  return {
    index: {},
    nodes: [],
    init: function(nodes, links) {
      links.forEach(d => this.index[d.source + "," + d.target] = d);
      this.nodes = nodes;
      return this;
    },
    isConnected: function(a, b) {
      return ( this.index[a.index + "," + b.index]
        || this.index[b.index + "," + a.index] );
    },
    nbs: function(a) {
      return this.nodes.filter(b => {
        return ( this.index[a.index + "," + b.index]
          || this.index[b.index + "," + a.index] );
      });
    }
    // getEdges: function(a) {
    //   return this.nodes.map(b => {
    //     var edge = (this.index[a.index + "," + b.index]
    //       || this.index[b.index + "," + a.index]);
    //       if (edge) return this.nodes[edge.target];
    //   }).filter(d => d);
    // }
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
      selected: [],
      view: "overview",
      initDataType: "group"
    };
  },

  getInitialState: function() {
    var nodes = this.props.data.nodes.map((d, i) => {
      d.index = i;
      return d;
    });

    return {
      linkedByIndex: linkedByIndex.init(nodes, this.props.data.links)
    };
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3ggLayout.create(el, { ...this.props, ...this.state});
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
    console.log("component Update");
    d3ggLayout.update(el, { ...this.props, ...this.state});
  },

  // componentWillUnmount: function() {
  //   var el = this.getDOMNode();
  //   //d3BubbleCloud.destroy(el);
  // },

  render: function() {
    console.log("state Graph", this.state);
    console.log("props Graph", this.props);
    return (
      <div id="vis"></div>
    );
  }
});

export default Graph;
