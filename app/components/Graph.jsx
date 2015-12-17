import React from "react";
import d3ggLayout from "../lib/d3ggLayout.js";
// import _ from "lodash";

var linkedByIndex = new function() {
  return {
    index: {},
    nodes: [],
    init: function(nodes, links) {
      links.forEach(l => this.index[l.source + "," + l.target] = l);
      this.nodes = nodes;
      return this;
    },
    nbs: function(a, type) {
      var nbs = [];
      this.nodes.forEach(b => {
        if (a.i !== b.i && this.index[a.i + "," + b.i]) {
          b.linkedBy = this.index[a.i + "," + b.i];
          if (b.linkedBy.type === type) nbs.push(b);
          else if (!type) nbs.push(b);
        }
      });
      return nbs;
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
      filter: null
    };
  },

  getInitialState: function() {
    var documents = this.props.data.documents.map((d, i) => {
      // important
      d.i = i;
      d.dim = 1;
      d.offset = 0;
      return d;
    });


    console.log("FILTER", this.props.filter);
    var initDocs;
    if (this.props.filter) {
      initDocs = documents
                    .filter(d => d.datatype === this.props.filter)
                    .slice(0, 40);

    } else initDocs = documents;//;.slice(0, 40);

    return {
      linkedByIndex: linkedByIndex.init(initDocs, this.props.data.links),
      // TODO: fix later
      data: initDocs,
      that: null
    };
  },


  componentDidUpdate: function() {
    // if (this.props.filter) {
    //   var docs = this.state.data.filter(d => d.kind === this.props.filter);
    //   var links = linkedByIndex.init(docs, this.props.data.links);
    //   // TODO: join to props
    //   d3ggLayout.update(this.props,
    //                     {
    //                       linkedByIndex: links,
    //                       data: docs,
    //                       nbs: []
    //                     },
    //                     this.state.that);
    // }
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    var props = Object.assign(this.props, this.state);
    d3ggLayout.create(el, props);
  },

  render: function() { return (
      <div id="vis-cont">
      </div>
    );
  }
});

export default Graph;
