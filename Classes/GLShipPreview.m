//
//  GLShipPreview.m
//  Void
//
//  Created for VOID on 10/3/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <QuartzCore/QuartzCore.h>
#import <OpenGLES/EAGLDrawable.h>

#import "GLShipPreview.h"

#define USE_DEPTH_BUFFER 1

// A class extension to declare private methods
@interface GLShipPreview ()

@property (nonatomic, retain) EAGLContext *context;
@property (nonatomic, assign) NSTimer *animationTimer;

- (BOOL) createFramebuffer;
- (void) destroyFramebuffer;

@end


@implementation GLShipPreview

@synthesize context;
@synthesize animationTimer;
@synthesize animationInterval;


// You must implement this method
+ (Class)layerClass {
  return [CAEAGLLayer class];
}


//The GL view is stored in the nib file. When it's unarchived it's sent -initWithCoder:
- (id)initWithCoder:(NSCoder*)coder {
  if ((self = [super initWithCoder:coder])) {
    // Get the layer
    CAEAGLLayer *eaglLayer = (CAEAGLLayer *)self.layer;
    
    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = [NSDictionary dictionaryWithObjectsAndKeys:
                                    [NSNumber numberWithBool:NO], kEAGLDrawablePropertyRetainedBacking, kEAGLColorFormatRGBA8, kEAGLDrawablePropertyColorFormat, nil];
    
    context = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES1];
    
    if (!context || ![EAGLContext setCurrentContext:context]) {
      [self release];
      return nil;
    }
      
    if ([self respondsToSelector:@selector(contentScaleFactor)]) {
      self.contentScaleFactor = [[UIScreen mainScreen] scale];
    }
  
    animationInterval = 1.0 / 60.0;
  }
  
  // Setup lighting
  GLfloat lightPosition[]  = {  1.0, -0.5, 0.5, 0.0 };
  GLfloat whiteLight[]     = {  1.0, 1.0, 1.0, 1.0 };
  GLfloat lmodelAmbient[]  = {  1.0, 1.0, 1.0, 1.0 };
  glLightfv(GL_LIGHT0, GL_POSITION, lightPosition);
  glLightfv(GL_LIGHT0, GL_DIFFUSE, whiteLight);
  glLightfv(GL_LIGHT0, GL_SPECULAR, whiteLight);
  glLightModelfv(GL_LIGHT_MODEL_AMBIENT, lmodelAmbient);
  glEnable(GL_NORMALIZE);
  glEnable(GL_CULL_FACE);
  
  return self;
}

- (void)displayShipNamed:(NSString *)shipName {
  [EAGLContext setCurrentContext:context];
  [self stopAnimation];
  [ship release];
  if (shipName == nil) {
    ship = nil;
  } else {
    ship = [[Ship alloc] initWithDictionary:[NSDictionary dictionaryWithObjectsAndKeys:shipName, @"type", [NSArray array], @"guns", nil]];
  }
  [self startAnimation];
}

- (void)drawView {
  if (ship) {
    angle -= 1.0;
    ship.angle = angle;
    
    // Setup Frame
    [EAGLContext setCurrentContext:context];
    
    glBindFramebufferOES(GL_FRAMEBUFFER_OES, viewFramebuffer);
    glViewport(0, 0, backingWidth, backingHeight);
    
    // Clear screen for new frame
    glClearColor(0, 0, 0, 255);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    
    
    // Setup camera
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    
    // Create perspective frustrum
    glFrustumf(-1.85, 1.85, -1.0, 1.0, 3.5, 50.0);
    
    // Move camera above play plane
    glTranslatef(0., 0.0, -5.0);
    
    // Rotate the view to slightly down, staying pointed at origin
    glRotatef(-45.0, 1.0, 0.0, 0.0);
    
    // scale the model
    GLfloat scale = 1.0/ship.size;
    glScalef(scale, scale, scale);
    
    
    
    // Render
    [ship render];
    
    // Show frame
    glBindRenderbufferOES(GL_RENDERBUFFER_OES, viewRenderbuffer);
    [context presentRenderbuffer:GL_RENDERBUFFER_OES];    
  }
}















