//
//  AIFighter.m
//  Void
//
//  Created for VOID on 10/11/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "AIFighter.h"

#import "Ship.h"
#import "Enemy.h"

#import "Utility.h"

@implementation AIFighter

- (id)initWithShip:(Enemy *)ownerShip {
  homePosition = [[Vector alloc] initWithVector:ownerShip.pos];
  return [super initWithShip:ownerShip];
}

- (void)update {
  [super update];
  
  if (noticedPlayer) {
    [self updateWithAggro];
  } else {
    [self updateWithoutAggro];
  }
}

- (void)updateWithAggro {
  // Drop aggro if player is out of range
  if ([distanceToPlayer length] > 25.0 + 5.0 * tendency) {
    [self dropAggro];
    
  } else {
    // Figure out if we are pointing towards our target
    GLfloat angleDifference = [Utility angleDifference:ship.angle to:[distanceToPlayer angle2D]];
    
    // Point toward toward the player
    [ship turnToward:[distanceToPlayer angle2D]];
    
    if ([distanceToPlayer length] < keyWeapon.range) {
      // We are within weapon range of the player
      ship.firing    = (fabs(angleDifference) < 20.0);
      ship.thrusting = NO;
      ship.braking   = NO;
      
    } else {
      // Get into weapons range
      
      ship.firing    = NO;
      
      // Figure out the current state of things
      BOOL isMovingToward   = fabs([Utility angleDifference:[ship.vel angle2D] to:[distanceToPlayer angle2D]]) < 20.0 + 10.0 * tendency;
      BOOL isPointedToward  = fabs(angleDifference) < 15.0 + 10.0 * tendency;
      BOOL isStopped        = [ship.vel length] < 0.05 + 0.04 * tendency;
      
      if (isPointedToward && (isMovingToward || isStopped)) {
        // Thrust if we are stopped and pointed towards to the player, or if we are moving towards the player
        ship.thrusting = YES;
        ship.braking   = NO;
      } else {
        // Brake when not moving toward player.
        ship.thrusting = NO;
        ship.braking   = YES;
      }
      
    }
  }
}
- (void)updateWithoutAggro {
  ship.braking = YES;
  
  if ([distanceToPlayer length] < 14.0 + 2.0 * tendency) {
    [self gainAggro];
  }
}

- (void)tookDamage {
  [self gainAggro];
}

- (void)gainAggro {
  noticedPlayer = YES;
}
- (void)dropAggro {
  noticedPlayer = NO;
}

@end
