//
//    Game.m
//    Void
//
//    Created for VOID on 9/15/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Game.h"
#import "EAGLView.h"

#include "VoidAppDelegate.h"
@class VoidAppDelegate;

static Game *sharedGame;

@implementation Game

@synthesize stageName, center, cameraPos, angle, planets, targets, enemies, projectiles, beams, explosions, pickups, nebulas, ship, hypergate, weaponGroupId, weaponGroupButtonPressed, stageIsEnding, stageTier, stats, view, player, screenScaleFactor;

#define CAMERA_ANGLE      25.0
#define CAMERA_HEIGHT_MAX 40.0
#define CAMERA_HEIGHT_MIN 8.0
#define CAMERA_ZOOM_TILT_ANGLE 10.0

#pragma mark Class Methods
+ (Game *)sharedGame {
    return sharedGame;
}

#pragma mark Initialization
- (void)_commonInit {
    // Set screen scale
    self.screenScaleFactor = [[UIScreen mainScreen] scale];
    
	// Init player data
    player = [[Player alloc] init];
    NSLog(@"Loaded with %i credits", player.credits);
    invertSteering = [[NSUserDefaults standardUserDefaults] boolForKey:@"invertSteering"];
    
    // Update credits label
    [view updateCredits:player.credits];
    
    // Load template
    NSDictionary *aTemplate = [[Utility dataFile:@"Stages"] objectForKey:stageName];
    
    // Set tier
    stageTier = [[aTemplate objectForKey:@"tier"] intValue];
    
    // Setup lighting
    glMatrixMode(GL_MODELVIEW_MATRIX);
    glLoadIdentity();
    
    GLfloat lightPosition[]    = { -1.0, 0.0, 0.75, 0.0 };
    GLfloat whiteLight[]         = { 1.0, 1.0, 1.0, 1.0 };
    GLfloat lmodelAmbient[]    = { 1.0, 1.0, 1.0, 1.0 };
    glLightfv(GL_LIGHT0, GL_POSITION, lightPosition);
    glLightfv(GL_LIGHT0, GL_DIFFUSE, whiteLight);
    glLightfv(GL_LIGHT0, GL_SPECULAR, whiteLight);
    glLightModelfv(GL_LIGHT_MODEL_AMBIENT, lmodelAmbient);
    glEnable(GL_NORMALIZE);
    glEnable(GL_CULL_FACE);
    
    // Background color
    backgroundR = [[[aTemplate objectForKey:@"backgroundColor"] objectForKey:@"r"] floatValue] / 255.0;
    backgroundG = [[[aTemplate objectForKey:@"backgroundColor"] objectForKey:@"g"] floatValue] / 255.0;
    backgroundB = [[[aTemplate objectForKey:@"backgroundColor"] objectForKey:@"b"] floatValue] / 255.0;
    
    turnSesitivity = [[[NSUserDefaults standardUserDefaults] objectForKey:@"turnSensitivity"] floatValue];
    
    // Container for angle history
    previousAngles = [[NSMutableArray alloc] init];
    for (int i = 0; i < 4; i++) [previousAngles addObject:[NSNumber numberWithFloat:0.0]];
    
    // Ceate activeTouches container
    activeTouches = [[NSMutableSet alloc] init];
    
    // Setup projectiles container
    projectiles = [[NSMutableArray alloc] init];
    projectilesToDestroy = [[NSMutableArray alloc] init];
    
    // Create starfield
    Vector *spawnArea = [[Vector alloc] initWithX:85.0 y:85.0 z:6.0];
    Vector *position    = [[Vector alloc] initWithX:0.0    y:0.0    z:-6.0];
    starField = [[StarField alloc] initWithPos:position quantity:1500 spawnArea:spawnArea sizeMin:0.06 sizeMax:0.15];
    [spawnArea release];
    [position release];
    
    // Add planets
    planets = [[NSMutableArray alloc] init];
    for (NSDictionary *planetTemplate in [aTemplate objectForKey:@"planets"]) {
        Planet *planet = [[Planet alloc] initWithImage:[planetTemplate objectForKey:@"image"] size:[[planetTemplate objectForKey:@"size"] floatValue]];
        planet.pos.x = [[[planetTemplate objectForKey:@"position"] objectForKey:@"x"] floatValue];
        planet.pos.y = [[[planetTemplate objectForKey:@"position"] objectForKey:@"y"] floatValue];
        [planets addObject:planet];
        [planet release];
    }
    
    // Setup player
    ship = [[Ship alloc] initWithDictionary:[player shipDictionary]];
    ship.pos.x = [[[aTemplate objectForKey:@"hypergatePosition"] objectForKey:@"x"] floatValue];
    ship.pos.y = [[[aTemplate objectForKey:@"hypergatePosition"] objectForKey:@"y"] floatValue];
    
    // Hypergate
    hypergate = [[Hypergate alloc] initAtPosition:ship.pos];
    
    // Add enemies
    enemies = [[NSMutableArray alloc] init];
    enemiesToDestroy = [[NSMutableArray alloc] init];
    
    NSDictionary *enemyLoadouts = [Utility dataFile:@"Enemies"];
    for (NSDictionary *enemyTemplate in [aTemplate objectForKey:@"enemies"]) {
        int qty = 0;
        
        BOOL firstTimeOnly = [[enemyTemplate objectForKey:@"firstTimeOnly"] boolValue];
        
        if ((firstTimeOnly && [player.completedStages indexOfObject:stageName] == NSNotFound) || !firstTimeOnly) {
            if ([enemyTemplate objectForKey:@"qty"] != nil) {
                int min = [[[[enemyTemplate objectForKey:@"qty"] componentsSeparatedByString:@"-"] objectAtIndex:0] intValue];
                int max = [[[[enemyTemplate objectForKey:@"qty"] componentsSeparatedByString:@"-"] objectAtIndex:1] intValue];
                qty = (int)(((float)rand() / RAND_MAX) * (max - min + 1) + min);
                
            } else if ([enemyTemplate objectForKey:@"chance"] == nil) {
                qty = 1;
            } else if ((float)rand() / RAND_MAX < [[enemyTemplate objectForKey:@"chance"] floatValue]) {
                qty = 1;
            }
            
            
            for (int i = 0; i < qty; i++) {
                Enemy *enemy = [[Enemy alloc] initWithDictionary:[enemyLoadouts objectForKey:[enemyTemplate objectForKey:@"loadout"]]];
                if (qty > 1 || [enemyTemplate objectForKey:@"position"] == nil) {
                    while ([enemy.pos length] == 0.0 || [enemy.pos distance2D:hypergate.pos] < 12.0 || [enemy.pos length] > 60.0) {
                        enemy.pos.x = ((GLfloat)rand() / RAND_MAX) * 120.0 - 60.0;
                        enemy.pos.y = ((GLfloat)rand() / RAND_MAX) * 120.0 - 60.0;
                    }
                } else {
                    enemy.pos.x = [[[enemyTemplate objectForKey:@"position"] objectForKey:@"x"] floatValue];
                    enemy.pos.y = [[[enemyTemplate objectForKey:@"position"] objectForKey:@"y"] floatValue];
                }
                enemy.angle = (GLfloat)rand() / RAND_MAX * 360.0;
                [enemy turnToward:enemy.angle];
                enemy.optional = [[enemyTemplate objectForKey:@"optional"] boolValue];
                [enemies addObject:enemy];
                [enemy release];            
            }
        }
    }
    
    // Setup nebulas
    nebulas = [[NSMutableArray alloc] init];
    for (NSDictionary *nebulaTemplate in [aTemplate objectForKey:@"nebulas"]) {
        Nebula *nebula = [[Nebula alloc] initWithDictionary:nebulaTemplate];
        [nebulas addObject:nebula];
        [nebula release];
    }
    
    // Create pickups containers 
    pickups = [[NSMutableArray alloc] init];
    pickupsToDestroy = [[NSMutableArray alloc] init];
    
    // Generate array of all targets
    targets = [[NSMutableArray alloc] initWithArray:enemies];
    [targets addObject:ship];
    
    // Setup containers for explosions
    explosions = [[NSMutableArray alloc] init];
    explosionsToDestroy = [[NSMutableArray alloc] init];
    
    // Setup containers for beams
    beams = [[NSMutableArray alloc] init];
    beamsToDestroy = [[NSMutableArray alloc] init];
    
    // Setup accellerometer delegate
    [[UIAccelerometer sharedAccelerometer] setDelegate:self];
    [[UIAccelerometer sharedAccelerometer] setUpdateInterval:1.0 / 30.0];
    
    // Start at origin
    center        = [[Vector alloc] init];
    cameraPos = [[Vector alloc] initWithX:0.0 y:0.0 z:CAMERA_HEIGHT_MAX];
    
    // Create UI
    flightUI = [[FlightUI alloc] initWithGame:self];
    
    // Found items
    foundWeapons     = [[NSMutableArray alloc] init];
    foundEquipment = [[NSMutableArray alloc] init];
    
    // Music
    if ([aTemplate objectForKey:@"music"]) music = [[BackgroundMusic alloc] initWithTrack:[aTemplate objectForKey:@"music"]];
    [music play];
    
    // Load global sounds
    exitStageSound = [[SoundEffect effectNamed:@"Hypergate"     looping:NO] retain];
    weaponSwapSound = [[SoundEffect effectNamed:@"WeaponSwap" looping:NO] retain];
    hypergateOpenSound = [[SoundEffect effectNamed:@"HypergateOpen" looping:NO] retain];
    [SoundEffect effectNamed:@"Pickup.Money"         looping:NO];
    [SoundEffect effectNamed:@"Pickup.Weapon"        looping:NO];
    [SoundEffect effectNamed:@"Pickup.Equipment" looping:NO];
    
    stageEndDuration = 60;
    canBeCompletedEffectCount = 0;
    canBeCompletedEffectDuration = 60;
    
    // Stats
    stats = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                     stageName, @"stageName",
                     [NSNumber numberWithInt:0], @"Kills",
                     [NSNumber numberWithInt:0], @"Credits",
                     [NSMutableArray array], @"Weapons",
                     [NSMutableArray array], @"Equipment",
                     nil];
}

