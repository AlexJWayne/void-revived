var Planet = Class.create(Enemy, {
  initialize: function($super) {
    $super();
    
    this.setName('Moon');
    this.setLocation('x', parseInt(Math.random() * 160 - 80));
    this.setLocation('y', parseInt(Math.random() * 160 - 80));
    this.index = Stage.planets.length;
    this.setColor();
    
    this.marker.addClassName = 'planet';
    this.marker.onclick = "Stage.select('planet', "+ this.index +")";
    
    this.setRadius(4);
  },
  
  controls : function() {
    var li = new Element('li').update(''+
      '<label>Type:</label>'+
      '<select id="planet_name_'+ this.index +'" onchange="Stage.planets['+ this.index +'].setName(this.value)">'+
      '  <option>Crystal1</option>'+
      '  <option>Crystal2</option>'+
      '  <option>Crystal3</option>'+
      '  <option>Cyber1</option>'+
      '  <option>Cyber2</option>'+
      '  <option>Cyber3</option>'+
      '  <option>Energy1</option>'+
      '  <option>Energy2</option>'+
      '  <option>Energy3</option>'+
      '  <option>Organic1</option>'+
      '  <option>Organic2</option>'+
      '  <option>Organic3</option>'+
      '  <option>Acid</option>'+
      '  <option>Blue</option>'+
      '  <option>Exploding</option>'+
      '  <option>Gas</option>'+
      '  <option>Green</option>'+
      '  <option>Ice</option>'+
      '  <option>Moon</option>'+
      '  <option>Red</option>'+
      '  <option>RingWide</option>'+
      '  <option>Volcanic</option>'+
      '  <option>Water</option>'+
      '</select>'+
      '<script language="javascript>$("planet_name_'+ this.index +'").value = "'+ this.name +'"</script>'+
      '<br/>'+
      '<a href="#" title="Delete" onclick="Stage.planets['+ this.index +'].delete()"/>Delete</a> '+
      
      '<label>Radius:</label>'+
      '<input type="textfield" id="planet_radius_'+ this.index +'" size="2" value="'+ this.radius +'" onblur="Stage.planets['+ this.index +'].setRadius(parseInt(this.value))"/>'+
      '<br/>'+
      
      '<label>Location:</label>'+
      '<input type="textfield" id="planet_loc_x_'+ this.index +'" name="loc[x]" size="2" value="'+ this.location[0] +'" onblur="Stage.planets['+ this.index +'].setLocation(\'x\', this.value)"/>'+
      '<input type="textfield" id="planet_loc_y_'+ this.index +'" name="loc[y]" size="2" value="'+ this.location[1] +'" onblur="Stage.planets['+ this.index +'].setLocation(\'y\', this.value)"/>'+
      '');
      
    return li;
  },
  
  setLocation: function(dim, value, dontPlace) {
    var dimIndex = (dim == 'x') ? 0 : 1;
    this.location[dimIndex] = parseInt(value);
    
    var field = $('planet_loc_'+ dim +'_'+ this.index);
    if (field) field.value = value;
    
    if (!dontPlace) this.positionMarker();
  },
  
  setPosition: function(draggable) {
    var coords = [parseInt(draggable.element.style.left), parseInt(draggable.element.style.top)];
    
    var planetId = parseInt(draggable.element.id.replace('planet_marker_', ''))
    var planet = Stage.planets[planetId];
    planet.setLocation('x',  (coords[0] - 400 + planet.radius*5)/5, true);
    planet.setLocation('y', -(coords[1] - 400 + planet.radius*5)/5, true);
  },
  
  refresh: function($super) {
    $super();
    this.marker.id = 'planet_marker_'+ this.index;
    this.marker.onclick = function() { Stage.select("planet", this.index) }.bind(this);
    this.marker.innerHTML = '';
    this.marker.appendChild(new Element('img', { src: 'planets/Planet.'+ this.name +'.png', width: this.radius*10, height:this.radius*10 }));
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
    Stage.planets = Stage.planets.without(this);
    
    Stage.planets.each(function(planet, i) {
      planet.index = i;
    });
    
    Stage.refresh();
  },
});