//
//  Button.m
//  Void
//
//  Created for VOID on 9/18/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Button.h"


@implementation Button

// Quad vertices
const GLfloat vertices[] = {
  0.0, 1.0,
  1.0, 1.0,
  0.0, 0.0,
  1.0, 0.0,
};

// Load default GUI matrix for drawing.
// 1 unit equals 1 pixel
// 0,0 is in the top left
// +x is to the right
// +y is down
+ (void)loadIdentity {
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
	glTranslatef(-240.0, 160.0, 0.0);
	glScalef(1.0, -1.0, 1.0);
}

// Create a new Button with a size and an image.
- (id)initInRect:(CGRect)rect texFrame:(CGRect)aTexFrame {
  [super init];
  
  // Save frame rect
  frame = rect;
  texFrame = aTexFrame;
  
  // Create button texture map
  //buttonTex = [[Texture textureNamed:@"UIAtlas.png"] retain];
  
  // Correct texture coords
  texFrame = CGRectMake(texFrame.origin.x/256.0, texFrame.origin.y/256.0, texFrame.size.width/256.0, texFrame.size.height/256.0);
  
  return self;
}


- (void)update {
  //...
}

- (void)render {
  // Create texture coords
  GLfloat textureCoords[] = {
    texFrame.origin.x,                        texFrame.origin.y + texFrame.size.height,
    texFrame.origin.x + texFrame.size.width,  texFrame.origin.y + texFrame.size.height,
    texFrame.origin.x,                        texFrame.origin.y,
    texFrame.origin.x + texFrame.size.width,  texFrame.origin.y,
  };
  
  // Position
  [Button loadIdentity];
  glTranslatef((GLfloat)frame.origin.x, (GLfloat)frame.origin.y, 0.0);
  glScalef((GLfloat)frame.size.width, (GLfloat)frame.size.height, 1.0);
  
  // Load vertices
  glVertexPointer(2, GL_FLOAT, 0, vertices);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load texture coordinates
  glTexCoordPointer(2, GL_FLOAT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Vertices should be white
  glDisableClientState(GL_COLOR_ARRAY);
  glColor4f(1.0, 1.0, 1.0, 1.0);
  
  // Render
  //[buttonTex enable];
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  //[buttonTex disable];
}

- (void)dealloc {
  [buttonTex release];
  [super dealloc];
}

@end