- (id)initWithStageName:(NSString *)aStageName view:(UIView *)aView {
    [super init];
    sharedGame = self;
    view = (EAGLView *)aView;	
	stageName = [aStageName copy];
    
	[self _commonInit];
	
	NSString *intro = [[[Utility dataFile:@"Stages"] objectForKey:stageName] objectForKey:@"description"];
	if (intro && [intro length] > 0) {
        [self showStageIntro:stageName description:intro];
    }
	
    return self;
}

- (id)initWithCoder:(NSCoder*)coder {
	[super init];
	sharedGame = self;
	stageName = [[coder decodeObjectForKey:@"stageName"] copy];
	[self _commonInit];
	
	angle = [coder decodeFloatForKey:@"angle"];
	
	[player release];
	player = [[Player alloc] initWithDictionary:[coder decodeObjectForKey:@"player"]];
	
	[ship release];
	ship = [[coder decodeObjectForKey:@"ship"] retain];
	
	[enemies removeAllObjects];
	[enemies addObjectsFromArray:[coder decodeObjectForKey:@"enemies"]];
	
	[targets removeAllObjects];
	[targets addObjectsFromArray:enemies];
	
	[projectiles removeAllObjects];
	[projectiles addObjectsFromArray:[coder decodeObjectForKey:@"projectiles"]];
	
	[pickups removeAllObjects];
	[pickups addObjectsFromArray:[coder decodeObjectForKey:@"pickups"]];
	
	[foundWeapons removeAllObjects];
	[foundWeapons addObjectsFromArray:[coder decodeObjectForKey:@"foundWeapons"]];
	
	[foundEquipment removeAllObjects];
	[foundEquipment addObjectsFromArray:[coder decodeObjectForKey:@"foundEquipment"]];
	
	return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {	
	[coder encodeObject:stageName forKey:@"stageName"];
	[coder encodeFloat:angle forKey:@"angle"];
	[coder encodeObject:[player dictionary] forKey:@"player"];
	[coder encodeObject:ship forKey:@"ship"];
	[coder encodeObject:enemies forKey:@"enemies"];
	[coder encodeObject:projectiles forKey:@"projectiles"];
	[coder encodeObject:pickups forKey:@"pickups"];
	[coder encodeObject:foundWeapons forKey:@"foundWeapons"];
	[coder encodeObject:foundEquipment forKey:@"foundEquipment"];
	[coder encodeObject:stats forKey:@"stats"];
}

- (void)dealloc {
    NSLog(@"Dealloc game");
    [[UIAccelerometer sharedAccelerometer] setDelegate:nil];
    [stageName release];
    
    [center release];
    [cameraPos release];
    [previousAngles release];
    [player release];
    [hypergate release];
    [planets release];
    [targets release];
    [enemies release];
    [enemiesToDestroy release];
    [ship release];
    [projectiles release];
    [projectilesToDestroy release];
    [beams release];
    [beamsToDestroy release];
    [explosions release];
    [explosionsToDestroy release];
    [pickups release];
    [pickupsToDestroy release];
    [nebulas release];
    [starField release];
    [activeTouches release];
    [flightUI release];
    [foundWeapons release];
    [foundEquipment release];
    [music release];
    [exitStageSound release];
    [weaponSwapSound release];
    [hypergateOpenSound release];
    [stats release];
    
    sharedGame = nil;
    
    [Texture drainCache];
    [Model3D drainCache];
    
    [super dealloc];
}

- (void)showStageIntro:(NSString *)name description:(NSString *)description {
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:name
                                                                                                    message:description
                                                                                                 delegate:nil
                                                                                cancelButtonTitle:@"Play Now"
                                                                                otherButtonTitles:nil];
    [alert show];
    [alert release];
}

