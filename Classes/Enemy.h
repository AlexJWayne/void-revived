//
//  Enemy.h
//  Void
//
//  Created for VOID on 9/20/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Ship.h"

// AI's
#import "AIBase.h"
#import "AIStationary.h"
#import "AIFighter.h"
#import "AIWarship.h"
#import "AICrate.h"

@interface Enemy : Ship {
  Vector *distanceToTarget;
  AIBase *ai;
  
  BOOL optional;
  
  NSDictionary *loot;
  
  
  // Mine data
  BOOL isMine;
  GLfloat mineShieldDamage;
  GLfloat mineArmorDamage;
  GLfloat mineSize;
}

@property (assign) BOOL optional;

- (void)update;
- (void)spawnLoot;

@end
