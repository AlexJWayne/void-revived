//
//  Model3D.h
//  Void
//
//  Created for VOID on 9/23/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>

@interface Model3D : NSObject {
  NSString *modelName;
  GLuint faceCount;
  
  GLuint modelBuffer;
  GLuint normalBuffer;
  GLuint texCoordsBuffer;
}

@property (readonly) NSString *modelName;

+ (Model3D *)modelNamed:(NSString *)aModelName;
+ (void)drainCache;

- (id)initWithModelNamed:(NSString *)aModelName;

- (void)render;
- (void)renderWithAlpha:(GLfloat)alpha;

@end
