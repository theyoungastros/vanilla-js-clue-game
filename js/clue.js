/* ----- */
/* Logic */
/* ----- */

var Game = {};

/* Settings */

Game.settings = {};

Game.settings.board = {
  width: 1000,
  height: 1000,
  rows: 10,
  cols: 10
};

Game.settings.tile = {
  width: 42,
  height: 42
}

Game.settings.token = {
  width: 20,
  height: 20
}


Game.settings.players = [
  {'name': 'Tyler', 'color': 'red', 'position': [0,0]},
  {'name': 'Bob', 'color': 'blue', 'position': [9,9]},
];


Game.players = [];
Game.activePlayerId = 0;

Game.tiles = [];

Game.selectedTile = null;
Game.currentSteps = null;

Game.state = 'turn-begin';






/* Game Setup */

Game.init = function() {

  Game.cache();
  Game.drawBoard();
  Game.createPlayers();
  Game.positionPlayers();
  Game.bindEvents();

  Game.setState('game-begin');

}

Game.cache = function() {

  Game.dom = {};

  Game.dom.board = document.getElementById("board");

  Game.dom.dice = document.getElementById("dice");
  Game.dom.die1 = document.getElementById("die-1");
  Game.dom.die2 = document.getElementById("die-2");

  Game.dom.btnConfirm = document.getElementById("btn-confirm");


}

Game.drawBoard = function() {

  var html = '<table class="map break alt">';

  for(var y=0; y<Game.settings.board.rows; y++) {

    html += '<tr class="map-row" id="map-row-{0}">'.format([y]);

    for(var x=0; x<Game.settings.board.cols; x++){

      var rand = Math.random();
      var status = (rand > 0.8) ? 'closed' : '';

      Game.settings.players.map(function(player){
        if(player.position[0] == x && player.position[1] == y){
          status = '';
        }
      });

      html += '<td class="map-tile" id="map-tile-{0}-{1}" data-status="{2}"></td>'.format([x, y, status]);

    }

    html += '</tr>';
  }

  html += '</table>';

  Game.dom.board.innerHTML = html;

  for(var y=0; y<Game.settings.board.rows; y++) {
    for(var x=0; x<Game.settings.board.cols; x++){
      var tile = new Tile(x,y, document.getElementById('map-tile-{0}-{1}'.format([x,y])));
      Game.tiles.push(tile);
    }
  }

}

Game.createPlayers = function() {

  Game.settings.players.map(function(p, i){
    var element = document.createElement('div');

    element.className = "player";
    element.id = "player-" + i;
    element.style.background = p.color;

    Game.dom.board.appendChild(element);

    var player = new Player(i, p.color, p.name, element, p.position[0], p.position[1]);
    Game.players.push(player);

  });

}

Game.positionPlayers = function() {

  Game.players.map(function(player) {
    player.setPosition();
  });

}


/* Events */

Game.bindEvents = function() {

  //tiles
  Game.tiles.map(function(tile){
    tile.element.addEventListener('click', function(event){
      var tile = Tile.getByElementId(event.target.id);
      tile.clicked();
    });
  });

  //dice
  Game.dom.dice.onclick = function() {

    if(Game.getState() != 'rolling'){
        return;
    }

    Game.rollDice(function(roll){

      Game.currentRoll = roll;
      Game.setState('moving');

    });

  }


  //buttons
  Game.dom.btnConfirm.onclick = function() {

    if(Game.getState() == 'moving' && Game.selectedTile){

      UI.disableElement('btn-confirm');

      var tile = Game.selectedTile;
      Player.getActive().moveToTile(Game.selectedTile);

      Game.selectedTile = null;
      UI.clearPaths();

    }

  }

}


/* State Machine */


Game.getState = function() {
  return Game.state;
}

Game.setState = function(state){


  switch(state){

    case "game-begin":
      Game.setState('turn-begin');
      return;
    break;

    case "turn-begin":
      Game.setState('rolling');
      return;
    break;

    case "rolling":
    break;

    case "moveing":
    break;

    case "accusing":
      // TODO: Setup accusing state
      Game.setState('turn-over');
      return;
    break;

    case "responding":
    break;

    case "reflecting":
    break;

    case "turn-over":
      Game.nextPlayer();
      Game.setState('turn-begin');
      return;
    break;

    case "ultimatum":
    break;

    case "game-over":
    break;

  }

  Game.state = state;

}


