import React from "react";
import Graph from "./components/Graph";

import CircleMenu from "./components/CircleMenu";

var data = require("json!./miserables.json");

require("./style.less");

var App = React.createClass({

  getDefaultProps: function() {
    return {
      widthTotal: 1400,
      heightTotal: 800,
      margin: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      data: [],

    };
  },

  getInitialState: function() {
    return {
      width: ( this.props.widthTotal - this.props.margin.left
              - this.props.margin.right ),
      height: (this.props.heightTotal - this.props.margin.top
               - this.props.margin.bottom),
      view: "overView",
      CircleMenuState: null
    };
  },

  // changeView: function () {
  //   console.log("state", this.state.view);
  //   switch(this.state.view) {
  //   case "overView":
  //     this.setState({view: "recapView"});
  //     break;
  //   case "recapView":
  //     this.setState({view: "worldView"});
  //     break;
  //   default:
  //     this.setState({view: "overView"});
  //   }
  // },

  render: function() {

    return (
      <div className="cont">
        {/* <h1 className="page-header">reduced Graph</h1> */}
        <CircleMenu
          width={this.state.width}
          height={this.state.height}
          diameter={100}
        />
        <Graph
          width={this.state.width}
          height={this.state.height}
          data={data}
          view={this.state.view}
          margin={this.props.margin}
          initDataType={"group"}
        />
      </div>
    );
  }
});

export default App;
