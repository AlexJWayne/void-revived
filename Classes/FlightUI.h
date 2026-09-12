//
//  FlightUI.h
//  Void
//
//  Created for VOID on 9/17/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import "Button.h"
#import "Texture.h"
#import "Radar.h"
#import "Gauge.h"

#import "Bench.h"

@class Game;

@interface FlightUI : NSObject {
  Game *game;
  
  Texture *atlas;
  Texture *stageClearTexture;
  
  Button *thrustButton;
  Button *fireButton;
  
  Button *pauseButton;
  
  Button *thrustFeeback;
  Button *reverseFeedback;
  Button *brakeFeedback;
  Button *fireAFeedback;
  Button *fireBFeedback;
  Button *fireCFeedback;
  
  Button *creditIcon;
  Radar  *radar;
  
  Button *stageClearButton;
  
  Button *gaugeBackground;
	Button *gaugeArmorBackground;
	
  Gauge *energyGauge;
  Gauge *shieldsGauge;
  Gauge *armorGauge;
  
  Bench *benchButtons;
  Bench *benchRadar;
}

@property (assign) id game;

- (id)initWithGame:(id)aGame;

- (void)update;
- (void)render;

@end