Game.rollDice = function(callback) {

  var totalSpins = 10;
  var currentSpin = 0;

  var spinInterval = window.setInterval(function(){
    currentSpin++;

    var value1 = Utils.randomInt(1, 6);
    UI.presentDie(1, value1);

    var value2 = Utils.randomInt(1, 6);
    UI.presentDie(2, value2);

    if(currentSpin >= totalSpins){
      clearInterval(spinInterval);

      var total = value1 + value2;

      var doubles = (value1 == value2) ? true : false;

      callback({'total': total, 'value1': value1, 'value2': value2, 'doubles': doubles });

    }


  }, 100);

}

Game.nextPlayer = function(){

  Game.activePlayerId = Game.activePlayerId + 1;
  if(Game.activePlayerId >= Game.players.length){
    Game.activePlayerId = 0;
  }

}


/* ------ */
/* Models */
/* ------ */


/* Player */

var Player = function(id, color, name, element, x, y){

  this.id = id;
  this.color = color;
  this.name = name;
  this.element = element;
  this.x = x;
  this.y = y;

}

Player.getActive = function(){
  return Game.players[Game.activePlayerId];
}

Player.prototype.setPosition = function(x, y) {

  this.x = x || this.x;
  this.y = y || this.y;

  var tile = Tile.get(this.x, this.y);
  var position = tile.tokenPosition();

  this.element.style.left = position.x + 'px';
  this.element.style.top = position.y + 'px';

}

Player.prototype.moveToTile = function(tile, callback){

  if(!Game.currentSteps){
    return;
  }


  this.incrementSteps(Game.currentSteps.length - 1, Game.currentSteps, function(){

    Game.setState("accusing");

  });


}

Player.prototype.incrementSteps = function(i, steps, callback){

  var player = this;

  if(i >= 0){

    var step = steps[i];

    var delay = i == steps.length - 1 ? 0 : 300;

    window.setTimeout(function(){
      player.incrementSteps(i-1, steps, callback);
      player.setPosition(step.x, step.y);
    }, delay);

    return;

  }

  Game.currentSteps = null;
  callback();

}

Player.prototype.pathToTile = function(tile, allowedSteps) {

  var allowedSteps = allowedSteps + 1;

  var begin = { 'x': this.x, 'y': this.y, 'z': 0 };
  var end = { 'x': tile.x, 'y': tile.y, 'z': 0 };

  var map = Utils.getMap();
  Pathfinding.map.setData(map);

  var steps = Pathfinding.pathFinder.findPath(begin.x, begin.y, end.x, end.y);

  if(!steps){
    alert("Can't get there");
    return false;
  }

  if(steps.length > allowedSteps){
    alert("Too far for this move");
    return false;
  }

  if(steps.length == 1){
    alert("You must move on your turn");
    return false;
  }

  Game.selectedTile = tile;
  Game.currentSteps = steps;

  UI.clearPaths();
  UI.setTileGroup(steps, 'path');

}


/* Tile */

var Tile = function(x, y, element) {

  this.x = x;
  this.y = y;
  this.element = element;

}

Tile.get = function(x, y) {

  var i = ((y + 1) * Game.settings.board.cols) - Game.settings.board.cols + x;
  return Game.tiles[i];

}

Tile.getByElementId = function(elementId){

  var xy = elementId.replace("map-tile-", "").split("-");
  var x = parseInt(xy[0]);
  var y = parseInt(xy[1]);

  return Tile.get(x, y);
}


Tile.prototype.tokenPosition = function() {

  var x = ((this.x + 1) * Game.settings.tile.width ) - (Game.settings.tile.width / 2) - (Game.settings.token.width / 2);
  var y = ((this.y + 1) * Game.settings.tile.height) - (Game.settings.tile.height / 2) - (Game.settings.token.width / 2);

  return {'x': x, 'y': y};

}

