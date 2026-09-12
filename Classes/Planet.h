//
//  Planet.h
//  Void
//
//  Created for VOID on 9/19/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import "SpaceObject.h"
#import "Texture.h"
#import "Vector.h"

@interface Planet : SpaceObject {
  Texture *spriteTexture;
  GLfloat size;
  GLfloat gravity;
}

@property (readonly) GLfloat gravity;
@property (readonly) GLfloat size;

- (id)initWithImage:(NSString *)imageName size:(GLfloat)aSize;

@end
