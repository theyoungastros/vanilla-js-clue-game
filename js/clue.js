/* ----- */
/* Logic */
/* ----- */

var Game = {};

/* Settings */

Game.settings = {};

Game.settings.board = {
  width: 1000,
  height: 1000
};

Game.settings.tile = {
  width: 42,
  height: 42
}

Game.settings.token = {
  width: 20,
  height: 20
}



Game.activePlayerId = 0;

Game.players = [];
Game.tiles = [];
Game.rooms = [];
Game.weapons = [];

Game.selectedTile = null;
Game.currentSteps = null;

Game.state = 'turn-begin';

Game.gridData = null;
Game.roomData = null;
Game.playerData = null;
Game.weaponData = null;

Game.answer = {};
Game.answer.player = null;
Game.answer.room = null;
Game.answer.weapon = null;


/* Game Setup */

Game.init = function() {

  Game.loadData(function(){

    Game.cache();
    Game.createRooms();
    Game.drawBoard();
    Game.createPlayers();
    Game.createWeapons();
    Game.createDialogs();
    Game.positionPlayers();
    Game.shuffleAndDeal();
    Game.bindEvents();

    Game.setState('game-begin');

  });


}

Game.loadData = function(callback) {

  Utils.loadJson('/js/board.json', function(response){
    Game.gridData = response.grid;
    Game.roomData = response.rooms;
    Game.playerData = response.players;
    Game.weaponData = response.weapons;
    callback();
  });

}

Game.cache = function() {

  Game.dom = {};

  Game.dom.board = document.getElementById("board");

  Game.dom.dice = document.getElementById("dice");
  Game.dom.die1 = document.getElementById("die-1");
  Game.dom.die2 = document.getElementById("die-2");

  Game.dom.btnConfirm = document.getElementById("btn-confirm");

  Game.dom.dialogAccuse = {};
  Game.dom.dialogAccuse.container = document.getElementById("dialog-accuse");
  Game.dom.dialogAccuse.playerSelect = document.getElementById("accuse-person");
  Game.dom.dialogAccuse.roomSelect = document.getElementById("accuse-room");
  Game.dom.dialogAccuse.weaponSelect = document.getElementById("accuse-weapon");
  Game.dom.dialogAccuse.confirm = document.getElementById("accuse-confirm");


}

Game.drawBoard = function() {

  var html = '<table class="map break alt">';

  var rows = 0;
  var cols = 0;

  Game.gridData.map(function(row, y){
    rows++;
    cols = 0;

    html += '<tr class="map-row" id="map-row-{0}">'.format([x]);

    row.map(function(col, x){
      cols++;
      var status = '';
      switch(col){
        case 1:
          status = 'closed';
          break;
      }

      html += '<td class="map-tile" id="map-tile-{0}-{1}" data-status="{2}" data-type="{3}"></td>'.format([x, y, status, col]);

    });

    html += '</tr>';

  });

  html += '</table>';

  Game.dom.board.innerHTML = html;
  Game.settings.board.rows = rows;
  Game.settings.board.cols = cols;


  for(var y=0; y<Game.settings.board.rows; y++) {
    for(var x=0; x<Game.settings.board.cols; x++){
      var element = document.getElementById('map-tile-{0}-{1}'.format([x,y]));
      var type = element.dataset.type;
      var tile = new Tile(x,y,element,type);
      Game.tiles.push(tile);
    }
  }


}

Game.createRooms = function(){

  Game.roomData.map(function(room, i){

    Game.rooms.push(new Room(i, room.name));

  });

}

Game.createWeapons = function(){

  Game.weaponData.map(function(weapon, i){

    Game.weapons.push(new Weapon(i, weapon.name));

  });

}

