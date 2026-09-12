//
//  Weapon.m
//  WeaponEditor
//
//  Created for VOID on 10/2/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Weapon.h"


@implementation Weapon

@synthesize name;
@synthesize coolDown;
@synthesize lifetime;
@synthesize speed;
@synthesize spread;
@synthesize shieldDmg;
@synthesize armorDmg;
@synthesize forceFire;
@synthesize forceHit;
@synthesize energy;
@synthesize size;
@synthesize modelName;
@synthesize projectileImage;
@synthesize projectileSize;
@synthesize projectileCollisionSize;
@synthesize projectileIsDirectional;
@synthesize seekLockAngle;
@synthesize seekTurnSpeed;
@synthesize targetingArc;
@synthesize explosionSize;
@synthesize modelTexture;
@synthesize accel;

- (id)init {
  [super init];
  name = @"New Weapon";
  projectileImage = @"CapsuleRed.png";
  modelName = @"SimpleBarrel";
  return self;
}

- (id)initWithDictionary:(NSDictionary *)dictionary name:(NSString *)aName {
  [self init];
  
  name        = aName;
  coolDown    = [[dictionary objectForKey:@"coolDown"] intValue];
  lifetime    = [[dictionary objectForKey:@"lifetime"] intValue];
  speed       = [[dictionary objectForKey:@"speed"] floatValue];
  spread      = [[dictionary objectForKey:@"spread"] floatValue];
  shieldDmg   = [[dictionary objectForKey:@"shieldDmg"] floatValue];
  armorDmg    = [[dictionary objectForKey:@"armorDmg"] floatValue];
  forceFire   = [[dictionary objectForKey:@"forceFire"] floatValue];
  forceHit    = [[dictionary objectForKey:@"forceHit"] floatValue];
  energy      = [[dictionary objectForKey:@"energy"] floatValue];
  size        = [[dictionary objectForKey:@"modelSize"] floatValue];
  accel       = [[dictionary objectForKey:@"accel"] floatValue];
  modelName   = [dictionary objectForKey:@"modelName"];
  modelTexture = [dictionary objectForKey:@"modelTexture"];
  
  seekLockAngle = [[dictionary objectForKey:@"seekLockAngle"] floatValue];
  seekTurnSpeed = [[dictionary objectForKey:@"seekTurnSpeed"] floatValue];
  targetingArc = [[dictionary objectForKey:@"targetingArc"] floatValue];
  
  projectileImage = [dictionary objectForKey:@"projectileImage"];
  projectileSize  = [[dictionary objectForKey:@"projectileSize"] floatValue];
  projectileCollisionSize = [[dictionary objectForKey:@"projectileCollisionSize"] floatValue];
  projectileIsDirectional = [[dictionary objectForKey:@"projectileIsDirectional"] boolValue];
  explosionSize = [[dictionary objectForKey:@"explosionSize"] floatValue];
  
  return self;
}

- (NSDictionary *)dictionary {
  return [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithInt:coolDown], @"coolDown",
                                                    [NSNumber numberWithInt:lifetime], @"lifetime",
                                                    [NSNumber numberWithFloat:speed], @"speed",
                                                    [NSNumber numberWithFloat:spread], @"spread",
                                                    [NSNumber numberWithFloat:shieldDmg], @"shieldDmg",
                                                    [NSNumber numberWithFloat:armorDmg], @"armorDmg",
                                                    [NSNumber numberWithFloat:forceFire], @"forceFire",
                                                    [NSNumber numberWithFloat:forceHit], @"forceHit",
                                                    [NSNumber numberWithFloat:energy], @"energy",
                                                    [NSNumber numberWithFloat:size], @"modelSize",
                                                    [NSNumber numberWithFloat:accel], @"accel",
                                                    modelName, @"modelName",
                                                    modelTexture, @"modelTexture",
                                                    [NSNumber numberWithFloat:seekLockAngle], @"seekLockAngle",
                                                    [NSNumber numberWithFloat:seekTurnSpeed], @"seekTurnSpeed",
                                                    [NSNumber numberWithFloat:targetingArc], @"targetingArc",          
                                                    projectileImage, @"projectileImage",
                                                    [NSNumber numberWithFloat:projectileSize], @"projectileSize",
                                                    [NSNumber numberWithFloat:projectileCollisionSize], @"projectileCollisionSize",
                                                    [NSNumber numberWithBool:projectileIsDirectional], @"projectileIsDirectional",
                                                    [NSNumber numberWithFloat:explosionSize], @"explosionSize",
                                                    nil];
}

@end
