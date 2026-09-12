var Stage = {
  enemies: [],
  nebulas: [],
  planets: [],
  galaxyLocation: [0, 0],
  tier: 1,
  zone: 0,
  connections: [],
  music: 'MusicHyperspace',
  
  selected: {
    type: null,
    id: null
  },
  
  
  onLoad: function() {
    Stage.hypergate = new Hypergate();
    $('map').appendChild(Stage.hypergate.marker);
    
    var hash = window.location.hash;
    if (hash) {
      Stage.import(unescape(hash.substring(1, hash.length)));
    }
    
    Stage.periodicRefresh();
  },
    
  addEnemy: function() {
    Stage.enemies.push(new Enemy());
    Stage.refresh();
  },
  
  addPlanet: function() {
    Stage.planets.push(new Planet());
    Stage.refresh();
  },
  
  addNebula: function() {
    Stage.nebulas.push(new Nebula());
    Stage.refresh();
  },
  
  select: function(type, id) {
    if (type != this.selected.type || id != this.selected.id) {
      this.deselect();
      this.selected.type = type;
      this.selected.id   = id;
      
      Element.addClassName(type +'_marker_'+ id, 'selected_object');
      
      // Show only this detail panel
      var planetList = $('planetList');
      var enemyList = $('enemyList');
      var nebulaList = $('nebulaList');
      
      [enemyList, planetList, nebulaList].invoke('hide');
      
      if (type == 'enemy')  enemyList.show();
      if (type == 'planet') planetList.show();
      if (type == 'nebula') nebulaList.show();
      
      
      ['enemy', 'planet', 'nebula'].each(function(objType) {
        $$('#'+ objType +'List li').each(function(li, index) {
          if (type == objType && id == index) {
            li.show();
          } else {
            li.hide();
          }
        });
      });
    } else {
      this.deselect();
    }
  },
  
  deselect: function() {
    
    this.selected.type = null;
    this.selected.id   = null;
    
    ['enemy', 'planet', 'nebula'].each(function(objType) {
      $$('#'+ objType +'List li').each(function(li, index) {
        li.show();
        $(objType +'_marker_'+ index).removeClassName('selected_object');
      });
    })
  },
  
  refresh: function() {
    var planetList = $('planetList');
    var nebulaList = $('nebulaList');
    var list = $('enemyList');
    var map = $('map');
    
    planetList.innerHTML = '';
    nebulaList.innerHTML = '';
    list.innerHTML = '';
    map.innerHTML = '';
    
    // Update global fields
    $('galaxy_loc_x').value = Stage.galaxyLocation[0];
    $('galaxy_loc_y').value = Stage.galaxyLocation[1];
    $('music').value = Stage.music;
    $('zone').value = Stage.zone;
    $('tier').value = Stage.tier;
    $('connections').value = Stage.connections.join(', ');
    $('description').value = Stage.description;
    
    map.appendChild(Stage.hypergate.marker);
    
    Stage.planets.each(function(planet) {
      planet.refresh();
      planetList.appendChild(planet.controls());
      map.appendChild(planet.marker);
    });
    
    Stage.nebulas.each(function(nebula) {
      nebula.refresh();
      nebulaList.appendChild(nebula.controls());
      map.appendChild(nebula.marker);
    });
    
    Stage.enemies.each(function(enemy) {
      enemy.refresh();
      list.appendChild(enemy.controls());
      enemy.positionMarker();
      map.appendChild(enemy.marker);
    })
        
  },
  
  periodicRefresh: function() {
    Stage.hypergate.refresh();
    Stage.enemies.invoke('refresh');
    Stage.planets.invoke('refresh');
    setTimeout(Stage.periodicRefresh, 2000);
  },
  
  save: function() {
    var field = $('stage_data');
    
    field.value = Object.toJSON(Stage);
    field.show();
    field.focus();
    field.select();
    field.onblur = function() { this.hide() };
    
    window.location.hash = '#'+ escape(field.value);
  },
  
  load: function(stageName) {
    if (stageName == undefined) return;
    
    var e = document.createElement("script");
    e.src = '/github_proxy?stage='+ encodeURIComponent(stageName);
    e.type="text/javascript";
    document.getElementsByTagName("head")[0].appendChild(e);
    
    $('stage_link').href = "../../Assets/Stages/"+ encodeURIComponent(stageName) +".json";
  },
  
  import: function(stringData) {
    if (stringData) {
      if (stringData.length == 0) return false;
      var data = stringData.evalJSON();
      
      Stage.tier = data.tier;
      Stage.zone = data.zone;
      Stage.connections = data.connections;
      Stage.description = data.description;
      Stage.galaxyLocation = data.galaxyLocation;
      Stage.hypergate.setLocation('x', data.hypergate.location[0]);
      Stage.hypergate.setLocation('y', data.hypergate.location[1]);
      Stage.music = data.music;
      
      // Planets
      Stage.planets = [];
      if (data.planets == null) data.planets = [];
      
      data.planets.each(function(planetData) {
        var planet = new Planet();
        planet.setName(planetData.name);
        planet.setRadius(planetData.radius);
        planet.setLocation('x', planetData.location[0]);
        planet.setLocation('y', planetData.location[1]);
        
        Stage.planets.push(planet);
      });
      
      // Nebulas
      Stage.nebulas = [];
      if (data.nebulas == null) data.nebulas = [];
      data.nebulas.each(function(nebulaData) {
        var nebula = new Nebula();
        nebula.texture = nebulaData.texture;
        nebula.setRadius(nebulaData.radius);
        nebula.setLocation('x', nebulaData.location[0]);
        nebula.setLocation('y', nebulaData.location[1]);
        nebula.opacity      = nebulaData.opacity;
        nebula.drag         = nebulaData.drag;
        nebula.energyRegen  = nebulaData.energyRegen;
        nebula.shieldRegen  = nebulaData.shieldRegen;
        nebula.armorRegen   = nebulaData.armorRegen;
        
        Stage.nebulas.push(nebula);
      });
      
      // Enemies
      Stage.enemies = [];
      data.enemies.each(function(enemyData) {
        var enemy = new Enemy();
        enemy.setName(enemyData.name);
        
        if (enemyData.mode) {
          enemy.setMode(enemyData.mode);
        } else {
          enemy.setMode('pos');
        }
        
        enemy.setLocation('x', enemyData.location[0]);
        enemy.setLocation('y', enemyData.location[1]);
        
        enemy.qty = enemyData.qty;
        enemy.chance = enemyData.chance;
        
        enemy.optional = enemyData.optional;
        
        enemy.setColor(enemyData.color);
        Stage.enemies.push(enemy);
      });
      
      Stage.refresh();
      
    } else {
      var field = $('stage_data');
      field.value = '';
      field.show();
      field.focus();
      field.onblur = function() { Stage.import(this.value); this.hide(); }
    }
    
  }
};
