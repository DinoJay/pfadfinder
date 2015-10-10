import React from "react";
import Graph from "./components/Graph";

var data = require("json!./miserables.json");

require("./style/style.less");

var App = React.createClass({

  getInitialState: function () {
      return { view: "overView" };
  },

  changeView: function () {
    console.log("state", this.state.view);
    if (this.state.view === "overView") this.setState({view: "recapView"});
    else this.setState({view: "overView"});
  },

  render: function() {
    console.log("state", this.state.view);
    return (
      <div>
        <div className="container">
          <div className="row">
            <h1 className="page-header">reduced Graph</h1>
          </div>
          <div className="row">
            <button onClick={this.changeView} type="button"
              className="btn btn-default">
              RecapView
            </button>
          </div>
          <div className="row">
          </div>
        </div>
        <Graph data={data} view={this.state.view}/>
      </div>
    );
  }
});

export default App;
