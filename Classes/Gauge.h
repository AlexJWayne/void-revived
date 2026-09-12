//
//  Gauge.h
//  Void
//
//  Created for VOID on 10/4/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import "Texture.h"

@interface Gauge : NSObject {
  CGRect frame;
  CGRect texFrame;
  //CGRect bgTexFrame;
  GLfloat value;
  
  //Texture *texture;
}

@property (readwrite) GLfloat value;

- (id)initInRect:(CGRect)aFrame texFrame:(CGRect)aTexFrame;

- (void)render;

@end