- (void)layoutSubviews {
  [EAGLContext setCurrentContext:context];
  [self destroyFramebuffer];
  [self createFramebuffer];
  [self drawView];
}


- (BOOL)createFramebuffer {
  glGenFramebuffersOES(1, &viewFramebuffer);
  glGenRenderbuffersOES(1, &viewRenderbuffer);
  
  glBindFramebufferOES(GL_FRAMEBUFFER_OES, viewFramebuffer);
  glBindRenderbufferOES(GL_RENDERBUFFER_OES, viewRenderbuffer);
  [context renderbufferStorage:GL_RENDERBUFFER_OES fromDrawable:(CAEAGLLayer*)self.layer];
  glFramebufferRenderbufferOES(GL_FRAMEBUFFER_OES, GL_COLOR_ATTACHMENT0_OES, GL_RENDERBUFFER_OES, viewRenderbuffer);
  
  glGetRenderbufferParameterivOES(GL_RENDERBUFFER_OES, GL_RENDERBUFFER_WIDTH_OES, &backingWidth);
  glGetRenderbufferParameterivOES(GL_RENDERBUFFER_OES, GL_RENDERBUFFER_HEIGHT_OES, &backingHeight);
  
  if (USE_DEPTH_BUFFER) {
    glGenRenderbuffersOES(1, &depthRenderbuffer);
    glBindRenderbufferOES(GL_RENDERBUFFER_OES, depthRenderbuffer);
    glRenderbufferStorageOES(GL_RENDERBUFFER_OES, GL_DEPTH_COMPONENT16_OES, backingWidth, backingHeight);
    glFramebufferRenderbufferOES(GL_FRAMEBUFFER_OES, GL_DEPTH_ATTACHMENT_OES, GL_RENDERBUFFER_OES, depthRenderbuffer);
  }
  
  if (glCheckFramebufferStatusOES(GL_FRAMEBUFFER_OES) != GL_FRAMEBUFFER_COMPLETE_OES) {
    NSLog(@"failed to make complete framebuffer object %x", glCheckFramebufferStatusOES(GL_FRAMEBUFFER_OES));
    return NO;
  }
  
  return YES;
}


- (void)destroyFramebuffer {
  
  glDeleteFramebuffersOES(1, &viewFramebuffer);
  viewFramebuffer = 0;
  glDeleteRenderbuffersOES(1, &viewRenderbuffer);
  viewRenderbuffer = 0;
  
  if(depthRenderbuffer) {
    glDeleteRenderbuffersOES(1, &depthRenderbuffer);
    depthRenderbuffer = 0;
  }
}


- (void)startAnimation {
  self.animationTimer = [NSTimer scheduledTimerWithTimeInterval:animationInterval target:self selector:@selector(drawView) userInfo:nil repeats:YES];
}


- (void)stopAnimation {
  [self.animationTimer invalidate];
  self.animationTimer = nil;
}


- (void)setAnimationTimer:(NSTimer *)newTimer {
  [animationTimer invalidate];
  animationTimer = newTimer;
}


- (void)setAnimationInterval:(NSTimeInterval)interval {
  animationInterval = interval;
  if (animationTimer) {
    [self stopAnimation];
    [self startAnimation];
  }
}


- (void)dealloc {
  NSLog(@"dealloc GLShipPreview");
  
  [self stopAnimation];
  if ([EAGLContext currentContext] == context) [EAGLContext setCurrentContext:nil];
  
  if (ship) [ship release];
  [Texture drainCache];
  [Model3D drainCache];
  
  [self destroyFramebuffer];
  NSLog(@"context retain count: %i", [context retainCount]);
  [context release];
  [super dealloc];
}

@end
