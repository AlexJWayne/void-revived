//
//  AI.h
//  Void
//
//  Created for VOID on 10/10/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Vector.h"

@class Enemy;
@class Ship;
@class Weapon;

@interface AIBase : NSObject {
  Enemy *ship;
  Ship *player;
  
  Vector *distanceToPlayer;
  Weapon *keyWeapon;
  
  // A random value -1.0 to 1.0.  It prevents all enemies form behaving exactly the same.
  GLfloat tendency;
	
	BOOL noticedPlayer;
  
  BOOL zBob;
  GLfloat zBobPhase;
}

@property (assign, nonatomic) BOOL noticedPlayer;

- (id)initWithShip:(Enemy *)ownerShip;

- (void)update;

- (void)tookDamage;

@end
