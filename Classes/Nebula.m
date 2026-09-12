//
//  Nebula.m
//  Void
//
//  Created for VOID on 2/9/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "Nebula.h"


@implementation Nebula

@synthesize size, drag, energyRegen, shieldRegen, armorRegen;

- (id)initWithDictionary:(NSDictionary *)data {
  [super init];
  
  texture = [[Texture textureNamed:[data objectForKey:@"texture"]] retain];
  
  pos.x       = [[data valueForKeyPath:@"position.x"] floatValue];
  pos.y       = [[data valueForKeyPath:@"position.y"] floatValue];
  
  size        = [[data objectForKey:@"size"]        floatValue] * 1.1;
  angle       = (GLfloat)(rand() % 360);
  opacity     = [[data objectForKey:@"opacity"]     floatValue];
  
  drag        = [[data objectForKey:@"drag"]        floatValue];
  energyRegen = [[data objectForKey:@"energyRegen"] floatValue];
  shieldRegen = [[data objectForKey:@"shieldRegen"] floatValue];
  armorRegen  = [[data objectForKey:@"armorRegen"]  floatValue];
  
  return self;
}

- (void)dealloc {
  [texture release];
  [super dealloc];
}


- (void)update {
  angle += 0.25;
}

- (void)render {
  GLfloat vertices[] = {
     0.5,  0.5,
    -0.5,  0.5,
     0.5, -0.5,
    -0.5, -0.5,
  };
  
  GLshort textureCoords[] = {
    0, 1,
    1, 1,
    0, 0,
    1, 0,
  };
  
  // Position
  glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
  glTranslatef(pos.x, pos.y, pos.z);
  glRotatef(angle, 0.0, 0.0, 1.0);
  glScalef(size, size, size);
  
  // Load vertices
  glVertexPointer(2, GL_FLOAT, 0, vertices);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load texture coordinates
  glTexCoordPointer(2, GL_SHORT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Vertex colors
  glDisableClientState(GL_COLOR_ARRAY);
  glColor4f(1.0, 1.0, 1.0, opacity * 0.75);
  
  // Render
  [texture enable];
  
  // First layer
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  
  // Second layer
  glRotatef(-angle - angle/2, 0.0, 0.0, 1.0);
  GLfloat scaleFactor = sin([Utility deg2rad:angle]*4)/6 + 0.8;
  glScalef(scaleFactor, scaleFactor, scaleFactor);
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  
  [texture disable];
}

@end
