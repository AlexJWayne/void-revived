var Enemy = Class.create({
  initialize: function() {
    this.index = Stage.enemies.length;
    this.mode = 'pos';
    this.qty = [1, 1];
    this.chance = 1.0;
    this.optional = false;
    this.radius = 1;
    this.firstOnly = false;
    
    this.marker = new Element('div', {
      class:'enemy',
      id:'enemy_marker_'+this.index,
      onclick:"Stage.select('enemy', "+ this.index +")"
    });
    new Draggable(this.marker, { snap:[5, 5], onDrag:this.setPosition });
    
    
    this.setName("New Enemy");
    
    if (this.similarEnemies().length > 1) {
      this.setColor(this.similarEnemies()[0].color);
    } else {
      this.randomizeDisplayColor();
    }
    
    this.marker.style.width  = this.radius*10;
    this.marker.style.height = this.radius*10;
    
    this.location = [2, 2];
  },
  
  controls : function() {
    var li = new Element('li').update(''+
      '<div class="colorSwatch" id="color_swatch_'+ this.index +'" style="background-color: '+ this.color +'" onclick="Stage.enemies['+ this.index +'].randomizeDisplayColor()" title="Randomize Color"></div>'+
      '<label>Type:</label> <input type="textfield" name="name" value="'+ this.name +'" onblur="Stage.enemies['+ this.index +'].setName(this.value)"/><br/>'+
      '<label>Optional:</label><input type="checkbox" value="1" '+ (this.optional ? 'checked="true"' : '') +' onclick="Stage.enemies['+ this.index +'].optional = this.checked"/><br/>'+
      '<label>Mode:</label>'+
      '<input type="radio" name="mode_'+ this.index +'" value="pos" '+ (this.mode == 'pos' ? 'checked="true"' : '') +'" onclick="Stage.enemies['+ this.index +'].setMode(this.value)"/> Pos &nbsp;&nbsp;'+
      '<input type="radio" name="mode_'+ this.index +'" value="qty" '+ (this.mode == 'qty' ? 'checked="true"' : '') +'" onclick="Stage.enemies['+ this.index +'].setMode(this.value)"/> Qty'+
      
      '<a href="#" title="Delete" onclick="Stage.enemies['+ this.index +'].delete()"/>Delete</a> '+
      '<a href="#" title="Duplicate" onclick="Stage.enemies['+ this.index +'].copy()"/>Dup</a>'+
      
      '<div id="enemy_location_'+ this.index +'" style="'+ (this.mode == 'pos' ? '' : 'display:none') +'">'+
      '  <label>Location:</label>'+
      '  <input type="textfield" id="enemy_loc_x_'+ this.index +'" name="loc[x]" size="2" value="'+ this.location[0] +'" onblur="Stage.enemies['+ this.index +'].setLocation(\'x\', this.value)"/>'+
      '  <input type="textfield" id="enemy_loc_y_'+ this.index +'" name="loc[y]" size="2" value="'+ this.location[1] +'" onblur="Stage.enemies['+ this.index +'].setLocation(\'y\', this.value)"/>'+
      '  <br/>'+
      '  <label>Chance:</label>'+
      '  <input type="textfield" id="enemy_chance_'+ this.index +'" name="loc[x]" size="2" value="'+ this.chance +'" onblur="Stage.enemies['+ this.index +'].chance = parseFloat(this.value)"/>'+
      '  <input type="checkbox" id="enemy_first_only_'+ this.index +'" onchange="Stage.enemies['+ this.index +'].firstOnly = this.checked"/> First time only'+
      '</div>'+
      
      '<div id="enemy_qty_'+ this.index +'" style="'+ (this.mode == 'qty' ? '' : 'display:none') +'">'+
      '  <label>Min/Max:</label>'+
      '  <input type="textfield" id="enemy_min_'+ this.index +'" name="qty[min]" size="2" value="'+ this.qty[0] +'" onblur="Stage.enemies['+ this.index +'].qty[0] = parseInt(this.value)"/>'+
      '  <input type="textfield" id="enemy_max_'+ this.index +'" name="qty[max]" size="2" value="'+ this.qty[1] +'" onblur="Stage.enemies['+ this.index +'].qty[1] = parseInt(this.value)"/>'+
      '</div>');
      
    return li;
  },
  
  positionMarker: function() {
    this.marker.style.left  =  this.location[0]*5 + 400 - this.radius*5;
    this.marker.style.top   = -this.location[1]*5 + 400 - this.radius*5;
  },
  
  setLocation: function(dim, value, dontPlace) {
    var dimIndex = (dim == 'x') ? 0 : 1;
    this.location[dimIndex] = parseInt(value);
    
    var field = $('enemy_loc_'+ dim +'_'+ this.index);
    if (field) field.value = value;
    
    if (!dontPlace) this.positionMarker();
  },
  
  setPosition: function(draggable) {
    var coords = [parseInt(draggable.element.style.left), parseInt(draggable.element.style.top)];
    
    var enemyId = parseInt(draggable.element.id.replace('enemy_marker_', ''))
    var enemy = Stage.enemies[enemyId];
    enemy.setLocation('x',  (coords[0] - 400 + enemy.radius*5)/5, true);
    enemy.setLocation('y', -(coords[1] - 400 + enemy.radius*5)/5, true);
  },
  
  setName: function(newName) {
    this.name = newName;
    this.marker.title = this.name;
    
    if (this.similarEnemies().length <= 1) {
      this.randomizeDisplayColor();
    } else {
      this.setColor(this.similarEnemies()[0].color);
    }
  },
  
  similarEnemies: function() {
    var thisEnemy = this;
    
    var similarEnemies = Stage.enemies.findAll(function(enemy) {
      return enemy.name == thisEnemy.name && thisEnemy != enemy;
    });
    
    similarEnemies.push(this);
    
    return similarEnemies;
  },
  
  randomizeDisplayColor: function() {
    var chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    color = '#'
    zeroComponent = parseInt(Math.random() * 3);
    
    for (var i = 0; i < 3; i++) {
      if (i == zeroComponent) {
        color = color + '0';
      } else {
        color = color + chars[parseInt(Math.random() * 16)];
      }
    }
    
    this.setColor(color);
  },
  
  setColor: function(color) {
    this.similarEnemies().each(function(enemy) {
      enemy.color = color;
      enemy.marker.style.backgroundColor = enemy.color;

      var swatch = $('color_swatch_'+ enemy.index);
      if (swatch) {
        swatch.style.backgroundColor = enemy.color;
      }
    })
  },
  
  refresh: function() {
    this.marker.id = 'enemy_marker_' + this.index;
    this.marker.onclick = function() { Stage.select("enemy", this.index) }.bind(this);
    this.marker.title = this.name;
    
    
    if (this.mode == 'pos') {
      this.marker.title = this.marker.title + ' ('+ this.location.join(',') +') ';
    } else {
      this.marker.title = this.marker.title + ' ('+ this.qty.join('-') +') [position randomized]';
    }
    
    if (this.chance < 1.0) this.marker.title = this.marker.title + (this.chance*100) + '%';
    
    
    this.positionMarker();
  },
  
  delete: function() {
    Stage.enemies = Stage.enemies.without(this);
    
    Stage.enemies.each(function(enemy, i) {
      enemy.index = i;
    });
    
    Stage.refresh();
  },
  
  copy: function() {
    newEnemy = new Enemy();
    Stage.enemies.splice(this.index+1, 0, newEnemy);
    
    Stage.enemies.each(function(enemy, i) {
      enemy.index = i;
    });
    
    newEnemy.setName(this.name);
    newEnemy.setMode('pos');
    newEnemy.setLocation('x', this.location[0] + 1);
    newEnemy.setLocation('y', this.location[1] - 1);
    
    Stage.refresh();
  },
  
  setMode: function(mode) {
    this.mode = mode;
    if (!$('enemy_location_'+this.index)) return;
    
    switch (mode) {
      case 'pos':
        $('enemy_location_'+ this.index).show();
        $('enemy_qty_'+      this.index).hide();
        break;
        
      case 'qty':
        $('enemy_location_'+ this.index).hide();
        $('enemy_qty_'+      this.index).show();
        break;
    }
  }
});