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
      return this.index[a.index + "," + b.index] ;//|| this.index[a.index + "," + b.index];
    },
    isConnected2: function(a, b, type) {
      var isEdge0 =  (this.index[a.index + "," + b.index]
          && this.index[a.index + "," + b.index].values.indexOf(type));
      var isEdge1 = (this.index[a.index + "," + b.index]
                    && this.index[a.index + "," + b.index].values.indexOf(type));
      return isEdge0 || isEdge1;
    },
    nbs: function(a, type) {
      return this.nodes.filter(b => {
        var isEdge0 =  (this.index[a.index + "," + b.index]
            && this.index[a.index + "," + b.index].values.indexOf(type));
        var isEdge1 = (this.index[a.index + "," + b.index]
                      && this.index[a.index + "," + b.index].values.indexOf(type));
        return isEdge0 || isEdge1;

      });
    },
    nbs0: function(a) {
      return this.nodes.filter(b => {
        var isEdge0 =  this.index[a.index + "," + b.index];
        var isEdge1 = this.index[a.index + "," + b.index];
        return isEdge0 || isEdge1;
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
      view: "overview",
      initDataType: "datatype"
    };
  },

  getInitialState: function() {
    return {
      linkedByIndex: linkedByIndex.init(this.props.data.documents,
                                        this.props.data.links)
    };
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3ggLayout.create(el, { ...this.props, ...this.state});
  },

  // componentDidUpdate: function() {
  //   var el = this.getDOMNode();
  //   console.log("component Update");
  //   d3ggLayout.update(el, { ...this.props, ...this.state});
  // },

  // componentWillUnmount: function() {
  //   var el = this.getDOMNode();
  //   //d3BubbleCloud.destroy(el);
  // },

  render: function() {
    console.log("state Graph", this.state);
    console.log("props Graph", this.props);
    return (
      <div id="vis-cont"></div>
    );
  }
});

export default Graph;