#pragma mark Updating
- (void)update {
        [self updateTouches];
        [self updateAngle];
        [self updateProjectiles];
        [self updateBeams];

        [ship update];
        [SoundEffect setListenerPos:ship.pos];
        [center setValuesToVector:ship.pos];
        cameraPos.x = center.x;
        cameraPos.y = center.y;

        [starField.pos setValuesToVector:center];
        [starField update];

        [self updateEnemies];
        [self updatePickups];
        [self updateNebulas];
        [flightUI update];

        [self updateCollision];
        [self updateExplosions];

        [hypergate update];

        [self checkForCompletion];
}

- (void)updateTouches {
    ship.thrusting = NO;
    ship.reversing = NO;
    ship.braking   = NO;
    ship.firing    = NO;
    
    // Push buttons
    for (UITouch *touch in activeTouches) {
        
        // Movement buttons
        if (!stageIsEnding) {
            if ([self isTouch:touch inRect:CGRectMake(0, 176, 56, 81)])
                ship.thrusting = YES;
            else if ([self isTouch:touch inRect:CGRectMake(0, 264, 56, 56)])
                ship.reversing = YES;
            else if ([self isTouch:touch inRect:CGRectMake(56, 264, 81, 56)])
                ship.braking = YES;
        }
        
        // Fire Buttons
        if ([self isTouch:touch inRect:CGRectMake(424, 152, 56, 56)]) {
            ship.firing = YES;
            weaponGroupId = 0;
        }
        
        else if ([self isTouch:touch inRect:CGRectMake(424, 208, 56, 56)]) {
            ship.firing = YES;
            weaponGroupId = 1;
        }
        
        else if ([self isTouch:touch inRect:CGRectMake(424, 264, 81, 56)]) {
            ship.firing = YES;
            weaponGroupId = 2;
        }
        
        // Pause
        if ([self isTouch:touch inRect:CGRectMake(347, 0, 75, 75)]) {
            if ([activeTouches count] == 1) {
				[view togglePause];
            }
        }
    }
    
    
    // Pinch zooming
    if ([activeTouches count] == 2) {
        NSArray *touches = [activeTouches allObjects];
        CGPoint point1 = [[touches objectAtIndex:0] locationInView:[[touches objectAtIndex:0] view]];
        CGPoint point2 = [[touches objectAtIndex:1] locationInView:[[touches objectAtIndex:1] view]];
                
        // Both touches are in the middle area
        if (point1.x > 69.0 && point1.x < 411.0 && point2.x > 69.0 && point2.x < 411.0) {
            GLfloat xDiff = fabs(point1.x - point2.x);
            GLfloat yDiff = fabs(point1.y - point2.y);
            GLfloat currentDistance = sqrt(xDiff*xDiff + yDiff*yDiff);
            
            if (previousPinchDistance == 0.0) {
                // First multitouch, save value for when the touches that make up the pinch begin to move
                previousPinchDistance = currentDistance;
            } else {
                GLfloat distanceDifference = previousPinchDistance - currentDistance;
                cameraPos.z += distanceDifference / 20.0;
                previousPinchDistance = currentDistance;
            }
        } else {
            previousPinchDistance = 0.0;
        }
    } else {
        previousPinchDistance = 0.0;
    }
    
    // Turn in simulator
    if (!hasAccelerometer) {
        turnAmount = 0;
        if ([activeTouches count] == 1) {
            CGPoint point = [[activeTouches anyObject] locationInView:[[activeTouches anyObject] view]];
            if (point.x > 69.0 && point.x < 411.0) {
                if (point.x < 240.0) {
                    turnAmount = -1;
                } else {
                    turnAmount = 1;
                }
            }
        }
    }    
}

