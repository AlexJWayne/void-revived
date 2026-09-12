//
//  Weapon.h
//  Void
//
//  Created for VOID on 9/20/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Projectile.h"
#import "Model3D.h"
#import "Texture.h"
#import "SoundEffect.h"

@interface Weapon : SpaceObject {
  NSMutableDictionary *weaponTemplate;
  
  GLuint coolDownCounter;
  Vector *hardpointPos;
  
  Model3D *model;
  Texture *texture;
  
  int shipId;
  GLfloat parentAngle;
  
  Vector *posOffset;
  
  
  // Properties
  NSString *name;
  NSString *iconName;
  NSString *description;
  GLuint    value;
  
  BOOL isBeam;
  GLuint coolDown;
  GLuint lifetime;
  GLfloat speed;
  GLfloat spread;
  GLfloat shieldDmg;
  GLfloat armorDmg;
  GLfloat forceFire;
  GLfloat forceHit;
  GLfloat energy;
  GLfloat size;
  GLfloat targetingArc;
  GLfloat mass;
  GLfloat beamRange;
  GLfloat seekTurnSpeed;
  NSMutableArray *soundsFire;
  BOOL fireSoundLoops;
  
  // Projectile Properties
  NSString *projectileImage;
  GLfloat   projectileSize;
  GLfloat   projectileCollisionSize;
  BOOL      projectileIsDirectional;
  
}

@property (readonly) NSString *name;
@property (readonly) NSString *iconName;
@property (readonly) NSString *description;
@property (readonly) GLuint    value;

@property (readonly) BOOL isBeam;
@property (readonly) GLfloat forceFire;
@property (readonly) GLfloat energy;
@property (readonly) GLfloat speed;
@property (readonly) GLfloat shieldDmg;
@property (readonly) GLfloat armorDmg;
@property (readonly) GLuint lifetime;
@property (readonly) GLfloat mass;

@property (readonly) GLfloat fireRate;
@property (readonly) GLfloat range;


- (id)initWithWeaponName:(NSString *)aTemplateName;
- (id)initWithWeaponName:(NSString *)aTemplateName hardpointPos:(Vector *)aHardpointPos shipId:(int)aShipId bonuses:(NSDictionary *)bonuses;

- (void)updateWithPos:(Vector *)weaponPos angle:(GLfloat)weaponAngle bankAngle:(GLfloat)bankAngle;

- (BOOL)fire:(Vector *)baseVelocity alreadyPlayedSound:(BOOL)alreadyPlayedSound;
- (void)stopFiringSound;
- (void)stopFiringSoundAndDecay;

@end
