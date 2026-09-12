//
//  AIStationary.m
//  Void
//
//  Created for VOID on 10/10/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "AIStationary.h"

#import "Ship.h"
#import "Enemy.h"

@implementation AIStationary

- (void)update {
  [super update];
  [ship turnToward:[distanceToPlayer angle2D]];
	noticedPlayer = YES;
  
  ship.braking = YES;
  
  if (keyWeapon) {
    ship.firing = ([distanceToPlayer length] < keyWeapon.range);
  }
}

@end
