//
//  Projectile.h
//  Void
//
//  Created for VOID on 9/20/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Texture.h"
#import "Utility.h"

#include "Ship.h"
@class Ship;

@interface Projectile : SpaceObject {
	
	NSDictionary* templateDictionary;
	
  Texture *spriteTexture;
  CGPoint spriteMapLocation;
  NSMutableArray *potentialTargets;
  
  int shipId;
  
  GLfloat shieldDmg;
  GLfloat armorDmg;
  GLfloat forceHit;
  
  GLuint lifetime;
  GLfloat size;
  GLfloat collisionSize;
  GLfloat explosionSize;
  
  GLfloat seekLockAngle;
  GLfloat seekTurnSpeed;
  
  NSMutableArray *soundsHit;
  NSString *hitSpriteName;
  
  Ship *seekTarget;
  Vector *distanceToTarget;
  
  GLuint lifeElapsed;
  BOOL expired;
}
@property (readonly) NSArray *potentialTargets;

@property (readonly) int shipId;
@property (readonly) GLfloat shieldDmg;
@property (readonly) GLfloat armorDmg;
@property (readonly) GLfloat forceHit;
@property (readonly) GLfloat size;
@property (readonly) GLfloat collisionSize;
@property (readonly) GLfloat explosionSize;

@property (readwrite) GLuint lifetime;
@property (readwrite) BOOL expired;


- (id)initWithTemplate:(NSDictionary *)aTemplate belongingToShip:(int)aShipId position:(Vector *)position velocity:(Vector *)velocity angle:(GLfloat)anAngle;

- (void)findATarget;

- (void)playHitSound;

- (void)explode;

@end
