//
//  AI.m
//  Void
//
//  Created for VOID on 10/10/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "AIBase.h"
#include "Game.h"
@class Game;

@implementation AIBase

@synthesize noticedPlayer;

#define Z_BOB_HEIGHT 0.65
#define Z_BOB_SPEED  1.5

- (id)initWithShip:(Enemy *)ownerShip {
  [super init];
  
  distanceToPlayer = [[Vector alloc] init];
  player = [Game sharedGame].ship;
  ship = ownerShip;
  tendency = (GLfloat)rand() / RAND_MAX * 2.0 - 1.0;
  
  zBob = NO;
  zBobPhase = (GLfloat)(rand() % 360);
  
  if ([ship.guns count] > 0) keyWeapon = [ship.guns objectAtIndex:0];
  
  return self;
}

- (void)dealloc {
  [distanceToPlayer release];
  [super dealloc];
}

// Override this method
- (void)update {
  if (zBob) {
    zBobPhase += Z_BOB_SPEED;
    ship.pos.z = Z_BOB_HEIGHT * sin([Utility deg2rad:zBobPhase]);
  }
  
  [distanceToPlayer setValuesToVector:player.pos];
  [distanceToPlayer subtract:ship.pos];
  distanceToPlayer.z = 0.0;
}

// Override this method
- (void)tookDamage {}

@end
