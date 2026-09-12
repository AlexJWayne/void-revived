//
//  Weapon.h
//  WeaponEditor
//
//  Created for VOID on 10/2/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>


@interface Weapon : NSObject {
  // Properties
  NSString *name;
  int coolDown;
  int lifetime;
  float speed;
  float spread;
  float shieldDmg;
  float armorDmg;
  float forceFire;
  float forceHit;
  float energy;
  float size;
  float accel;
  NSString *modelName;
  NSString *modelTexture;
  
  float seekLockAngle;
  float seekTurnSpeed;
  float targetingArc;
  
  // Projectile Properties
  NSString *projectileImage;
  float     projectileSize;
  float     projectileCollisionSize;
  BOOL      projectileIsDirectional;
  float     explosionSize;
}

@property (copy)      NSString *name;
@property (readwrite) int coolDown;
@property (readwrite) int lifetime;
@property (readwrite) float speed;
@property (readwrite) float spread;
@property (readwrite) float shieldDmg;
@property (readwrite) float armorDmg;
@property (readwrite) float forceFire;
@property (readwrite) float forceHit;
@property (readwrite) float energy;
@property (readwrite) float size;
@property (readwrite) float accel;
@property (copy) NSString *modelName;
@property (copy) NSString *modelTexture;

@property (readwrite) float seekLockAngle;
@property (readwrite) float seekTurnSpeed;
@property (readwrite) float targetingArc;

@property (copy)      NSString *projectileImage;
@property (readwrite) float     projectileSize;
@property (readwrite) float     projectileCollisionSize;
@property (readwrite) BOOL      projectileIsDirectional;
@property (readwrite) float     explosionSize;


- (id)initWithDictionary:(NSDictionary *)dictionary name:(NSString *)aName;
- (NSDictionary *)dictionary;

@end
