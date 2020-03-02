const WIDTH = 800; //-> ancho
const HEIGHT = 600; //-> altura

var canvas;

// Datos del select
var selectOptions;
var inputLine;
var button;
const LABEL = 'Enter value line';
const OPTIONS = ['Create node', 'Create edge', 'Start node', 'Finish node'];

// Manejo del nodo
const SIZE_NODE = 50;
var nodes = [];
var visitedNode = []; // -> Maneja los nodos que ya se visitaron

var nodeOne = undefined;
var nodeTwo = undefined;

const STATE_NODE = ['NORMAL', 'START', 'FINISH'];

function setup() {
  canvas = createCanvas(WIDTH, HEIGHT);
  canvas.mouseClicked(changeClick);

  textAlign(CENTER, CENTER);

  startInputs();
}

function draw() {
  background('#939494');

  // Draw lines
  const lines = nodes.flatMap(node => node.lines);
  lines.forEach(line => {
    line.draw();
  });

  // Draw nodes
  nodes.forEach((node) => {
    node.draw();
  });
}

function changeClick() {
  if(OPTIONS[0] === selectOptions.value()) {
    resetNodesSelect()
    nodes.push(new Node(mouseX, mouseY, `N-${nodes.length}`));
  }

  if(OPTIONS[1] === selectOptions.value()) {
    if(!nodeTwo && nodeOne) {
      nodeTwo = isClickedNode(mouseX, mouseY);
    }

    if(!nodeOne) {
      nodeOne = isClickedNode(mouseX, mouseY);
    }

    if(nodeOne && nodeTwo) {
      
      nodeOne.newLine(nodeTwo, +inputLine.value());
      nodeTwo.newLine(nodeOne, +inputLine.value());

      resetNodesSelect();

      // console.log(nodes);
    }
  }

  if(OPTIONS[2] === selectOptions.value()) {
    resetNodesSelect();

    const nodeStart = isClickedNode(mouseX, mouseY);
    
    nodeStart.state = STATE_NODE[1];
    nodeStart.data = {
      count: 0,
      nodePrev: undefined,
      iter: 0
    }
  }

  if(OPTIONS[3] === selectOptions.value()) {
    resetNodesSelect();

    isClickedNode(mouseX, mouseY).state = STATE_NODE[2];
  }

  return false;
}

function searchNodeById(id) {
  return nodes.find(node => node.id === id);
}

function searchNodeByState(state) {
  return nodes.find(node => node.state === state);
}

function resetNodesSelect() { // -> Reset data select nodes
  nodeOne = undefined;
  nodeTwo = undefined;

  // inputLine.value(LABEL)
}

function startInputs() { // -> Inicializamos el select / input / button
  selectOptions = createSelect();

  selectOptions.position(8, HEIGHT + 100);

  OPTIONS.forEach(option => {
    selectOptions.option(option);
  });

  selectOptions.selected(OPTIONS[0]);

  inputLine = createInput(LABEL);
  inputLine.position(150, HEIGHT + 102);

  button = createButton('Dijkstra go!!');
  button.position(8, HEIGHT + 150);
  button.mousePressed(dijkstra);
}

function isClickedNode(mouseX, mouseY) { // -> Sirve para saber si esta pisando un nodo
  const index = nodes.findIndex(node => {
    const num = Math.sqrt(Math.pow((mouseX-node.x), 2) + Math.pow((mouseY-node.y), 2));

    return num < (SIZE_NODE/2);
  });
  
  return nodes[index];
}

/** 
 * 
 *  Object Node
 *  
 */

// Create node (pos x, pos y, id number)
function Node (x, y, id) {
  this.id = id;
  this.size = SIZE_NODE;
  this.lines = [];

  this.state = STATE_NODE[0];

  this.data = {
    count: undefined,
    nodePrev: undefined,
    iter: undefined
  };

  this.limitView(x, y);
}

Node.prototype.limitView = function(x, y) {
  if(y > (HEIGHT - this.size)) {
    y = HEIGHT - this.size;
  }

  if(y < this.size) {
    y = this.size
  }

  if(x > (WIDTH - this.size)) {
    x = WIDTH - this.size;
  }

  if(x < this.size) {
    x = this.size;
  }

  this.x = x
  this.y = y
}

