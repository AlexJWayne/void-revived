var Nebula = Class.create(Enemy, {
  initialize: function($super) {
    $super();
    
    this.setName('Moon');
    this.setLocation('x', parseInt(Math.random() * 160 - 80));
    this.setLocation('y', parseInt(Math.random() * 160 - 80));
    this.index = Stage.nebulas.length;
    this.setColor();
    this.texture = 'Nebula.Green'
    
    this.drag        = 2.0;
    this.energyRegen = 0;
    this.shieldRegen = 0;
    this.armorRegen  = 0;
    this.opacity     = 0.5;
    
    
    this.marker.addClassName = 'nebula';
    this.marker.onclick = "Stage.select('nebula', "+ this.index +")";
    
    this.setRadius(12);
  },
  
  controls : function() {
    var li = new Element('li').update(''+
      '<label>Texture:</label>'+
      '<select id="nebula_texture_'+ this.index +'" onchange="Stage.nebulas['+ this.index +'].texture = this.value">'+
      '  <option value="Nebula.Green">Green</option>'+
      '  <option value="Nebula.Red">Red</option>'+
      '</select>'+
      '<script language="javascript>$("nebula_texture_'+ this.index +'").value = "'+ this.texture +'"</script>'+
      '<br/>'+
      '<a href="#" title="Delete" onclick="Stage.nebula['+ this.index +'].delete()"/>Delete</a> '+
      
      '<label>Radius:</label>'+
      '<input type="textfield" id="nebula_radius_'+ this.index +'" size="2" value="'+ this.radius +'" onblur="Stage.nebulas['+ this.index +'].setRadius(parseInt(this.value))"/>'+
      '<br/>'+
      
      '<label>Location:</label>'+
      '<input type="textfield" id="nebula_loc_x_'+ this.index +'" name="loc[x]" size="2" value="'+ this.location[0] +'" onblur="Stage.nebulas['+ this.index +'].setLocation(\'x\', this.value)"/>'+
      '<input type="textfield" id="nebula_loc_y_'+ this.index +'" name="loc[y]" size="2" value="'+ this.location[1] +'" onblur="Stage.nebulas['+ this.index +'].setLocation(\'y\', this.value)"/>'+
      '<br/>'+
      
      '<label>Opacity:</label>'+
      '<input type="textfield" id="nebula_opacity_'+ this.index +'" size="3" value="'+ this.opacity +'" onblur="Stage.nebulas['+ this.index +'].opacity = parseFloat(this.value)"/>'+
      '<br/>'+
      
      '<label>Drag:</label>'+
      '<input type="textfield" id="nebula_drag_'+ this.index +'" size="3" value="'+ this.drag +'" onblur="Stage.nebulas['+ this.index +'].drag = parseFloat(this.value)"/>'+
      '<br/>'+
      
      '<label>Energy Regen:</label>'+
      '<input type="textfield" id="nebula_energy_regen_'+ this.index +'" size="2" value="'+ this.energyRegen +'" onblur="Stage.nebulas['+ this.index +'].energyRegen = parseFloat(this.value)"/>'+
      '<br/>'+
      
      '<label>Shield Regen:</label>'+
      '<input type="textfield" id="nebula_shield_regen_'+ this.index +'" size="2" value="'+ this.shieldRegen +'" onblur="Stage.nebulas['+ this.index +'].shieldRegen = parseFloat(this.value)"/>'+
      '<br/>'+
      
      '<label>Armor Regen:</label>'+
      '<input type="textfield" id="nebula_armor_regen_'+ this.index +'" size="2" value="'+ this.armorRegen +'" onblur="Stage.nebulas['+ this.index +'].armorRegen = parseFloat(this.value)"/>'+
      '<br/>'+
      
      '');
      
    return li;
  },
  
  setLocation: function(dim, value, dontPlace) {
    var dimIndex = (dim == 'x') ? 0 : 1;
    this.location[dimIndex] = parseInt(value);
    
    var field = $('nebula_loc_'+ dim +'_'+ this.index);
    if (field) field.value = value;
    
    if (!dontPlace) this.positionMarker();
  },
  
  setPosition: function(draggable) {
    var coords = [parseInt(draggable.element.style.left), parseInt(draggable.element.style.top)];
    
    var nebulaId = parseInt(draggable.element.id.replace('nebula_marker_', ''))
    var nebula = Stage.nebulas[nebulaId];
    nebula.setLocation('x',  (coords[0] - 400 + nebula.radius*5)/5, true);
    nebula.setLocation('y', -(coords[1] - 400 + nebula.radius*5)/5, true);
  },
  
  refresh: function($super) {
    $super();
    this.marker.id = 'nebula_marker_'+ this.index;
    this.marker.onclick = function() { Stage.select("nebula", this.index) }.bind(this);
    this.marker.innerHTML = '';
    this.marker.appendChild(new Element('img', { src: 'nebulas/'+ this.texture +'.png', width: this.radius*10, height:this.radius*10 }));
    this.marker.title = "Nebula ("+ this.location.join(',') + ")";
    this.setColor();
  },
  
  setRadius: function(radius) {
    this.radius = radius;
    this.marker.style.width  = this.radius*10;
    this.marker.style.height = this.radius*10;
    this.refresh();
    this.setColor();
  },
  
  setColor: function() {
    this.marker.style.backgroundColor = 'transparent';
  },
  
  delete: function() {
    Stage.nebulas = Stage.nebulas.without(this);
    
    Stage.nebulas.each(function(nebula, i) {
      nebula.index = i;
    });
    
    Stage.refresh();
  },
});