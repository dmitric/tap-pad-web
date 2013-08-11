var Atom, AudioSource, IdGenerator, TapPad;
IdGenerator = (function() {
  var PrivateClass, instance;
  function IdGenerator() {}
  instance = null;
  PrivateClass = (function() {
    function PrivateClass() {
      this.seed = 0;
    }
    PrivateClass.prototype.next = function() {
      return this.seed++;
    };
    return PrivateClass;
  })();
  IdGenerator.next = function() {
    if (instance == null) {
      instance = new PrivateClass();
    }
    return instance.next();
  };
  return IdGenerator;
})();
AudioSource = (function() {
  function AudioSource(maxChannels) {
    var i, _ref;
    this.maxChannels = maxChannels;
    this.audioChannels = [];
    for (i = 0, _ref = this.maxChannels - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      this.audioChannels[i] = {
        channel: new Audio(),
        finished: -1
      };
    }
  }
  AudioSource.prototype.play = function(audio) {
    var channel, thisTime, _i, _len, _ref, _results;
    _ref = this.audioChannels;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      channel = _ref[_i];
      thisTime = new Date;
      if (channel['finished'] < thisTime.getTime()) {
        channel['finished'] = thisTime.getTime() + document.getElementById(audio).duration * 1000;
        channel['channel'].src = document.getElementById(audio).src;
        channel['channel'].load();
        channel['channel'].play();
        break;
      }
    }
    return _results;
  };
  return AudioSource;
})();
Atom = (function() {
  function Atom(x, y) {
    this.x = x;
    this.y = y;
    this.direction = 1;
    this.vertical = true;
    this.id = IdGenerator.next();
    this.moves = 0;
    this.collisions = 0;
  }
  Atom.prototype.changeDirection = function() {
    this.direction *= -1;
    return this.collisions++;
  };
  Atom.prototype.collide = function() {
    this.vertical = !this.vertical;
    return this.collisions++;
  };
  Atom.prototype.move = function() {
    if (this.vertical) {
      this.y += this.direction;
    } else {
      this.x += this.direction;
    }
    return this.moves++;
  };
  Atom.prototype.nextX = function() {
    var nX;
    nX = this.x;
    if (!this.vertical) {
      nX += this.direction;
    }
    return nX;
  };
  Atom.prototype.nextY = function() {
    var nY;
    nY = this.y;
    if (this.vertical) {
      nY += this.direction;
    }
    return nY;
  };
  return Atom;
})();
TapPad = (function() {
  function TapPad(xMax, yMax) {
    var i, j, _ref, _ref2;
    this.xMax = xMax - 1;
    this.yMax = yMax - 1;
    this.atoms = [];
    this.paused = true;
    this.speed = 100;
    this.grid = [];
    this.collisonsLimit = 100;
    this.movesLimit = 300;
    this.player = new AudioSource(30);
    for (i = 0, _ref = this.yMax; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      this.grid[i] = [];
      for (j = 0, _ref2 = this.xMax; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        this.grid[i][j] = null;
      }
    }
  }
  TapPad.prototype.addAtom = function(x, y) {
    return this.addAtomWithDirections(x, y, 1, 1);
  };
  TapPad.prototype.addAtomWithDirections = function(x, y, direction, vertical) {
    var atom;
    if (!this.isValidMove(x, y)) {
      return console.log("Did not add, out of bounds");
    } else {
      atom = new Atom(x, y);
      atom.direction = direction === 1 ? 1 : -1;
      atom.vertical = vertical === 1 ? true : false;
      this.atoms.push(atom);
      if (this.grid[y][x] === null) {
        this.grid[y][x] = {};
      }
      this.grid[y][x]["" + atom.id] = atom;
      return this.renderAtXandY(x, y);
    }
  };
  TapPad.prototype.toggle = function() {
    return this.paused = !this.paused;
  };
  TapPad.prototype.play = function() {
    return this.paused = false;
  };
  TapPad.prototype.pause = function() {
    return this.paused = true;
  };
  TapPad.prototype.isValidMove = function(x, y) {
    return !(x > this.xMax || x < 0 || y > this.yMax || y < 0);
  };
  TapPad.prototype.moveAtom = function(atom) {
    var curX, curY, nextX, nextY;
    curX = atom.x;
    curY = atom.y;
    nextX = atom.nextX();
    nextY = atom.nextY();
    if (!this.isValidMove(nextX, nextY)) {
      atom.changeDirection();
      if (atom.vertical) {
        this.player.play("audio" + curX);
      } else {
        this.player.play("audio" + curY);
      }
    }
    delete this.grid[curY][curX]["" + atom.id];
    atom.move();
    curX = atom.x;
    curY = atom.y;
    if (this.grid[curY][curX] === null) {
      this.grid[curY][curX] = {};
    }
    return this.grid[curY][curX]["" + atom.id] = atom;
  };
  TapPad.prototype.manageHeadOnCollisions = function(atom) {
    var curX, curY, diffDirection, nextX, nextY, otherAtom, otherAtomId, sameOrientation, _i, _len, _ref;
    curX = atom.x;
    curY = atom.y;
    nextX = atom.nextX();
    nextY = atom.nextY();
    if (this.isValidMove(nextX, nextY)) {
      if (this.grid[nextY][nextX] !== null && Object.size(this.grid[nextY][nextX]) >= 1) {
        _ref = this.grid[nextY][nextX];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          otherAtomId = _ref[_i];
          otherAtom = this.grid[nextY][nextX][otherAtomId];
          diffDirection = atom.direction !== otherAtom.direction;
          sameOrientation = atom.vertical === otherAtom.vertical;
          if (diffDirection && sameOrientation) {
            otherAtom.changeDirection();
          }
        }
        return atom.changeDirection();
      }
    }
  };
  TapPad.prototype.manageIntersections = function() {
    var atom, i, idKey, j, sizeOfCell, _ref, _results;
    _results = [];
    for (j = 0, _ref = this.yMax; 0 <= _ref ? j <= _ref : j >= _ref; 0 <= _ref ? j++ : j--) {
      _results.push((function() {
        var _ref2, _results2;
        _results2 = [];
        for (i = 0, _ref2 = this.xMax; 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
          sizeOfCell = Object.size(this.grid[j][i]);
          _results2.push((function() {
            var _ref3, _results3;
            if (sizeOfCell > 1) {
              _ref3 = this.grid[j][i];
              _results3 = [];
              for (idKey in _ref3) {
                atom = _ref3[idKey];
                _results3.push(atom.collide());
              }
              return _results3;
            }
          }).call(this));
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };
  TapPad.prototype.renderAtXandY = function(x, y) {
    var $cell, sizeOfCell;
    sizeOfCell = Object.size(this.grid[y][x]);
    $cell = $("#row" + y + "col" + x);
    if (this.grid[y][x] === null || sizeOfCell === 0) {
      $cell.removeClass("collision");
      return $cell.removeClass("single");
    } else if (sizeOfCell > 1) {
      $cell.removeClass("single");
      return $cell.addClass("collision");
    } else if (sizeOfCell === 1) {
      $cell.removeClass("collision");
      return $cell.addClass("single");
    }
  };
  TapPad.prototype.purgeOldAtoms = function() {
    var atom, kill_off, _i, _len;
    kill_off = (function() {
      var _i, _len, _ref, _results;
      _ref = this.atoms;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        atom = _ref[_i];
        if (atom.collisions > this.collisonsLimit || atom.moves > this.movesLimit) {
          _results.push(atom);
        }
      }
      return _results;
    }).call(this);
    for (_i = 0, _len = kill_off.length; _i < _len; _i++) {
      atom = kill_off[_i];
      delete this.grid[atom.y][atom.x]["" + atom.id];
    }
    return this.atoms = (function() {
      var _j, _len2, _ref, _results;
      _ref = this.atoms;
      _results = [];
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        atom = _ref[_j];
        if (atom.collisions < this.collisonsLimit || atom.moves < this.movesLimit) {
          _results.push(atom);
        }
      }
      return _results;
    }).call(this);
  };
  TapPad.prototype.render = function() {
    var i, j, _ref, _results;
    _results = [];
    for (j = 0, _ref = this.yMax; 0 <= _ref ? j <= _ref : j >= _ref; 0 <= _ref ? j++ : j--) {
      _results.push((function() {
        var _ref2, _results2;
        _results2 = [];
        for (i = 0, _ref2 = this.xMax; 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
          _results2.push(this.renderAtXandY(i, j));
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };
  TapPad.prototype.step = function() {
    var atom, _i, _j, _len, _len2, _ref, _ref2;
    if (!this.paused && this.atoms.length > 0) {
      this.purgeOldAtoms();
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        atom = _ref[_i];
        this.moveAtom(atom);
      }
      if (this.atoms.length > 1) {
        _ref2 = this.atoms;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          atom = _ref2[_j];
          this.manageHeadOnCollisions(atom);
        }
        this.manageIntersections();
      }
      return this.render();
    }
  };
  return TapPad;
})();
window.tapPad = new TapPad(8, 8);
$(function() {
  var playToggle, runLoop;
  playToggle = function() {
    tapPad.toggle();
    $("#play-control").toggleClass("pause");
    return $("#play-control").toggleClass("play");
  };
  $("#play-control").on("click", function(e) {
    return playToggle();
  });
  $(".player-button").on("click", function(e) {
    var x, y;
    $("#play-control").show();
    if (tapPad.atoms.length === 0) {
      tapPad.play();
    }
    y = +$(this).data("row");
    x = +$(this).data("col");
    return tapPad.addAtom(x, y);
  });
  runLoop = function() {
    return tapPad.step();
  };
  $(window).on("keypress", function(e) {
    if (e.keyCode === 32 || e.which === 32) {
      return playToggle();
    }
  });
  return setInterval(runLoop, tapPad.speed);
});