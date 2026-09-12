//
//  SpaceObject.h
//  Void
//
//  Created for VOID on 9/19/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import "Vector.h"


@interface SpaceObject : NSObject <NSCoding> {
  Vector *pos;
  Vector *vel;
  Vector *accel;
  
  GLfloat angle;
}

@property (copy) Vector *pos;
@property (copy) Vector *vel;
@property (copy) Vector *accel;

@property (readwrite) GLfloat angle;


- (void)update;
- (void)updateAngle;
- (void)updateAccel;
- (void)updateVel;
- (void)updatePos;

- (void)render;

@end
