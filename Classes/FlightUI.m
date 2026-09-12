//
//    FlightUI.m
//    Void
//
//    Created for VOID on 9/17/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "FlightUI.h"
#include "Game.h"
#include "Ship.h"

@class Game;
@class Ship;

@implementation FlightUI

@synthesize game;

- (id)initWithGame:(id)aGame; {
    [self init];
    
    game = aGame;
    
    atlas = [[Texture textureNamed:@"UIAtlas.png"] retain];
    stageClearTexture = [[Texture textureNamed:@"StageClear.png"] retain];
    
    thrustButton    = [[Button alloc] initInRect:CGRectMake(  0, 208, 112, 112) texFrame:CGRectMake(  0, 144, 112, 112)];
    fireButton      = [[Button alloc] initInRect:CGRectMake(422, 146,  58, 174) texFrame:CGRectMake(198,  82,  58, 174)];
    pauseButton     = [[Button alloc] initInRect:CGRectMake(381,  21,  20,  20) texFrame:CGRectMake(  0,   0,  20,  20)];
    
    thrustFeeback   = [[Button alloc] initInRect:CGRectMake(28-64, 236-64, 128.0, 128.0) texFrame:CGRectMake(41, 0, 50, 50)];
    reverseFeedback = [[Button alloc] initInRect:CGRectMake(28-64, 292-64, 128.0, 128.0) texFrame:CGRectMake(41, 0, 50, 50)];
    brakeFeedback   = [[Button alloc] initInRect:CGRectMake(84-64, 292-64, 128.0, 128.0) texFrame:CGRectMake(41, 0, 50, 50)];
    
    fireAFeedback   = [[Button alloc] initInRect:CGRectMake(452-64, 180-64, 128.0, 128.0) texFrame:CGRectMake(41, 0, 50, 50)];
    fireBFeedback   = [[Button alloc] initInRect:CGRectMake(452-64, 236-64, 128.0, 128.0) texFrame:CGRectMake(41, 0, 50, 50)];
    fireCFeedback   = [[Button alloc] initInRect:CGRectMake(452-64, 292-64, 128.0, 128.0) texFrame:CGRectMake(41, 0, 50, 50)];
    
    radar                   = [[Radar alloc]  initInRect:CGRectMake(0,  0, 81, 81) texFrame:CGRectMake(0, 50, 81, 81)];
    creditIcon              = [[Button alloc] initInRect:CGRectMake(62, 4, 16, 16) texFrame:CGRectMake(20, 0, 16, 16)];
        
    stageClearButton        = [[Button alloc] initInRect:CGRectMake(112.0, 288.0, 256.0, 32.0) texFrame:CGRectMake(0.0, 0.0, 256.0, 256.0)];
    
    gaugeBackground         = [[Button alloc] initInRect:CGRectMake(431, 4, 43, 126) texFrame:CGRectMake(112, 98, 43, 126)];
	gaugeArmorBackground    = [[Button alloc] initInRect:CGRectMake(454, 10, 14, 93) texFrame:CGRectMake(157, 98, 14, 93)];
    
    energyGauge             = [[Gauge alloc] initInRect:CGRectMake(435, 12, 10, 90) texFrame:CGRectMake(147, 0, 10, 90)];
    armorGauge              = [[Gauge alloc] initInRect:CGRectMake(456, 12, 10, 90) texFrame:CGRectMake(157, 0, 10, 90)];
    shieldsGauge            = [[Gauge alloc] initInRect:CGRectMake(452,  8, 18, 98) texFrame:CGRectMake(167, 0, 18, 98)];
    
    benchButtons            = [[Bench alloc] initWithName:@"- UI Buttons"];
    benchRadar              = [[Bench alloc] initWithName:@"- UI Radar"];
    return self;
}

- (void)dealloc {
    [thrustButton release];
    [fireButton release];
    [pauseButton release];
    
    [thrustFeeback release];
    [reverseFeedback release];
    [brakeFeedback release];
    
    [fireAFeedback release];
    [fireBFeedback release];
    [fireCFeedback release];
    
    [radar release];
	[creditIcon release];
    
    [stageClearButton release];
    
    [gaugeBackground release];
	[gaugeArmorBackground release];
    [energyGauge release];
    [shieldsGauge release];
    [armorGauge release];
    
    [atlas release];
    
    [super dealloc];
}



- (void)update {
    [radar update];
    
    energyGauge.value     = [Game sharedGame].ship.energyCurrent  / [Game sharedGame].ship.energyMax;
    shieldsGauge.value    = [Game sharedGame].ship.currentShields / [Game sharedGame].ship.maxShields;
    armorGauge.value      = [Game sharedGame].ship.currentArmor   / [Game sharedGame].ship.maxArmor;
}



- (void)render {
    // Set the camera to orthographic landscape
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	glOrthof(-240.0, 240.0, -160.0, 160.0, -1.0, 1.0);
    
    // Render buttons
    [benchButtons start];
    
    // Enable texture
    [atlas enable];
    
    [thrustButton render];
    [fireButton render];
    [pauseButton render];
    
    if (game.ship.thrusting) [thrustFeeback render];
    if (game.ship.reversing) [reverseFeedback render];
    if (game.ship.braking)     [brakeFeedback render];
    if (game.ship.firing) {
        switch (game.weaponGroupId) {
            case 0: [fireAFeedback render]; break;
            case 1: [fireBFeedback render]; break;
            case 2: [fireCFeedback render]; break;
        }
    }
    
    [creditIcon render];
    
    [benchButtons stop];
    
    [gaugeBackground render];
    [energyGauge render];
    [shieldsGauge render];
	
	[gaugeArmorBackground render];
    [armorGauge render];
    
    [benchRadar start];
    [radar render];
    [benchRadar stop];
    
    // Disable texture
    [atlas disable];
    
    if ([game canBeCompleted]) {
        [stageClearTexture enable];
        [stageClearButton render];
        [stageClearTexture disable];
    }
    
}

@end








