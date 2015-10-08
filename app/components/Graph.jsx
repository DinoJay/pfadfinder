import React from "react";
import d3ggLayout from "../lib/d3ggLayout.js";

var Graph = React.createClass({
  getDefaultProps: function() {
    return {
      data: [],
      view: "overview"
    };
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3ggLayout.create(el, this.props);
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
    console.log("component Update");
    d3ggLayout.update(el, this.props);
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