Node.prototype.newLine = function(node, weight) {
  this.lines.push(new Line(this, node, weight));
} 

Node.prototype.draw = function() {
  strokeWeight(2);

  if(this.state === STATE_NODE[1]) { // NODO START
    fill('green');
    stroke('green');
  } else if(this.state === STATE_NODE[2]) { // NODO FINISH
    fill('red');
    stroke('red');
  } else {
    stroke('black');
    strokeWeight(1);
    fill(0, 0, 0);
  }

  ellipse(this.x, this.y, this.size, this.size);
  
  fill('white');
  textSize(16);
  textStyle(NORMAL);
  text(this.id, this.x, this.y);
}

/** 
 * 
 *  Object Line
 *  
 */

// Create node (nodo padre, nodo hijo, peso de la union)
function Line(parentNode, chieldNode, weight) {
  this.parentNode = parentNode;// -> Nodo padre
  this.chieldNode = chieldNode;// -> Nodo con el que hace la relacion
  this.weight = weight ? weight : 1;

  this.activate = false;
}

Line.prototype.draw = function() {
  strokeWeight(5);
  stroke(!this.activate ? 'black' : 'green');
  line(this.parentNode.x, this.parentNode.y, this.chieldNode.x, this.chieldNode.y);

  fill('white');
  stroke('black');
  textSize(30);
  textStyle(BOLD);
  text(this.weight, (this.parentNode.x + this.chieldNode.x)/2, (this.parentNode.y + this.chieldNode.y)/2);
}

function dijkstra() {
  var nodeStart = searchNodeByState(STATE_NODE[1]);
  var nodeFinish = searchNodeByState(STATE_NODE[2]);

  lineCount(nodeStart, 0);// -> Verifica el camino mas corto
  lineChangeState(nodeFinish, nodeStart);
}

function lineChangeState(nodeFinish, nodeStart) {
  if(nodeFinish.id !== nodeStart.id) {
    const line = nodeFinish.lines.find(line => line.chieldNode.id === nodeFinish.data.nodePrev);
  
    line.activate = true;
    lineChangeState(line.chieldNode, nodeStart);
  }
}

function lineCount(nodeStart, iter) {
  if(!nodeStart) {
    return;
  }

  const itera = iter + 1;

  nodeStart.lines.forEach(line => { // -> Genera la sumatoria de nodos
    const index = visitedNode.find(vistNode => vistNode.id === line.chieldNode.id) || undefined; 

    if(!index) {
      const chieldNode = line.chieldNode;
  
      if(nodeStart.id !== chieldNode.id) {
        if(!chieldNode.data.count) {
          chieldNode.data.count = line.weight + nodeStart.data.count;
          chieldNode.data.nodePrev = nodeStart.id;
          chieldNode.data.iter = itera;
        } else {
          chieldNode.data.count = line.chieldNode.data.count < (nodeStart.data.count + line.weight) ? line.chieldNode.data.count : nodeStart.data.count + line.weight;   
          chieldNode.data.nodePrev = line.chieldNode.data.count < (nodeStart.data.count + line.weight) ? line.chieldNode.data.nodePrev : nodeStart.id;
          chieldNode.data.iter = line.chieldNode.data.count < (nodeStart.data.count + line.weight) ? chieldNode.data.iter : itera;
        }
      }
    }
  });

  visitedNode.push(nodeStart);

  var node;

  nodeStart.lines.forEach(line => {
    const index = visitedNode.find(vistNode => vistNode.id === line.chieldNode.id) || undefined; 

    if(!index) {
      if(!node) {
        node = line.chieldNode;
      } else {
        node = line.chieldNode.data.count < node.data.count ? line.chieldNode : node;
      }
    }
  });

  const nodePrev = visitedNode.find(visitNode => visitNode.id === nodeStart.data.nodePrev);

  if(nodePrev) {
    nodePrev.lines.forEach(line => {
      if(line.chieldNode.id !== nodeStart.id) {
        const index = visitedNode.find(vistNode => vistNode.id === line.chieldNode.id) || undefined; 

        if(!index) {
          node = line.chieldNode.data.count < node.data.count ? line.chieldNode : node;
        }
      }
    });
  }

  lineCount(node, itera);
}