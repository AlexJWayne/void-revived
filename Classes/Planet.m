//
//  Planet.m
//  Void
//
//  Created for VOID on 9/19/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Planet.h"
#include "Game.h"

@class Game;

@implementation Planet

#define GRAVITY 0.0025

@synthesize size, gravity;

- (id)initWithImage:(NSString *)imageName size:(GLfloat)aSize {
  [self init];
  
  spriteTexture = [[Texture textureNamed:imageName] retain];
  size = aSize;
  gravity = [imageName rangeOfString:@"Ring"].location != NSNotFound ? 0.0 : pow(size, 1.75);
  gravity *= GRAVITY;
  
  return self;
}

- (void)render {
  GLfloat vertices[] = {
     0.5f, 0.5f,
    -0.5f, 0.5f,
     0.5f,-0.5f,
    -0.5f,-0.5f,
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
  
  // rotate to face camera
  glRotatef(25.0,
            cos([Utility deg2rad:[Game sharedGame].angle]),
            sin([Utility deg2rad:[Game sharedGame].angle]),
            0.0);
  
  // Scale planet
  glScalef(size, size, 1);
  
  // Load vertices
  glVertexPointer(2, GL_FLOAT, 0, vertices);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load texture coordinates
  glTexCoordPointer(2, GL_SHORT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Vertices should be white
  glDisableClientState(GL_COLOR_ARRAY);
  glColor4f(1.0, 1.0, 1.0, 1.0);
  
  // Render
  [spriteTexture enable];
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  [spriteTexture disable];
  
}

- (void)dealloc {
  NSLog(@"Dealloc Planet");
  [spriteTexture release];
  [super dealloc];
}

@end
