//
//  Texture.h
//  Void
//
//  Created for VOID on 9/18/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>

@interface Texture : NSObject {
  NSString *imageName;
	GLuint textureName; // OpenGL name for the sprite texture
  GLuint interpolationType;
}

@property (readonly) NSString *imageName;

+ (Texture *)textureNamed:(NSString *)anImageName;
+ (void)drainCache;

- (id)initWithImageNamed:(NSString *)imageName;

- (void)enable;
- (void)enableWithSrcFunc:(GLenum)srcFunc destFunc:(GLenum)destFunc;
- (void)disable;

@end
