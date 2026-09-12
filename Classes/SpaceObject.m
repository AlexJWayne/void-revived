//
//  SpaceObject.m
//  Void
//
//  Created for VOID on 9/19/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "SpaceObject.h"


@implementation SpaceObject

@synthesize pos, vel, accel, angle;

- (id)init {
  [super init];
  pos   = [[Vector alloc] init];
  vel   = [[Vector alloc] init];
  accel = [[Vector alloc] init];
  return self;
}

- (id)initWithCoder:(NSCoder*)coder {
	[super init];
	pos = [[coder decodeObjectForKey:@"pos"] retain];
	vel = [[coder decodeObjectForKey:@"vel"] retain];
	accel = [[coder decodeObjectForKey:@"accel"] retain];
	angle = [coder decodeFloatForKey:@"angle"];
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[coder encodeObject:pos forKey:@"pos"];
	[coder encodeObject:vel forKey:@"vel"];
	[coder encodeObject:accel forKey:@"accel"];
	[coder encodeFloat:angle forKey:@"angle"];
}



- (void)update {
  [self updateAngle];
  [self updateAccel];
  [self updateVel];
  [self updatePos];
}

- (void)updateAngle {
  while (angle <   0.0) { angle += 360.0; }
  while (angle > 360.0) { angle -= 360.0; }
}

- (void)updateAccel {
  //...
}

- (void)updateVel {
  [vel add:accel];
}

- (void)updatePos {
  [pos add:vel];
  
  // Keep in the stage bounds.
  if ([pos length] > 80.0) {
    [pos normalize];
    [pos scale:79.95];
    
    GLfloat posAngle = [pos angle2D];        
    [vel rotateOnZ:-posAngle];
    if (vel.y > 0.0) vel.y *= -1;
    [vel rotateOnZ:posAngle];
  }
}

- (void)render {
  //...
}

- (void)dealloc {
  [accel release];
  [vel release];
  [pos release];
  [super dealloc];
}


@end
