//
//  AICrate.m
//  Void
//
//  Created for VOID on 11/19/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "AICrate.h"

#import "Ship.h"
#import "Enemy.h"

@implementation AICrate

- (id)initWithShip:(Enemy *)ownerShip {
  [super initWithShip:ownerShip];
  zBob = YES;
  ship.braking = NO;
  return self;
}

- (void)update {
  [super update];
  [ship turnToward:ship.angle + ship.turnSpeed/100];
}

- (void)tookDamage {
  ship.braking = YES;
}

@end
