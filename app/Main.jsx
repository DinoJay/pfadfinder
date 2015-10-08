import React from "react";
import Graph from "./components/Graph";

var data = require("json!./miserables.json");

require("./style/style.less");

var App = React.createClass({

  getInitialState: function () {
      return { view: "overView" };
  },

  changeView: function () {
    this.setState({view: "recapView"});
  },

  render: function() {
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
