//
//    Ship.h
//    Void
//
//    Created for VOID on 9/15/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Weapon.h"
#import "Texture.h"
#import "Model3D.h"
#import "Explosion.h"
#import "Pickup.h"
#import "SoundEffect.h"

@interface Ship : SpaceObject {
    int identifier;
    
    BOOL thrusting;
    BOOL reversing;
    BOOL braking;
    BOOL firing;
    
	
	NSDictionary *loadoutDictionary;
	
	
    GLfloat alpha;
    
    GLfloat thrusterAlpha;
    
    GLfloat shieldRechargeDelayElapsed;
    GLfloat currentShields;
    GLfloat currentArmor;
    
    GLfloat shieldBubbleAlpha;
    
    GLfloat turnToward;
    
    NSArray *weaponGroups;
    NSMutableArray *shuffledGuns;
    NSMutableArray *guns;
    NSMutableArray *equipment;
    
    GLfloat bankAngle;
    
    // Energy
    GLfloat energyCurrent;
    
    // temp instances used on every frame
    Vector *gunfireRecoil;
    Vector *gunfireRecoilTotal;
    
    // Ship parts
    NSMutableArray *models;
    NSMutableArray *textures;
    NSMutableArray *textureStyles;
    GLfloat pulsePhase;
    
    // Explosion Sprite
    NSString *explosionSprite;
    
    // Shield bubble
    Texture *shieldBubbleTexture;
    
    // Thruster
    Model3D *thrusterModel;
    Texture *thrusterTexture;
    
    // Sounds
    NSString *explosionSoundName;
    SoundEffect *thrusterSound;
    SoundEffect *reverseSound;
    float reverseSoundDecay;
    
    // Equipment Bonses
    NSMutableDictionary *equipmentBonuses;
    
    // Properties
    GLfloat armorRecharge;
    GLfloat shieldRecharge;
    GLfloat shieldRechargeDelay;
    GLfloat maxShields;
    GLfloat maxArmor;
    GLfloat maxSpeed;
    GLfloat thrusterForce;
    GLfloat brakeForce;
    GLfloat turnSpeed;
    GLfloat size;
    GLfloat mass; // tons
    GLfloat energyMax;
    GLfloat energyRecharge;
    
    NSMutableArray *gunHardpoints;
}

@property (readwrite) BOOL thrusting;
@property (readwrite) BOOL reversing;
@property (readwrite) BOOL braking;
@property (readwrite) BOOL firing;
@property (readwrite) GLfloat size;

@property (readonly) int identifier;
@property (readonly) GLfloat mass;
@property (readonly) GLfloat currentShields;
@property (readonly) GLfloat shieldRecharge;
@property (readonly) GLfloat shieldRechargeDelay;
@property (readonly) GLfloat maxShields;
@property (readonly) GLfloat currentArmor;
@property (readonly) GLfloat maxArmor;
@property (readonly) GLfloat armorRecharge;
@property (readonly) GLfloat energyCurrent;
@property (readonly) GLfloat energyMax;
@property (readonly) GLfloat energyRecharge;
@property (readonly) GLfloat turnSpeed;
@property (readonly) GLfloat maxSpeed;
@property (readonly) GLfloat thrusterForce;
@property (readonly) GLfloat brakeForce;

@property (readonly) NSMutableArray *guns;

- (void)_commonInit;
- (id)initWithDictionary:(NSDictionary *)loadoutTemplate;
- (void)setGunAtHardpointIndex:(int)hardpointIndex toGunNamed:(NSString *)gunName;

- (void)update;
- (void)updateAngle;
- (void)updateAccel;
- (void)updateVel;
- (void)updateBraking;
- (void)updatePos;
- (void)updateEnergy;
- (void)updateShields;
- (void)updateGuns;

- (void)render;
- (void)renderShip;
- (void)renderThrusters;
- (void)renderShieldBubble;

- (void)damageShields:(GLfloat)shieldAmount armor:(GLfloat)armorAmount;
- (void)turnToward:(GLfloat)turnAngle;

@end
