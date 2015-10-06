import React from "react";
import Graph from "./components/Graph";

require("./style/style.less");

var App = React.createClass({
  render: function() {
    return (
      <div className="container">
        <div className="col-md-12">
          <h1>reduced Graph</h1>
        </div>
        <Graph />
      </div>
    );
  }
});

export default App;
