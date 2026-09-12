var Hypergate = Class.create(Enemy, {
  initialize: function($super) {
    $super();
    
    this.setName('Hypergate');
    
    this.setLocation('x', 0);
    this.setLocation('y', 0);
    
    this.marker.id = 'hypergate_marker';
    this.marker.addClassName('hypergate');
    this.marker.onclick = null;
    this.setColor('#000');
    
    this.radius = 3;
    this.marker.style.width  = this.radius*10;
    this.marker.style.height = this.radius*10;
  },
  
  setLocation: function(dim, value, dontPlace) {
    var dimIndex = (dim == 'x') ? 0 : 1;
    this.location[dimIndex] = parseInt(value);
    $('hypergate_loc_'+ dim).value = value;
    
    if (!dontPlace) this.positionMarker();
  },
  
  setPosition: function(draggable) {
    var coords = [parseInt(draggable.element.style.left), parseInt(draggable.element.style.top)];
    
    var gate = Stage.hypergate;
    gate.setLocation('x',  (coords[0] - 400 + gate.radius*5)/5, true);
    gate.setLocation('y', -(coords[1] - 400 + gate.radius*5)/5, true);
  },
  
  refresh: function($super) {
    $super();
    this.marker.id = 'hypergate_marker';
  },
});