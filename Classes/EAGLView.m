//
//  EAGLView.m
//  GLBalls
//
//  Created for VOID on 9/13/08.
//  Copyright __MyCompanyName__ 2008. All rights reserved.
//



#import <QuartzCore/QuartzCore.h>
#import <OpenGLES/EAGLDrawable.h>

#import "EAGLView.h"

#define USE_DEPTH_BUFFER 1

// A class extension to declare private methods
@interface EAGLView ()

@property (nonatomic, retain) EAGLContext *context;
@property (nonatomic, assign) NSTimer *animationTimer;

- (BOOL) createFramebuffer;
- (void) destroyFramebuffer;

@end


@implementation EAGLView

@synthesize context;
@synthesize animationTimer;
@synthesize animationInterval;
@synthesize paused;


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
        
		loadingView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 480, 320)];
		
		UIImageView *loadingImageView = [[[UIImageView alloc] initWithImage:[UIImage imageNamed:@"Default.png"]] autorelease];
        loadingImageView.transform = CGAffineTransformMakeRotation(-M_PI/2);
        loadingImageView.center = CGPointMake(240, 160);
		[loadingView addSubview:loadingImageView];
		
		loadingSpinner = [[[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge] autorelease];
		loadingSpinner.frame = CGRectMake(0, 170, 480, 150);
		loadingSpinner.contentMode = UIViewContentModeCenter;
		[loadingView addSubview:loadingSpinner];
        
        loadingMessage = [[[UILabel alloc] initWithFrame:CGRectMake(20, 280, 440, 30)] autorelease];
        loadingMessage.backgroundColor = [UIColor clearColor];
        loadingMessage.textColor = [UIColor colorWithWhite:0.5 alpha:1.0];
        loadingMessage.textAlignment = UITextAlignmentCenter;
        loadingMessage.numberOfLines = 2;
        loadingMessage.font = [UIFont boldSystemFontOfSize:12];
		[loadingView addSubview:loadingMessage];
        
		[self addSubview:loadingView];
		
        animationInterval = 1.0 / 40.0;
		
		fadeInFrame = 0;
		fadeInDuration = 30;
        paused = YES;
    }
	
    return self;
}

- (void)showLoading {
	[self showLoadingWithMessage:nil];
}

- (void)showLoadingWithMessage:(NSString*)message {
    self.alpha = 1.0;
    loadingMessage.text = message;
    loadingMessage.hidden = (message == nil || [message isEqualToString:@""]);
	loadingView.hidden = NO;
	[loadingSpinner startAnimating];
}

- (void)hideLoading {
	loadingView.hidden = YES;
	[loadingSpinner stopAnimating];
}


- (void)playStageNamed:(NSString *)stageName {
    [self hideLoading];
    
    [EAGLContext setCurrentContext:context];
    game = [[Game alloc] initWithStageName:stageName view:self];
    fadeInFrame = 0;
    [self drawView:nil];
    [self startAnimation];
}

- (void)playStageWithData:(NSData *)stageData {
	[self hideLoading];
	
	[EAGLContext setCurrentContext:context];
	game = [[NSKeyedUnarchiver unarchiveObjectWithData:stageData] retain];
	game.view = self;
	[self updateCredits:game.player.credits];
	fadeInFrame = fadeInDuration;
	[self drawView:nil];
	[self togglePause];
}

- (void)endStage {
    [self stopAnimation];
    self.alpha = 0.0;
    [game release];
    game = nil;
}

- (void)abortStage {
    [self togglePause];
    [game abortStage];
}

- (void)drawView:(id)sender {
    if (game) {
        if (fadeInFrame < fadeInDuration) {
            fadeInFrame++;
            self.alpha = (float)fadeInFrame / (float)fadeInDuration;
        } else {
            self.alpha = 1.0;
        }

        // Setup Frame
        [EAGLContext setCurrentContext:context];

        glBindFramebufferOES(GL_FRAMEBUFFER_OES, viewFramebuffer);
        glViewport(0, 0, backingWidth, backingHeight);

        // Update
        [game update];

        // Render
        if ([Game sharedGame]) {
            [game render];

            // Show frame
            glBindRenderbufferOES(GL_RENDERBUFFER_OES, viewRenderbuffer);
            [context presentRenderbuffer:GL_RENDERBUFFER_OES];      
        }
    }
}

- (void)updateCredits:(int)credits {
    [controller updateCredits:credits];
}

- (void)togglePause {
    if (paused) {
        [self startAnimation];
    } else {
        [self stopAnimation];
    }
    
    [controller togglePause];
}






- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    if (paused) {
        [self togglePause];
    } else {
        [game touchesBegan:touches withEvent:event];
    }
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
    [game touchesEnded:touches withEvent:event];
}

- (void)autocomplete {
    [self togglePause];
    [game autocomplete];
}















- (void)layoutSubviews {
    [EAGLContext setCurrentContext:context];
    [self destroyFramebuffer];
    [self createFramebuffer];
    [self drawView:nil];
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

    glEnable(GL_POINT_SMOOTH);

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
    if (paused) {
        [animationTimer invalidate];
        animationTimer = [NSTimer scheduledTimerWithTimeInterval:animationInterval target:self selector:@selector(drawView:) userInfo:nil repeats:YES];
		paused = NO;
    }
}


- (void)stopAnimation {
    if (!paused) {
        [animationTimer invalidate];
        animationTimer = nil;
        paused = YES;
    }
}


- (void)setAnimationTimer:(NSTimer *)newTimer {
    [animationTimer invalidate];
    animationTimer = newTimer;
}


- (void)setAnimationInterval:(NSTimeInterval)interval {
    animationInterval = interval;
    if (!paused) {
       [self stopAnimation];
       [self startAnimation];
    }
}


- (void)dealloc {
    NSLog(@"Dealloc EAGLView");
    [self stopAnimation];
    if ([EAGLContext currentContext] == context) {
        [EAGLContext setCurrentContext:nil];
    }
    [self destroyFramebuffer];

    if ([Game sharedGame]) {
        [game release];
    }
    
    [context release];
    [super dealloc];
}

@end
