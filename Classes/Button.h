//
//  Button.h
//  Void
//
//  Created for VOID on 9/18/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import "Texture.h"


@interface Button : NSObject {
  CGRect frame;
  CGRect texFrame;
  Texture *buttonTex;
}

+ (void)loadIdentity;

- (id)initInRect:(CGRect)frame texFrame:(CGRect)texFrame;

- (void)update;
- (void)render;

@end
