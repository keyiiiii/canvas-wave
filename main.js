(function () {
  var bind = function (fn, me) {
    return function () {
      return fn.apply(me, arguments);
    };
  };

  var Class = {};

  Class.Canvas = (function () {
    function Canvas(options) {
      this.draw = bind(this.draw, this);
      this.removeItem = bind(this.removeItem, this);
      this.addItem = bind(this.addItem, this);
      this.stopAnimation = bind(this.stopAnimation, this);
      this.startAnimation = bind(this.startAnimation, this);
      this.onTick = bind(this.onTick, this);
      this.tick = bind(this.tick, this);
      this.events = bind(this.events, this);
      this.items = [];
      this.fps = 30;
      if (!(options && options.canvasId)) {
        return;
      }
      this.el = document.getElementById(options.canvasId);
      var $wrapper = $('#' + options.canvasWrapperId);
      var wrapperWidth = $wrapper.width();
      var wrapperHeight = $wrapper.height();
      this.width = this.el.width = options.width || wrapperWidth || 800;
      this.height = this.el.height = options.height || wrapperHeight || 800;
      this.ctx = this.el.getContext("2d");
      this.ctx.save();
      this.events();
      this.startAnimation();
    }

    Canvas.prototype.events = function () {
      return this.el.addEventListener('tick', this.onTick, false);
    };

    Canvas.prototype.tick = function () {
      return this.el.dispatchEvent(new Event('tick'));
    };

    Canvas.prototype.onTick = function () {
      return this.draw();
    };

    Canvas.prototype.startAnimation = function () {
      this.draw();
      return this.interval = setInterval(this.tick, Math.floor(1000 / this.fps));
    };

    Canvas.prototype.stopAnimation = function () {
      if (this.interval !== null) {
        return clearInterval(this.interval);
      }
    };

    Canvas.prototype.addItem = function (_id, _instance, _zIndex) {
      var _maxZIndexItem;
      if (!(_id && _instance)) {
        return false;
      }
      if (_zIndex === null) {
        _maxZIndexItem = _.max(this.items, function (item) {
          return item.zIndex;
        });
        _zIndex = _maxZIndexItem.zIndex + 1;
      }
      return this.items.push({
        id: _id,
        instance: _instance,
        zIndex: _zIndex
      });
    };

    Canvas.prototype.removeItem = function (_id) {
      var _item;
      _item = _.findWhere(this.items, {
        id: _id
      });
      if (_item) {
        return this.items = _.without(this.items, _item);
      } else {
        return false;
      }
    };

    Canvas.prototype.draw = function () {
      var _sortItems, i, item, len, results;
      this.ctx.clearRect(0, 0, this.width, this.height);
      if (this.items.length > 0) {
        _sortItems = _.sortBy(this.items, 'zIndex');
        results = [];
        for (i = 0, len = _sortItems.length; i < len; i++) {
          item = _sortItems[i];
          results.push(item.instance.draw());
        }
        return results;
      }
    };

    return Canvas;

  })();


  /*
   * Class.WavePath
   */

  Class.WavePath = (function () {
    function WavePath(canvas, originX, originY, gradStart, gradStop, random) {
      this.random = random;
      this.canvas = canvas;
      this.originX =  originX;
      this.originY =  this.canvas.height - originY;
      this.drawPath = bind(this.drawPath, this);
      this.draw = bind(this.draw, this);
      this.onTick = bind(this.onTick, this);
      this.events = bind(this.events, this);
      if (!(this.canvas && this.canvas && this.originY)) {
        return;
      }
      this.ctx = this.canvas.ctx;
      this.frame = 0;
      this.periodicityRange = random * 100;
      this.amplitudeRange = random * 20 * Math.PI;

      this.ctx.beginPath();
      var grad  = this.ctx.createLinearGradient(100, 100, this.canvas.width / 2, this.canvas.height / 2);
      grad.addColorStop(0.0, gradStart);
      grad.addColorStop(1.0, gradStop);
      this.style = {
        fillStyle: grad
      };
      this.events();
    }

    WavePath.prototype.events = function () {
      return this.canvas.el.addEventListener('tick', this.onTick, false);
    };

    WavePath.prototype.onTick = function () {
      return this.frame++;
    };

    WavePath.prototype.draw = function () {
      this.ctx.save();
      this.ctx.fillStyle = this.style.fillStyle;
      this.ctx.beginPath();
      this.drawPath();
      this.ctx.closePath();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.fill();
      this.ctx.restore();
    };

    WavePath.prototype.drops = function (height) {
      var circles = [];
      var self = this;
      var randomArray = (self.random * 100000) + '';

      function randomPosition(range, i) {
        return Math.floor(range * (randomArray[i] / 10));
      }

      for (var i = 0; i < this.random * 4; i++) {
        circles.push({
          x: randomPosition(this.canvas.width, i),
          y: randomPosition(height * 5, i),
          radius: randomPosition(30, i)
        });
      }

      for (var c of circles) {
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    };

    WavePath.prototype.drawPath = function () {
      var _amplitude, _i, _periodicity, _y, t, x, y;
      t = this.frame * 2 * (Math.PI / 500);
      _periodicity = 200 + this.periodicityRange; // 周期
      _amplitude = 270 * Math.sin((t + this.amplitudeRange) / 3); // 振幅
      this.drops(_amplitude);
      _y = Math.sin(t);
      this.ctx.moveTo(this.originX, this.originY + _y * _amplitude);
      _i = this.originX;
      while (_i <= this.canvas.width) {
        x = t + (_i - this.originX) / _periodicity;
        y = Math.sin(x);
        this.ctx.lineTo(_i, this.originY + y * _amplitude);
        _i += 10;
      }
      this.ctx.lineTo(_i, this.canvas.height);
      this.ctx.lineTo(this.originX, this.canvas.height);
    };

    return WavePath;

  })();

  /*
   * Run
   */

  $(function () {
    window.Canvas = new Class.Canvas({
      canvasId: 'canvas',
      canvasWrapperId: 'canvas-container',
    });
    var random1 = Math.random();
    var random2 = Math.random();
    Canvas.addItem('sin0', new Class.WavePath(Canvas, 0, 250, 'rgba(244, 203, 97, .6)', 'rgba(244, 233, 134, 1)', random1), 0);
    Canvas.addItem('sin1', new Class.WavePath(Canvas, 0, 320, 'rgba(143, 194, 66, 1)', 'rgba(181, 217, 186, .6)', random2), 1);
  });


})();