var Pathfinding = Pathfinding || {};

Pathfinding.pathFinder = {
    // Taken steps
    closed: [],

    // Available steps that can be taken
    open: [],

    // Step count
    step: 0,

    // Maximum number of steps that can be taken before shutting down a closed path
    maxSearchDistance: 10,

    _private: {
        outOfBounds: function (x, y) {
            return x < 0 || x >=Pathfinding.map.data[0].length ||
                y < 0 || y >=Pathfinding.map.data.length;
        },

        outOfBounds3d: function (x, y, z) {
            return x < 0 || x >=Pathfinding.map.data[0][0].length ||
                y < 0 || y >=Pathfinding.map.data[0].length ||
                z < 0 || z >=Pathfinding.map.data.length;
        }
    },

    addOpen: function (step) {
        this.open.push(step);
        return this;
    },

    // Remove a step that already exists by object memory address (not actual x and y values)
    removeOpen: function (step) {
        for (var i = 0; i < this.open.length; i++) {
            if (this.open[i] === step) this.open.splice(i, 1);
        }
        return this;
    },

    // Check if the step is already in the open set
    inOpen: function (step) {
        for (var i = 0; i < this.open.length; i++) {
            if (this.open[i].x === step.x && this.open[i].y === step.y)
                return this.open[i];
        }

        return false;
    },

    inOpen3d: function (step) {
        for (var i = 0; i < this.open.length; i++) {
            if (this.open[i].x === step.x && this.open[i].y === step.y && this.open[i].z === step.z)
                return this.open[i];
        }

        return false;
    },

    // Get the lowest costing tile in the open set
    getBestOpen: function () {
        var bestI = 0;
        for (var i = 0; i < this.open.length; i++) {
            if (this.open[i].f < this.open[bestI].f) bestI = i;
        }

        return this.open[bestI];
    },

    addClosed: function (step) {
        this.closed.push(step);
        return this;
    },

    // Check if the step is already in the closed set
    inClosed: function (step) {
        for (var i = 0; i < this.closed.length; i++) {
            if (this.closed[i].x === step.x && this.closed[i].y === step.y)
                return this.closed[i];
        }

        return false;
    },

    inClosed3d: function (step) {
        for (var i = 0; i < this.closed.length; i++) {
            if (this.closed[i].x === step.x &&
                this.closed[i].y === step.y &&
                this.closed[i].z === step.z)
                return this.closed[i];
        }

        return false;
    },

    // @TODO 3d version
    // @TODO Integrate maximum step limiter
    findPath: function (xC, yC, xT, yT, maxSteps) {
        var current, // Current best open tile
            neighbors, // Dump of all nearby neighbor tiles
            neighborRecord, // Any pre-existing records of a neighbor
            stepCost, // Dump of a total step score for a neighbor
            i;

        // You must add the starting step
        this.reset()
            .addOpen(new Pathfinding.Step(xC, yC, xT, yT, this.step, false));

        while (this.open.length !== 0) {
            current = this.getBestOpen();

            // Check if goal has been discovered to build a path
            if (current.x === xT && current.y === yT) {
                return this.buildPath(current, []);
            }

            // Move current into closed set
            this.removeOpen(current)
                .addClosed(current);

            // Get neighbors from the map and check them
            neighbors =Pathfinding.map.getNeighbors(current.x, current.y);
            for (i = 0; i < neighbors.length; i++) {
                // Get current step and distance from current to neighbor
                stepCost = current.g +Pathfinding.map.getCost(current.x, current.y, neighbors[i].x, neighbors[i].y);

                // Check for the neighbor in the closed set
                // then see if its cost is >= the stepCost, if so skip current neighbor
                neighborRecord = this.inClosed(neighbors[i]);
                if (neighborRecord && stepCost >= neighborRecord.g)
                    continue;

                // Verify neighbor doesn't exist or new score for it is better
                neighborRecord = this.inOpen(neighbors[i]);
                if (!neighborRecord || stepCost < neighborRecord.g) {
                    if (!neighborRecord) {
                        this.addOpen(new Pathfinding.Step(neighbors[i].x, neighbors[i].y, xT, yT, stepCost, current));
                    } else {
                        neighborRecord.parent = current;
                        neighborRecord.g = stepCost;
                        neighborRecord.f = stepCost + neighborRecord.h;
                    }
                }
            }
        }

        return false;
    },

    findPath3d: function (xC, yC, zC, xT, yT, zT, maxSteps) {
        var current, // Current best open tile
            neighbors, // Dump of all nearby neighbor tiles
            neighborRecord, // Any pre-existing records of a neighbor
            stepCost, // Dump of a total step score for a neighbor
            i;

        // You must add the starting step
        this.reset()
            .addOpen(new Pathfinding.Step3d(xC, yC, zC, xT, yT, zT, this.step, false));

        while (this.open.length !== 0) {
            current = this.getBestOpen();

            // Check if goal has been discovered to build a path
            if (current.x === xT && current.y === yT && current.z === zT) {
                return this.buildPath(current, []);
            }

            // Move current into closed set
            this.removeOpen(current)
                .addClosed(current);

            // Get neighbors from the map and check them
            neighbors =Pathfinding.map.getNeighbors3d(current.x, current.y, current.z);
            for (i = 0; i < neighbors.length; i++) {
                // Get current step and distance from current to neighbor
                stepCost = current.g +Pathfinding.map.getCost3d(current.x, current.y, current.z, neighbors[i].x, neighbors[i].y, neighbors[i].z);

                // Check for the neighbor in the closed set
                // then see if its cost is >= the stepCost, if so skip current neighbor
                neighborRecord = this.inClosed3d(neighbors[i]);
                if (neighborRecord && stepCost >= neighborRecord.g)
                    continue;

                // Verify neighbor doesn't exist or new score for it is better
                neighborRecord = this.inOpen(neighbors[i]);
                if (!neighborRecord || stepCost < neighborRecord.g) {
                    if (!neighborRecord) {
                        this.addOpen(new Pathfinding.Step3d(neighbors[i].x, neighbors[i].y, neighbors[i].z, xT, yT, zT, stepCost, current));
                    } else {
                        neighborRecord.parent = current;
                        neighborRecord.g = stepCost;
                        neighborRecord.f = stepCost + neighborRecord.h;
                    }
                }
            }
        }

        return false;
    },

    // Recursive path buliding method
    buildPath: function (tile, stack) {
        stack.push(tile);

        if (tile.parent) {
            return this.buildPath(tile.parent, stack);
        } else {
            return stack;
        }
    },

    setVisual: function () {
      Pathfinding.visual.clearPath()
            .setTileGroup(this.open, 'set-opened')
            .setTileGroup(this.closed, 'set-closed');
    },

    reset: function () {
        this.closed = [];
        this.open = [];
        return this;
    }
};


