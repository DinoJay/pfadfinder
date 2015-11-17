import React from "react";
import d3Timeline from "../lib/d3Timeline.js";

var linkedByIndex = new function() {
  return {
    index: {},
    nodes: [],
    init: function(nodes, links) {
      links.forEach(d => this.index[d.source + "," + d.target] = d);
      this.nodes = nodes;
      return this;
    },
    isConnected: function(a, b, type) {
        // var isEdge0 =  (this.index[a.index + "," + b.index]
        //     && this.index[a.index + "," + b.index].values.indexOf(type));
        var isEdge1 = (this.index[b.index + "," + a.index]
                      && this.index[b.index + "," + a.index].values.indexOf(type));
        return  isEdge1;
    },
    nbs: function(a, type) {
      // TODO: BUG!
      return this.nodes.filter(b => {
        var isEdge0 =  (this.index[a.index + "," + b.index]
            && this.index[a.index + "," + b.index].values.indexOf(type));
        var isEdge1 = (this.index[a.index + "," + b.index]
                      && this.index[a.index + "," + b.index].values.indexOf(type));
        return isEdge0 || isEdge1;
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

var Timeline = React.createClass({
  getDefaultProps: function() {
    return {
      width: 600,
      height: 2000,
      margin: {
        left: 40,
        right: 40,
        top: 0,
        bottom: 0
      },
      initData: [],
      selected: [],
      view: "overview",
      initDataType: "datatype"
    };
  },

  // getInitialState: function() {
  // },

  componentDidMount: function() {
    var el = this.getDOMNode();
    console.log("Timeline component did mount",
                { ...this.props, ...this.state});
    d3Timeline.create(el, { ...this.props, ...this.state});
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
    console.log("Timeline component Update", { ...this.props, ...this.state});
    // TODO: anti pattern
    this.props.data.forEach(d => d.date = new Date(d.createdDate));

    d3Timeline.update(el, { ...this.props, ...this.state});
  },

  // componentWillUnmount: function() {
  //   var el = this.getDOMNode();
  //   //d3BubbleCloud.destroy(el);
  // },

  render: function() {
    return (
      <div id="timeline-cont"></div>
    );
  }
});

export default Timeline;