- (void)updateEnemies {
    for (Enemy *enemy in enemies) {
        if (enemy.currentArmor <= 0) {
            [enemy spawnLoot];
            [enemiesToDestroy addObject:enemy];
        } else {
            [enemy update];
        }
    }
    for (Enemy *enemy in enemiesToDestroy) {
        [enemies removeObject:enemy];
        [targets removeObject:enemy];
    }
    [enemiesToDestroy removeAllObjects];
}

- (void)updateAngle {
    angle -= turnAmount;
    if (angle < 0.0)     angle += 360.0;
    if (angle > 360.0) angle -= 360.0;
    
    [previousAngles removeObjectAtIndex:0];
    [previousAngles addObject:[NSNumber numberWithFloat:angle]];
    
    [ship turnToward:[[previousAngles objectAtIndex:0] floatValue]];
}

- (void)updateProjectiles {
    
    // Update projectiles
    for (Projectile *projectile in projectiles) {
        [projectile update];
        if (projectile.expired) [projectilesToDestroy addObject:projectile];
    }
    
    // Remove expired projectiles
    for (Projectile *projectile in projectilesToDestroy) [projectiles removeObject:projectile];
    [projectilesToDestroy removeAllObjects];
}

- (void)updateBeams {
    // Update beams
    for (Beam *beam in beams) {
        [beam update];
        if (beam.expired) [beamsToDestroy addObject:beam];
    }
    
    // Remove expired beams
    for (Beam *beam in beamsToDestroy) [beams removeObject:beam];
    [beamsToDestroy removeAllObjects];
}

