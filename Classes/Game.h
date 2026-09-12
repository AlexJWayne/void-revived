//
//  Game.h
//  Void
//
//  Created for VOID on 9/15/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Vector.h"
#import "Ship.h"
#import "Enemy.h"
#import "StarField.h"
#import "FlightUI.h"
#import "Planet.h"
#import "Explosion.h"
#import "Player.h"
#import "Vector.h"
#import "Hypergate.h"
#import "BackgroundMusic.h"
#import "SoundEffect.h"
#import "Beam.h"
#import "Nebula.h"

#import "Bench.h"

//#include "EAGLView.h"
@class EAGLView;

@interface Game : NSObject <NSCoding, UIAccelerometerDelegate, UIAlertViewDelegate> {
    NSString *stageName;
    int stageTier;


    EAGLView *view;
    CFTimeInterval lastFrameTimestamp;

    Vector *center;

    Vector *cameraPos;
    NSMutableArray *previousAngles;
    GLfloat angle;
    GLfloat turnAmount;
    GLfloat lastTilt;
    BOOL hasAccelerometer;
    GLfloat turnSesitivity;
    BOOL invertSteering;
    CGFloat screenScaleFactor;

    Player *player;
    Ship *ship;

    Hypergate *hypergate;

    NSMutableArray *planets;
    NSMutableArray *targets;

    NSMutableArray *enemies;
    NSMutableArray *enemiesToDestroy;

    NSMutableArray *projectiles;
    NSMutableArray *projectilesToDestroy;

    NSMutableArray *beams;
    NSMutableArray *beamsToDestroy;

    NSMutableArray *explosions;
    NSMutableArray *explosionsToDestroy;

    NSMutableArray *pickups;
    NSMutableArray *pickupsToDestroy;

    NSMutableArray *nebulas;

    StarField *starField;

    NSMutableSet *activeTouches;
    GLfloat previousPinchDistance;

    FlightUI *flightUI;

    GLfloat backgroundR;
    GLfloat backgroundG;
    GLfloat backgroundB;

    BOOL stageIsEnding;
    GLuint stageEndFrame;
    GLuint stageEndDuration;

    GLuint canBeCompletedEffectCount;
    GLuint canBeCompletedEffectDuration;

    BOOL weaponGroupButtonPressed;
    int weaponGroupId;

    // found items
    NSMutableArray *foundWeapons;
    NSMutableArray *foundEquipment;

    // Music
    BackgroundMusic *music;
    SoundEffect *exitStageSound;
    SoundEffect *weaponSwapSound;
    SoundEffect *hypergateOpenSound;
    BOOL playedHyperGateOpenSound;

    // Stats
    NSMutableDictionary *stats;
}

@property (readonly) NSString *stageName;
@property (readonly) int stageTier;
@property (readonly) Ship *ship;

@property (readonly) Vector *center;
@property (readonly) Vector *cameraPos;
@property (readonly) GLfloat angle;

@property (readonly) Player *player;
@property (readonly) NSMutableArray *planets;
@property (readonly) NSMutableArray *targets;
@property (readonly) NSMutableArray *enemies;
@property (readonly) NSMutableArray *projectiles;
@property (readonly) NSMutableArray *beams;
@property (readonly) NSMutableArray *explosions;
@property (readonly) NSMutableArray *pickups;
@property (readonly) NSMutableArray *nebulas;
@property (readonly) Hypergate *hypergate;
@property (readonly) int weaponGroupId;
@property (readonly) BOOL weaponGroupButtonPressed;
@property (readonly) BOOL stageIsEnding;

@property (readonly) NSMutableDictionary *stats;

@property (assign)   CGFloat screenScaleFactor;
@property (assign) EAGLView* view;

+ (Game *)sharedGame;

- (void)_commonInit;
- (id)initWithStageName:(NSString *)stageName view:(UIView *)aView;

- (void)showStageIntro:(NSString *)name description:(NSString *)description;

- (void)update;
- (void)updateTouches;
- (void)updateEnemies;
- (void)updateAngle;
- (void)updateProjectiles;
- (void)updateBeams;
- (void)updateCollision;
- (void)updateExplosions;
- (void)updatePickups;
- (void)updateNebulas;
- (void)checkForCompletion;

- (BOOL)canBeCompleted;

- (void)addCredits:(int)credits;
- (void)pickupItem:(NSString *)itemName type:(NSString *)itemType;
- (void)abortStage;
- (void)autocomplete;

- (void)render;
- (void)renderCamera;
- (void)renderFrameSetup;
- (void)renderPlanets;

- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration;

- (BOOL)isTouch:(UITouch *)touch inRect:(CGRect)rect;
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event;
- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;

@end
