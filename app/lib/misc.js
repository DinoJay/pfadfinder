import d3 from "d3";

export function makeEdges(stack) {
  var edges = [];
  var c = stack.length;
  while(stack.length > 1) {
    var target = stack.pop();
    var source = stack[stack.length - 1];
    var edge  = {
      id: source.id + "-" + target.id,
      counter: c--,
      source: stack[stack.length - 1],
      target: target,
      type: target.linkedBy.type,
      value: target.linkedBy.value
    };
    /* console.log("EDGE", edge) */
    edges.push(edge);
  }

  return edges;
}

export function getDepth(obj) {
    var depth = 0;
    if (obj.children) {
        obj.children.forEach(function (d) {
            var tmpDepth = getDepth(d);
            if (tmpDepth > depth) {
                depth = tmpDepth;
            }
        });
    }
    return 1 + depth;
}

export var relationColors = {
  "Authorship": "rgb(93, 199, 76)",
  "Keyword": "rgb(223, 199, 31)",
  "Task": "rgb(234, 118, 47)"
};


export var sourceColors = {
  "Digital": "Blue",
  "Physical": "#000000"
};

export const facets = ["Keyword", "Authorship", "Task"];

export var DOC_URL = "https://cdn4.iconfinder.com/data/icons/flat-icon-set/128/"
              + "flat_icons-graficheria.it-11.png";
export var EMAIL_URL = "https://cdn0.iconfinder.com/data/icons/social-icons-20/200"
                + "/mail-icon-128.png";

export var CALENDAR_URL = "https://cdn1.iconfinder.com/data/icons/education-colored-"
                   +"icons-vol-3/128/145-128.png";

export var NOTE_URL = "evernoteIcon.png";

