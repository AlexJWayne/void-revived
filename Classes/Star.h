//
//  Ball.h
//  GLBalls
//
//  Created for VOID on 9/13/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>

#import "Vector.h"
#import "Bench.h"

static GLuint modelName;

@interface Star : NSObject {
  Vector *pos;
  GLfloat size;
  GLfloat rotation;
  GLubyte color;
  
  Bench *bench;
}

+ (void)prepRender;
+ (void)cleanupRender;

- (id)initWithSpawnArea:(Vector *)spawnArea atPosition:(Vector *)position;

- (void)updateWithParentPos:(Vector *)parentPos spawnArea:(Vector *)spawnArea;
- (void)render;

- (void)setSizeMin:(GLfloat)min max:(GLfloat)max;

@property (copy) Vector *pos;
@property (readwrite) GLfloat size;

@end