- (void)updateCollision {
    
    // loop through all ships and all projectiles, looking for colisions
    for (Projectile *projectile in projectiles) {
        for (Ship *target in projectile.potentialTargets) {
            // only test if the projectile does not belong to this ship
            if (target.currentArmor > 0.0 && [projectile.pos distance2D:target.pos] < target.size + projectile.collisionSize) {
                // Destroy projectile
                projectile.expired = YES;
                
                // Damage target
                if (projectile.explosionSize > 0.0) {
                    [projectile explode];
                } else {
                    // Play hit sound
                    [projectile playHitSound];
                    
                    // Damage single target
                    [target damageShields:projectile.shieldDmg armor:projectile.armorDmg];
                    
                    // Hit knockback
                    Vector *velOffset = projectile.vel;
                    [velOffset normalize];
                    [velOffset scale:projectile.forceHit / target.mass];
                    [target.vel add:velOffset];
                    
                    // Create hit graphic
                    Explosion *exp = [[Explosion alloc] initWithPosition:projectile.pos
                                                                                                            velocity:nil
                                                                                                                    size:projectile.collisionSize / 3
                                                                                                         imageName:@"Hit.png"
                                                                                             animationFrames:4
                                                                                                            duration:15];
                    [explosions addObject:exp];
                    [exp release];
                    
                }
            }
            
        }
    }
}

- (void)updateExplosions {
    for (Explosion *explosion in explosions) {
        [explosion update];
        if (explosion.expired) [explosionsToDestroy addObject:explosion];
    }
    for (Explosion *explosion in explosionsToDestroy) [explosions removeObject:explosion];
    [explosionsToDestroy removeAllObjects];
}

- (void)updatePickups {
    for (Pickup *pickup in pickups) {
        [pickup update];
        if (pickup.expired) {
            [pickupsToDestroy addObject:pickup];
            [view updateCredits:player.credits];
        }
    }
    
    for (Pickup *pickup in pickupsToDestroy) [pickups removeObject:pickup];
    [pickupsToDestroy removeAllObjects];
}

- (void)updateNebulas {
    [nebulas makeObjectsPerformSelector:@selector(update)];
}

