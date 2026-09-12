//
//  Gauge.m
//  Void
//
//  Created for VOID on 10/4/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Gauge.h"
#include "Button.h"
@class Button;

@implementation Gauge

@synthesize value;

- (id)initInRect:(CGRect)aFrame texFrame:(CGRect)aTexFrame {
  [super init];
  frame = aFrame;
  texFrame = CGRectMake(aTexFrame.origin.x/256.0, aTexFrame.origin.y/256.0, aTexFrame.size.width/256.0, aTexFrame.size.height/256.0);
  //bgTexFrame = CGRectMake(193.0/256.0, 128.0/256.0, 20.0/256.0, 100.0/256.0);
  
  //texture = [[Texture textureNamed:@"UIAtlas.png"] retain];
  
  return self;
}

- (void)render {
  GLfloat displayHeight = frame.size.height * value;
  
  // Position
  [Button loadIdentity];
  glTranslatef(frame.origin.x, frame.origin.y, 0.0);
  
  GLfloat vertices[] = {
    0.0,              frame.size.height,
    frame.size.width, frame.size.height,
    0.0,              frame.size.height - displayHeight,
    frame.size.width, frame.size.height - displayHeight,
  };
  
  GLfloat textureCoords[] = {
    texFrame.origin.x,                        texFrame.origin.y + texFrame.size.height,
    texFrame.origin.x + texFrame.size.width,  texFrame.origin.y + texFrame.size.height,
    texFrame.origin.x,                        texFrame.origin.y + texFrame.size.height*(1.0-value),
    texFrame.origin.x + texFrame.size.width,  texFrame.origin.y + texFrame.size.height*(1.0-value),
  };
  
  // Load vertices
  glVertexPointer(2, GL_FLOAT, 0, vertices);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load texture coordinates
  glTexCoordPointer(2, GL_FLOAT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Vertices should be white
  glDisableClientState(GL_COLOR_ARRAY);
  glColor4ub(255, 255, 255, 255);
  
  // Render
  //[texture enable];
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  
  
  
//  // Render empty gauge
//  GLfloat bgVerts[] = {
//    0.0,              frame.size.height - displayHeight,
//    frame.size.width, frame.size.height - displayHeight,
//    0.0,              0.0,
//    frame.size.width, 0.0,
//  };
//  
//  GLfloat bgTextureCoords[] = {
//    bgTexFrame.origin.x,                          bgTexFrame.origin.y + bgTexFrame.size.height*(1.0-value),
//    bgTexFrame.origin.x + bgTexFrame.size.width,  bgTexFrame.origin.y + bgTexFrame.size.height*(1.0-value),
//    bgTexFrame.origin.x,                          bgTexFrame.origin.y,
//    bgTexFrame.origin.x + bgTexFrame.size.width,  bgTexFrame.origin.y,
//  };
//  
//  // Load vertices
//  glVertexPointer(2, GL_FLOAT, 0, bgVerts);
//  glEnableClientState(GL_VERTEX_ARRAY);
//  
//  // Load texture coordinates
//  glTexCoordPointer(2, GL_FLOAT, 0, bgTextureCoords);
//	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
//  
//  // Render
//  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
//  //[texture disable];
}

- (void)dealloc {
  //[texture release];
  [super dealloc];
}

@end
