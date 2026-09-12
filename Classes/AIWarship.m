//
//  AIWarship.m
//  Void
//
//  Created for VOID on 10/25/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "AIWarship.h"

#import "Ship.h"
#import "Enemy.h"

#import "Utility.h"

@implementation AIWarship

- (void)update {
  [super update];
  
  if (noticedPlayer) {
    // Find range of weapons
    GLfloat weaponRange = [keyWeapon range];
    
    // Figure out if we are pointing towards our target
    GLfloat angleDifference = [Utility angleDifference:ship.angle to:[distanceToPlayer angle2D]];
    
    // Point toward toward the player
    [ship turnToward:[distanceToPlayer angle2D]];
    
    if ([distanceToPlayer length] < weaponRange) {
      // We are within weapon range of the player
      ship.firing    = (fabs(angleDifference) < 15.0 + 5.0 * tendency);
      ship.thrusting = NO;
      ship.braking   = YES;
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
  } else {
    if ([distanceToPlayer length] < 14.0 + 3.0 * tendency) {
      noticedPlayer = YES;
    }
  }
}

- (void)tookDamage {
  noticedPlayer = YES;
}

@end
