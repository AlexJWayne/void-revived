//
//  Vector.h
//  GLBalls
//
//  Created for VOID on 9/13/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>

@interface Vector : NSObject <NSCoding> {
  GLfloat x;
  GLfloat y;
  GLfloat z;
}

@property (readwrite) GLfloat x;
@property (readwrite) GLfloat y;
@property (readwrite) GLfloat z;

+ (Vector*)temp:(Vector*)vectorToCopy;

- (id)initWithX:(GLfloat)_x y:(GLfloat)_y z:(GLfloat)_z;
- (id)initWithVector:(Vector *)aVector;

- (void)add:(Vector *)vector;
- (void)subtract:(Vector *)vector;
- (void)scale:(GLfloat)factor;
- (void)normalize;
- (void)limit:(GLfloat)maxLength;

- (void)rotateOnZ:(GLfloat)angle;
- (void)rotateOnY:(GLfloat)angle;

- (GLfloat)distance2D:(Vector *)vector;
//- (GLfloat)distanceTo:(Vector *)vector;
- (GLfloat)length;
- (GLfloat)dot:(Vector *)otherVector;
- (GLfloat)angle2D;

- (void)setValuesToVector:(Vector *)otherVector;

@end
