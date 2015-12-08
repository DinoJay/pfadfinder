import React from "react";
import d3Timeline from "../lib/d3Timeline.js";

var Timeline = React.createClass({
  getDefaultProps: function() {
    return {
      width: 300,
      height: 2000,
      margin: {
        left: 40,
        right: 40,
        top: 0,
        bottom: 0
      }
    };
  },

  getInitialState: function() {
    return {data: []};
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3Timeline.create(el, this.props);
    d3Timeline.update(el, this.props, this.state.data);
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();

    var data = this.props.data.map(d => {
      d.date = new Date(d.createdDate);
      d.metatype = "doc";
      return d;
    });

    d3Timeline.update(el, this.props, data);
  },

  render: function() {
    return (
      <div id="timeline-cont" className="scroll-wrapper"></div>
    );
  }
});

export default Timeline;