- (void)checkForCompletion {
    if ([self canBeCompleted] && !playedHyperGateOpenSound) {
        [hypergateOpenSound play];
        playedHyperGateOpenSound = YES;
    }
    
    // End the stage
    if (stageIsEnding) {
        if (stageEndFrame == 0) [exitStageSound play];
        stageEndFrame++;
        view.alpha = 1.0 - (float)stageEndFrame / (float)stageEndDuration;
		
		if (ship && ship.currentArmor > 0) {
			// Move ship into hypergate
			[ship.vel scale:0.95 * view.alpha];
			Vector *hypergateDistance = [Vector temp:hypergate.pos];
			[hypergateDistance subtract:ship.pos];
			[hypergateDistance scale:view.alpha * 0.15];
			[ship.vel add:hypergateDistance];
			
			// Zoom camera
			cameraPos.z = CAMERA_HEIGHT_MIN + (CAMERA_HEIGHT_MAX - CAMERA_HEIGHT_MIN)/2 + (CAMERA_HEIGHT_MAX - CAMERA_HEIGHT_MIN)/2 * (1.0 - cos(M_PI * view.alpha / 2));
		}
        
        // Fade music
        [music setVolume:view.alpha];
        		
        // End the stage completely
        if (stageEndFrame > stageEndDuration) {
            [(EAGLView *)view stopAnimation];
            if (ship.currentArmor > 0) {
                [stats setObject:[NSArray arrayWithArray:foundWeapons]     forKey:@"Weapons"];
                [stats setObject:[NSArray arrayWithArray:foundEquipment] forKey:@"Equipment"];
                
                for (NSString *weaponName in foundWeapons) [player addWeaponToInventory:weaponName];
                for (NSString *itemName in foundEquipment) [player addEquipmentToInventory:itemName];
                
                [player completeStage:stageName];
                [player save];
            }
            [music stop];
            
            if (ship.currentArmor > 0) {
                [(VoidAppDelegate *)[[UIApplication sharedApplication] delegate] showHyperspaceWithStats:[NSDictionary dictionaryWithDictionary:stats]];
            } else {
                [(VoidAppDelegate *)[[UIApplication sharedApplication] delegate] showHyperspace];
            }
            
        }
    } else if (ship.currentArmor <= 0 || ([self canBeCompleted] && [ship.pos distance2D:hypergate.pos] - ship.size < 3.0)) {
        stageIsEnding = YES;
    }
}

- (BOOL)canBeCompleted {
    for (Enemy *enemy in enemies) {
        if (!enemy.optional) return NO;
    }
    
    return YES;
}

#pragma mark Internal State Changes
- (void)addCredits:(int)credits {
    // Update stats
    int oldCredits = [[stats objectForKey:@"Credits"] intValue];
    int newCredits = oldCredits + credits;
    [stats setObject:[NSNumber numberWithInt:newCredits] forKey:@"Credits"];
    
    // Update player
    player.credits += credits;
}

- (void)pickupItem:(NSString *)itemName type:(NSString *)itemType {
    NSLog(@"picked up item: %@, %@", itemType, itemName);
    
    if ([itemType isEqualToString:@"Weapon"]) {
        NSLog(@"foundWeapons count: %i", [foundWeapons count]);
        [foundWeapons addObject:itemName];
        NSLog(@"foundWeapons count: %i", [foundWeapons count]);
        
        player.newWeaponCount++;
    } else if ([itemType isEqualToString:@"Equipment"]) {
        [foundEquipment addObject:itemName];
        player.newEquipmentCount++;
    }
}

- (void)abortStage {
    [ship damageShields:1000000 armor:1000000];
}

- (void)autocomplete {
    for (Enemy *enemy in enemies) {
        [enemy.pos setValuesToVector:hypergate.pos];
        [enemy.vel scale:0.0];
        [enemy damageShields:1000000 armor:1000000];
    }
    
    [ship.pos setValuesToVector:hypergate.pos];
    [ship.vel scale:0.0];
}

#pragma mark Rendering

#define RENDER_DISTANCE_THRESHOLD 20.0
- (void)render {
    [self renderFrameSetup];
    [self renderCamera];
    
    [starField render];
    
    [self renderPlanets];
    
    [hypergate render];
    
    [projectiles makeObjectsPerformSelector:@selector(render)];
    
    [beams makeObjectsPerformSelector:@selector(render)];
    
    for (Enemy *enemy in enemies) {
        if ([cameraPos distance2D:enemy.pos] < RENDER_DISTANCE_THRESHOLD) [enemy render];
    }
    
    if (ship.currentArmor > 0) [ship render];
    
    [pickups makeObjectsPerformSelector:@selector(render)];
    [explosions makeObjectsPerformSelector:@selector(render)];
    [nebulas makeObjectsPerformSelector:@selector(render)];
    
    [flightUI render];
}

