//
//  StarField.h
//  GLBalls
//
//  Created for VOID on 9/14/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Vector.h"
#import "Bench.h"

@interface StarField : NSObject {
  // Center of Starfield
  Vector *pos;
  
  // The maximum distance along each dimension form the center that a particle will spawn
  Vector *spawnArea;
  
  // Number of stars
  int qty;
  
  // Size
  float minSize;
  float maxSize;
  
  // Buffers
  GLuint modelBuffer;
  GLuint colorBuffer;
  GLuint sizeBuffer;
  
  Bench *benchUpdate;
}

- (id)initWithPos:(Vector *)position quantity:(int)numberOfStars spawnArea:(Vector *)aSpawnArea sizeMin:(GLfloat)min sizeMax:(GLfloat)max;

- (void)update;
- (void)render;

@property (copy) Vector *pos;
@property (copy) Vector *spawnArea;
@property (assign) int qty;

@end
