//
//    EAGLView.h
//    GLBalls
//
//    Created for VOID on 9/13/08.
//    Copyright __MyCompanyName__ 2008. All rights reserved.
//


#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>

#import "Bench.h"
#import "Game.h"

//#import "FlightInterface.h"
@class FlightInterface;

/*
This class wraps the CAEAGLLayer from CoreAnimation into a convenient UIView subclass.
The view content is basically an EAGL surface you render your OpenGL scene into.
Note that setting the view non-opaque will only work if the EAGL surface has an alpha channel.
*/
@interface EAGLView : UIView {
    
    Game *game;
    
    IBOutlet FlightInterface *controller;
    UIView *loadingView;
	UIActivityIndicatorView *loadingSpinner;
    UILabel *loadingMessage;
	
    BOOL paused;
    
@private
    /* The pixel dimensions of the backbuffer */
    GLint backingWidth;
    GLint backingHeight;
    
    EAGLContext *context;
    
    /* OpenGL names for the renderbuffer and framebuffers used to render to this view */
    GLuint viewRenderbuffer, viewFramebuffer;
    
    /* OpenGL name for the depth buffer that is attached to viewFramebuffer, if it exists (0 if it does not exist) */
    GLuint depthRenderbuffer;
    
    NSTimer *animationTimer;
    NSTimeInterval animationInterval;
    
    // Fade in
    GLuint fadeInFrame;
    GLuint fadeInDuration;
}

@property NSTimeInterval animationInterval;
@property (readonly) BOOL paused;

- (void)startAnimation;
- (void)stopAnimation;
- (void)drawView:(id)sender;

- (void)showLoading;
- (void)showLoadingWithMessage:(NSString*)message;
- (void)hideLoading;
	 
- (void)playStageNamed:(NSString *)stageName;
- (void)playStageWithData:(NSData *)stageData;


- (void)endStage;
- (void)abortStage;

- (void)updateCredits:(int)credits;
- (void)togglePause;

- (void)autocomplete;

@end