Pathfinding.map = {

  _private: {
      outOfBounds: function (x, y) {
          return x < 0 || x >=Pathfinding.map.data[0].length ||
              y < 0 || y >=Pathfinding.map.data.length;
      },

      outOfBounds3d: function (x, y, z) {
          return x < 0 || x >=Pathfinding.map.data[0][0].length ||
              y < 0 || y >=Pathfinding.map.data[0].length ||
              z < 0 || z >=Pathfinding.map.data.length;
      }
  },

  // Current map
  data: null,

  setData: function (map) {
      this.data = map;
      return this;
  },

  getWidthInTiles: function () {
      return this.data[0].length;
  },

  getHeightInTiles: function () {
      return this.data.length;
  },

  blocked: function (x, y) {
      if (this._private.outOfBounds(x, y)) {
          return true;
      }

      if (this.data[y][x] === 0) {
          return true;
      }

      return false;
  },

  blocked3d: function (x, y, z) {
      if (this._private.outOfBounds3d(x, y, z)) {
          return true;
      }

      if (this.data[z][y][x] === 0) {
          return true;
      }

      return false;
  },

  getNeighbors: function (x, y) {
      var neighbors = [];

      // Check left, right, top, bottom
      if (!this.blocked(x + 1, y)) neighbors.push(new Pathfinding.Tile(x + 1, y));
      if (!this.blocked(x - 1, y)) neighbors.push(new Pathfinding.Tile(x - 1, y));
      if (!this.blocked(x, y + 1)) neighbors.push(new Pathfinding.Tile(x, y + 1));
      if (!this.blocked(x, y - 1)) neighbors.push(new Pathfinding.Tile(x, y - 1));

      return neighbors;
  },

  getNeighbors3d: function (x, y, z) {
      var neighbors = [];

      // Check left, right, top, bottom
      if (!this.blocked3d(x + 1, y, z)) neighbors.push(new Pathfinding.Tile3d(x + 1, y, z));
      if (!this.blocked3d(x - 1, y, z)) neighbors.push(new Pathfinding.Tile3d(x - 1, y, z));
      if (!this.blocked3d(x, y + 1, z)) neighbors.push(new Pathfinding.Tile3d(x, y + 1, z));
      if (!this.blocked3d(x, y - 1, z)) neighbors.push(new Pathfinding.Tile3d(x, y - 1, z));

      // Get top levels
      if (!this.blocked3d(x + 1, y, z + 1)) neighbors.push(new Pathfinding.Tile3d(x + 1, y, z + 1));
      if (!this.blocked3d(x - 1, y, z + 1)) neighbors.push(new Pathfinding.Tile3d(x - 1, y, z + 1));
      if (!this.blocked3d(x, y + 1, z + 1)) neighbors.push(new Pathfinding.Tile3d(x, y + 1, z + 1));
      if (!this.blocked3d(x, y - 1, z + 1)) neighbors.push(new Pathfinding.Tile3d(x, y - 1, z + 1));

      // Get bottom levels
      if (!this.blocked3d(x + 1, y, z - 1)) neighbors.push(new Pathfinding.Tile3d(x + 1, y, z - 1));
      if (!this.blocked3d(x - 1, y, z - 1)) neighbors.push(new Pathfinding.Tile3d(x - 1, y, z - 1));
      if (!this.blocked3d(x, y + 1, z - 1)) neighbors.push(new Pathfinding.Tile3d(x, y + 1, z - 1));
      if (!this.blocked3d(x, y - 1, z - 1)) neighbors.push(new Pathfinding.Tile3d(x, y - 1, z - 1));

      return neighbors;
  },


  // Only works when moving to adjacent levels
  getCost: function (xC, yC, xT, yT) {
      return this.data[yT][xT];
  },

  // When adding a new level it should take z, changes in z cost 2
  // @TODO Should cost 2 to move up or down a level
  getCost3d: function (xC, yC, zC, xT, yT, zT) {
      if (Math.abs(zC - zT) >= 1) {
//                console.log(xC, yC, zC, xT, yT, zT, Math.abs(zC - zT));
          return this.data[zT][yT][xT] + Math.abs(zC - zT);
      }

      return this.data[zT][yT][xT];
  }
};
