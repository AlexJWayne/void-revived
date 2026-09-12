//
//  Ball.m
//  GLBalls
//
//  Created for VOID on 9/13/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Star.h"
#import "Vector.h"

@implementation Star

@synthesize pos, size;

+ (void)initialize {
  GLfloat vertices[] = {
     0.f,   0.667f,
    -0.6f, -0.4f,
     0.6f, -0.4f,
  };
  
  glGenBuffers(1, &modelName);
  glBindBuffer(GL_ARRAY_BUFFER, modelName);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  NSLog(@"loaded model into vertex buffer");
}

+ (void)prepRender {
  glBindBuffer(GL_ARRAY_BUFFER, modelName);
  glVertexPointer(2, GL_FLOAT, 0, 0);
  glEnableClientState(GL_VERTEX_ARRAY);
}

+ (void)cleanupRender {
  glBindBuffer(GL_ARRAY_BUFFER, 0);
}

- (id)initWithSpawnArea:(Vector *)spawnArea atPosition:(Vector *)position {
  [super init];
  pos = [[Vector alloc] initWithX:((GLfloat)rand()/RAND_MAX * 2 - 1) * spawnArea.x
                                y:((GLfloat)rand()/RAND_MAX * 2 - 1) * spawnArea.y
                                z:((GLfloat)rand()/RAND_MAX * 2 - 1) * spawnArea.z];
  [pos add:position];
  
  size     = 1.0f;
  color    = rand() % 200;
  rotation = rand() % 360;
  
  //bench = [[Bench alloc] initWithName:@" - - Render Inside Star" reportLimit:600];
  
  return self;
}

- (void)updateWithParentPos:(Vector *)parentPos spawnArea:(Vector *)spawnArea {
  // Wrap X
  if (pos.x - parentPos.x < -spawnArea.x) {
    pos.x += spawnArea.x * 2;
  } else if (pos.x - parentPos.x > spawnArea.x) {
    pos.x -= spawnArea.x * 2;
  }
  
  
  // Wrap Y
  if (pos.y - parentPos.y < -spawnArea.y) {
    pos.y += spawnArea.y * 2;
  } else if (pos.y - parentPos.y > spawnArea.y) {
    pos.y -= spawnArea.y * 2;
  }
}

- (void)setSizeMin:(GLfloat)min max:(GLfloat)max {
  size = (GLfloat)rand()/RAND_MAX * (max - min) + min;
}

- (void)render {
  [bench start];
  
  // Position
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();
  glTranslatef(pos.x, pos.y, pos.z);
  glRotatef(rotation, 0.0f, 0.0f, 1.0f);
  glScalef(size, size, size);
  
  // Render
  glColor4ub(color, color, color, 255);
  glDrawArrays(GL_TRIANGLES, 0, 3);
  
  [bench stop];
}





- (void)dealloc {
  [pos release];
  [super dealloc];
}
@end
