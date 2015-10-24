import React from "react";
import d3ggLayout from "../lib/d3ggLayout.js";

var linkedByIndex = new function() {
  return {
    index: {},
    init: function(links) {
      links.forEach(d => this.index[d.source + "," + d.target] = true);
      return this;
    },
    isConnected: function(a, b) {
        return this.index[a.index + "," + b.index] || this.index[b.index + "," + a.index];
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
      view: "overview",
      initDataType: "group"
    };
  },

  getInitialState: function() {
    return {
      linkedByIndex: linkedByIndex.init(this.props.data.links)
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
    return (
      <div id="vis"></div>
    );
  }
});

export default Graph;
