import React from "react";
import Graph from "./components/Graph";
import Timeline from "./components/Timeline";

import CircleMenu from "./components/CircleMenu";

// var data = require("json!./miserables.json");
var data = require("json!./data/data_30_10.json");

require("./style.less");

var App = React.createClass({

  getDefaultProps: function() {
    return {
      widthTotal: 1400,
      heightTotal: 1000,
      margin: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      data: []
    };
  },

  getInitialState: function() {
    return {
      width: ( this.props.widthTotal - this.props.margin.left
              - this.props.margin.right ),
      height: (this.props.heightTotal - this.props.margin.top
               - this.props.margin.bottom),
      view: "overView",
      CircleMenuState: null,
      path: []
    };
  },

  getPath: function(path) {
    console.log("getPath", path);
    // TODO: hack
    path.forEach(d => d.fixed = false);
    this.setState({path: path});
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
    console.log("state MAIN", this.props.state);

    return (
      <div id="cont">
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
          initDataType={"datatype"}
          getPath={this.getPath}
        />
        <Timeline data={this.state.path} />
      </div>
    );
  }
});

export default App;
