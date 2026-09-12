//
//  Vector.m
//  GLBalls
//
//  Created for VOID on 9/13/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Vector.h"

static Vector *tempVector;

@implementation Vector

@synthesize x, y, z;

+ (void)initialize {
    tempVector = [[Vector alloc] init];
}

+ (Vector*)temp:(Vector*)vectorToCopy {
    if (vectorToCopy) {
        [tempVector setValuesToVector:vectorToCopy];
    } else {
        [tempVector scale:0];
    }
    return tempVector;
}

- (id)init {
  [super init];
  x = 0.0f;
  y = 0.0f;
  z = 0.0f;
  return self;
}

- (id)initWithX:(GLfloat)_x y:(GLfloat)_y z:(GLfloat)_z {
  [self init];
  x = _x;
  y = _y;
  z = _z;
  return self;
}

- (id)initWithVector:(Vector *)aVector {
  return [self initWithX:aVector.x y:aVector.y z:aVector.z];
}

- (id)initWithCoder:(NSCoder*)coder {
	[self init];
	x = [coder decodeFloatForKey:@"x"];
	y = [coder decodeFloatForKey:@"y"];
	z = [coder decodeFloatForKey:@"z"];
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[coder encodeFloat:x forKey:@"x"];
	[coder encodeFloat:y forKey:@"y"];
	[coder encodeFloat:z forKey:@"z"];
}



- (void)add:(Vector *)vector {
  x += vector.x;
  y += vector.y;
  z += vector.z;
}

- (void)subtract:(Vector *)vector {
  x -= vector.x;
  y -= vector.y;
  z -= vector.z;
}

- (void)scale:(GLfloat)factor {
  x *= factor;
  y *= factor;
  z *= factor;
}

- (void)normalize {
  GLfloat length = [self length];
  if (length == 0.0) {
    [self scale:0.0];
  } else {
    [self scale:1.0/[self length]];
  }
  
}

- (void)limit:(GLfloat)maxLength {
  if ([self length] > maxLength) {
    [self normalize];
    [self scale:maxLength];
  }
}

- (void)rotateOnZ:(GLfloat)angleDegrees {
  GLfloat angle = angleDegrees * M_PI / 180;
  
  GLfloat originalX = x;
  GLfloat originalY = y;
  
  x = cos(angle)*originalX - sin(angle)*originalY;
  y = cos(angle)*originalY + sin(angle)*originalX;
}

- (void)rotateOnY:(GLfloat)angleDegrees {
  GLfloat angle = angleDegrees * M_PI / 180;
  
  GLfloat originalX = x;
  GLfloat originalZ = z;
  
  x = cos(angle)*originalX - sin(angle)*originalZ;
  z = cos(angle)*originalZ + sin(angle)*originalX;
}




- (GLfloat)distance2D:(Vector *)vector {
  GLfloat _x = x - vector.x;
  GLfloat _y = y - vector.y;
  
  return (GLfloat)sqrt(_x*_x + _y*_y);
}

- (GLfloat)length {
  return (GLfloat)sqrt(x*x + y*y + z*z);
}

- (GLfloat)dot:(Vector *)otherVector {
  return x*otherVector.x + y*otherVector.y + z*otherVector.z;
}

- (GLfloat)angle2D {
  return atan2(y, x) * 180.0/ M_PI - 90.0;
}


- (void)setValuesToVector:(Vector *)otherVector {
  x = otherVector.x;
  y = otherVector.y;
  z = otherVector.z;
}





- (NSString *)description {
  return [NSString stringWithFormat:@"<Vector x:%f y:%f z:%f>", (float)x, (float)y, (float)z];
}

@end