- (void)renderCamera {
    if (cameraPos.z > CAMERA_HEIGHT_MAX) cameraPos.z = CAMERA_HEIGHT_MAX;
    if (cameraPos.z < CAMERA_HEIGHT_MIN) cameraPos.z = CAMERA_HEIGHT_MIN;
    
    GLfloat extraTiltPortion = 1-(cameraPos.z - CAMERA_HEIGHT_MIN)/(CAMERA_HEIGHT_MAX - CAMERA_HEIGHT_MIN);
    GLfloat cameraTilt = CAMERA_ANGLE + extraTiltPortion*CAMERA_ZOOM_TILT_ANGLE;
    
    // Setup camera
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
	
//	// Set to landscape
//	glRotatef(-90.0, 0.0, 0.0, 1.0);
    
    // Create perspective frustrum
    glFrustumf(-1.5, 1.5, -1.0, 1.0, 4.0, 200.0);
    
    // Translate it behind a bit
    glTranslatef(0.0, -0.08*cameraPos.z, 0.0);
    
    // Move camera above play plane
    glTranslatef(0.0, 0.0, -cameraPos.z);
    
    // Rotate the view to slightly down, staying pointed at origin
    glRotatef(-cameraTilt, 1.0, 0.0, 0.0);
    
    // Spin camera to match angle of viewport
    glRotatef(-angle, 0.0, 0.0, 1.0);
    
    // Position camera
    glTranslatef(-cameraPos.x, -cameraPos.y, 0.0);
}

- (void)renderFrameSetup {
    // Clear screen for new frame
    
    GLfloat color[3] = {
        0.0,
        0.0,
        0.0,
    };
    
    if ([self canBeCompleted] && canBeCompletedEffectCount < canBeCompletedEffectDuration) {
        canBeCompletedEffectCount++;
        GLfloat progress = (GLfloat)canBeCompletedEffectCount / canBeCompletedEffectDuration;
        
        color[0] = 0.4 * (1.0 - progress),
        color[1] = 0.0;
        color[2] = 0.2 * (1.0 - progress);
    }
    
    
    glClearColor(color[0], color[1], color[2], 255);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
}

- (void)renderPlanets {
    [planets makeObjectsPerformSelector:@selector(render)];
}

#pragma mark Input
- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration {
    hasAccelerometer = YES;
    
    // Set range of values to only 1/5 of a vertical tilt
    GLfloat currentTilt = acceleration.y * turnSesitivity;
    if (currentTilt >    1.0) currentTilt =    1.0;
    if (currentTilt < -1.0) currentTilt = -1.0;
    
    // invert steering
    if (invertSteering) currentTilt = -currentTilt;
    
    // Apply deadzone
    GLfloat deadZone = 0.2;
    if (currentTilt < deadZone && currentTilt > -deadZone) {
        currentTilt = 0.0;
    } else {
        if (currentTilt > 0) currentTilt -= deadZone;
        if (currentTilt < 0) currentTilt += deadZone;
        currentTilt *= 1.0/(1.0 - deadZone);
    }
    
    // Multiply by the max camera turn speed
    currentTilt *= -3.0;
    
    // Average with last amount to smooth a little
    turnAmount = (currentTilt + lastTilt)/2;
    
    // Assign the current value to the last value for the next smoothing value
    lastTilt = currentTilt;
}

- (BOOL)isTouch:(UITouch *)touch inRect:(CGRect)rect {
    CGPoint point = [touch locationInView:touch.view];
    
    CGPoint touchPoint = point; // CGPointMake(point.y, 320.0 - point.x);
	
    BOOL inX = touchPoint.x > rect.origin.x && touchPoint.x < rect.origin.x + rect.size.width;
    BOOL inY = touchPoint.y > rect.origin.y && touchPoint.y < rect.origin.y + rect.size.height;
    
    return inX && inY;
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    for (UITouch *touch in touches) {
        [activeTouches addObject:touch];
    }
    //[self touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
    for (UITouch *touch in touches) {
        [activeTouches removeObject:touch];
    }
}


@end
