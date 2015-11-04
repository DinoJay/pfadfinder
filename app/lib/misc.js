export function makeEdges(stack) {
  var edges = [];
  while(stack.length > 1) { var target = stack.pop();
    var edge  = {
      id: stack[stack.length - 1] + "-" + target,
      source: stack[stack.length - 1],
      target: target,
      value: 5
    };
    edges.push(edge);
  }
  return edges;
}
