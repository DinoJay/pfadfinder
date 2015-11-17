export function makeEdges(stack) {
  var edges = [];
  var c = stack.length;
  while(stack.length > 1) {
    var target = stack.pop();
    var edge  = {
      id: stack[stack.length - 1].id + "-" + target.id,
      counter: c--,
      source: stack[stack.length - 1],
      target: target,
      value: 5,
      type: target.connectedByType
    };
    edges.push(edge);
  }
  // edges.sort(d => d.counter);

  return edges;
}