Game.createPlayers = function() {

  Game.playerData.map(function(p, i){
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

Game.createDialogs = function(){

  var roomOptions = [];
  Game.rooms.map(function(room){
    roomOptions.push({'key': room.id, 'value': room.name});
  });

  var playerOptions = [];
  Game.players.map(function(player){
    playerOptions.push({'key': player.id, 'value': player.name});
  });

  var weaponOptions = [];
  Game.weapons.map(function(weapon){
    weaponOptions.push({'key': weapon.id, 'value': weapon.name});
  });

  Utils.populateSelectbox(Game.dom.dialogAccuse.roomSelect, roomOptions, 'Room');
  Utils.populateSelectbox(Game.dom.dialogAccuse.playerSelect, playerOptions, 'Player');
  Utils.populateSelectbox(Game.dom.dialogAccuse.weaponSelect, weaponOptions, 'Weapon');


}


Game.shuffleAndDeal = function() {

  Game.answer.player = Game.players[Utils.randomInt(0, Game.players.length - 1)];
  Game.answer.room = Game.rooms[Utils.randomInt(0, Game.rooms.length - 1)];
  Game.answer.weapon = Game.weapons[Utils.randomInt(0, Game.weapons.length - 1)];

  //var cards = [];




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

  //dialogs

  Game.dom.dialogAccuse.confirm.onclick = function(){

    Game.dom.dialogAccuse.container.style.display = 'none';

    var playerId = Utils.getSelectedValue(Game.dom.dialogAccuse.playerSelect);
    var roomId = Utils.getSelectedValue(Game.dom.dialogAccuse.roomSelect);
    var weaponId = Utils.getSelectedValue(Game.dom.dialogAccuse.weaponSelect);

    var player = Game.players[playerId];
    var weapon = Game.weapons[weaponId];
    var room = Game.rooms[roomId];

    Game.setState('responding');

    Game.accuse(player, room, weapon, function(){

      Game.setState('reflecting');
      Game.setState('turn-over');

    });

  }

}


/* State Machine */


Game.getState = function() {
  return Game.state;
}

Game.setState = function(state){

  var player = Player.getActive();
  var tile = player.currentTile();

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

      if(!tile.room){
        Game.setState('turn-over');
        return;
      }

      UI.presentMenu('accusing');

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


Game.accuse = function(player, room, weapon, callback) {

  var activePlayer = Player.getActive();

  var accusation = "{0} in the {1} with the {2}.".format([player.name, room.name, weapon.name]);

  Game.players.map(function(p){

    if(p.id != activePlayer.id){
      alert("{0}, can you prove {1} wrong?\n({2})".format([p.name, activePlayer.name, accusation]));
    }

  });


  callback();

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
  this.cards = null;


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

Player.prototype.currentTile = function(){

  return Tile.get(this.x, this.y);

}

Player.prototype.moveToTile = function(tile, callback){

  if(!Game.currentSteps){
    return;
  }


  this.incrementSteps(Game.currentSteps.length - 1, Game.currentSteps, function(){

    Player.getActive().setPosition(tile.x, tile.y);

    Game.setState("accusing");

  });


}

Player.prototype.incrementSteps = function(i, steps, callback){

  var player = this;
  var finalX = steps[steps.length-1].x;
  var finalY = steps[steps.length-1].y;

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

var Tile = function(x, y, element, typeId) {

  this.x = x;
  this.y = y;
  this.element = element;
  this.typeId = parseInt(typeId);
  this.type = "";
  this.walkable = false;
  this.room = null;

  if(this.typeId < 0){

    var roomId = (this.typeId * -1) - 1;

    this.walkable = true;

    this.room = Game.rooms[roomId];
    this.room.tile = this;

    this.element.style.outline = '3px solid #aaa';
    this.element.title = this.roomName;
    this.element.innerHTML = this.room.name;

  } else {

    switch(this.typeId){
      case 0:
        //empty space
        this.walkable = true;
        this.type = "open";
        break;
      case 1:
        this.walkable = false;
        this.type = "wall";
        break;
      case 2:
        this.walkable = true;
        this.type = "start";
        break;

    }
  }

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


/* Room */

var Room = function(id, name){

  this.id = id;
  this.name = name;
  this.tile = null;
}


/* Weapon */

var Weapon = function(id, name){

  this.id = id;
  this.name = name;
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


UI.presentMenu = function(type){

  if(type == 'accusing'){

    Game.dom.dialogAccuse.container.style.display = 'block';


  }

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

Utils.populateSelectbox = function(element, items, placeholder){

  var html = '';
  if(placeholder){
    html += '<option value="none">--{{0}}--</option>'.format([placeholder]);
  }

  items.map(function(item){
    html += '<option value="{0}">{1}</option>'.format([item.key, item.value]);

  });

  element.innerHTML = html;

}

Utils.getSelectedValue = function(element){

  return element.options[element.selectedIndex].value;

}



/* -------- */
/* --Init-- */
/* -------- */

window.onload = function() {

  Game.init();

}