Tile.prototype.clicked = function() {

  if(Game.getState() != 'moving'){
    return;
  }

  Player.getActive().pathToTile(this, Game.currentRoll.total);
  UI.enableElement('btn-confirm');

}

Tile.prototype.getStatus = function() {

  return this.element.dataset.status;

}

Tile.prototype.setStatus = function(status) {

  this.element.dataset.status = status;

}

Tile.prototype.getLevel = function() {

  return 0;

}


/* Path Finding */

var Pathfinding = Pathfinding || {};

Pathfinding.Tile = function (x, y) {

  this.x = x;
  this.y = y;

};

Pathfinding.Tile3d = function (x, y, z) {

  this.x = x;
  this.y = y;
  this.z = z;

};

Pathfinding.Step = function(xC, yC, xT, yT, totalSteps, parentStep) {

  var _private = {
     // Euclidean distance, C = current, T = target
     distanceE: function (xC, yC, xT, yT) {
         var dx = xT - xC, dy = yT - yC;
         return Math.sqrt((dx * dx) + (dy * dy));
     },

     // Manhattan distance (use this one)
     distanceM: function (xC, yC, xT, yT) {
         var dx = Math.abs(xT - xC), dy = Math.abs(yT - yC);
         return dx + dy;
     }
  };

// herustic
  var h = _private.distanceM(xC, yC, xT, yT);

  this.x = xC;
  this.y = yC;
  this.g = totalSteps;
  this.h = h;
  this.f = totalSteps + h;
  this.parent = parentStep;

};

Pathfinding.Step3d = function(xC, yC, zC, xT, yT, zT, totalSteps, parentStep) {

  var _private = {
    distanceM3d: function (xC, yC, zC, xT, yT, zT) {
        var dx = Math.abs(xT - xC), dy = Math.abs(yT - yC), dz = Math.abs(zT - zC);
        return dx + dy + dz;
    }
  };

  var h = _private.distanceM3d(xC, yC, zC, xT, yT, zT);

  this.x = xC;
  this.y = yC;
  this.z = zC;
  this.g = totalSteps;
  this.h = h;
  this.f = totalSteps + h;
  this.parent = parentStep;

};





/* ------ */
/* --UI-- */
/* ------ */

var UI = {};


UI.presentDie = function(number, value) {

  var valueStrings = ['one', 'two', 'three', 'four', 'five', 'six'];

  if(number === 1){
    var die = Game.dom.die1;
  } else {
    var die = Game.dom.die2;
  }

  die.className = "die " + valueStrings[value - 1];

}


UI.setTileGroup = function(steps, status){

  steps.map(function(step){
    var tile = Tile.get(step.x, step.y);
    tile.setStatus(status);
  });

}

UI.clearPaths = function(){

  Game.tiles.map(function(tile){

    if(tile.element.dataset.status == 'path'){
      tile.element.dataset.status = 'open';
    }

  });

}

UI.enableElement = function(elementId){

  document.getElementById(elementId).disabled = false;

}

UI.disableElement = function(elementId){

  document.getElementById(elementId).disabled = true;

}


/* --------- */
/* --Utils-- */
/* --------- */

Utils = {};

Utils.getMap = function () {
    var tmpMap = [],
        status,
        y,
        x;

    for (y = 0; y < Game.settings.board.rows; y++) {
        tmpMap.push([]);
        for (x = 0; x < Game.settings.board.cols; x++) {

            var tile = Tile.get(x, y);
            status = tile.getStatus();

            if (status === 'closed') {
                tmpMap[y][x] = 0;
            } else {
                tmpMap[y][x] = 1;
            }
        }
    }

    return tmpMap;
};


Utils.randomInt = function(min, max){

  return Math.floor( Math.random() * (max + 1 - min) + min );

}

Utils.loadJson = function(path, success, error) {

  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (success){
                success(JSON.parse(xhr.responseText));
              }
          } else {
              if (error){
                error(xhr);
              }
          }
      }
  };

  xhr.open("GET", path, true);
  xhr.send();

}

Utils.shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}



/* -------- */
/* --Init-- */
/* -------- */

window.onload = function() {

  Game.init();

}
