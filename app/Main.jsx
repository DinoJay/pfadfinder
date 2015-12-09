import React from "react";
import Graph from "./components/Graph";
import _ from "lodash";

import Timeline from "./components/Timeline";
import CircleMenu from "./components/CircleMenu";
import Legend from "./components/Legend";

var data = require("json!./data/data3.json");

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
      path: [],
      data: data
    };
  },

  getPath: function(path) {
    var pathCopy = _.cloneDeep(path);
    pathCopy.forEach(d => d.fixed = false);
    this.setState({path: pathCopy});
  },

  getDocKind: function(docKind) {
    this.setState({docKind: docKind});
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
      <div id="cont">
        <CircleMenu
          width={this.state.width}
          height={this.state.height}
          diameter={100}
          getDocKind={this.getDocKind}
        />
        <Graph
          width={this.state.width}
          height={this.state.height}
          data={data}
          margin={this.props.margin}
          getPath={this.getPath}
          filter={this.state.docKind}
        />
        <Legend/>
        <Timeline data={this.state.path} />
      </div>
    );
  }
});

export default App;
