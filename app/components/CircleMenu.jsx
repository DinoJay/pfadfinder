import React from "react";

var CircleMenu = React.createClass({

  getDefaultProps: function() {
    return {
      width: 800,
      height: 800,
      diameter: 100
    };
  },

  getInitialState: function () {
    return {
      style: {
        left: ((this.props.width / 2) - this.props.diameter / 2) + "px",
        top: ((this.props.height / 2) - this.props.diameter / 2) + "px",
        width: this.props.diameter,
        height: this.props.diameter
      }
    };
  },

  clickHandler: function (e) {
    e.preventDefault();
    console.log("event", e);
  },

  render: function() {
    return (
      <input type="checkbox" id="menu_opener_id" className="menu_opener">
        <label htmlFor="menu_opener_id"
          className="menu_opener_label"
          style={this.state.style}/>
      </input>
    );
  }
});

export default CircleMenu;
