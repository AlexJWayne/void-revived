//
//  Beam.h
//  Void
//
//  Created for VOID on 10/23/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Texture.h"
#import "SoundEffect.h"

@interface Beam : SpaceObject {
  GLfloat width;
  GLfloat length;
  GLfloat collisionWidth;
  GLfloat maxRange;
  
  int shipId;
  
  GLfloat shieldDmg;
  GLfloat armorDmg;
  GLfloat forceHit;
  
  int lifeElapsed;
  int lifetime;
  BOOL expired;
  
  Texture *texture;
  CGPoint spriteMapLocation;
  SoundEffect *hitSound;
}

@property (readwrite) BOOL expired;


- (id)initWithTemplate:(NSDictionary *)aTemplate belongingToShip:(int)aShipId position:(Vector *)position velocity:(Vector *)velocity angle:(GLfloat)anAngle;
- (void)checkCollision;

@end
