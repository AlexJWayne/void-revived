//
//    Ship.m
//    Void
//
//    Created for VOID on 9/15/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Ship.h"
#include "Game.h"

static NSDictionary *aTemplates;
static int shipInitCount;

@class Game;

@implementation Ship

@synthesize thrusting, reversing, braking, firing, size, mass, identifier, currentShields, maxShields, shieldRecharge, shieldRechargeDelay, currentArmor, maxArmor, armorRecharge, energyCurrent, energyMax, energyRecharge, guns, turnSpeed, maxSpeed, thrusterForce, brakeForce;


#pragma mark Initialization
+ (void)initialize {
    aTemplates = [Utility dataFile:@"ShipTypes"];
}

- (void)_commonInit {
	identifier = shipInitCount++;
    
	// Load ship from aTemplate
    NSDictionary *typeTemplate = [aTemplates objectForKey:[loadoutDictionary objectForKey:@"type"]];
    if (!typeTemplate) {
        [Utility showError:[NSString stringWithFormat:@"ShipType not found: %@", [loadoutDictionary objectForKey:@"type"]]];
    }
    
    shieldRecharge    = [[typeTemplate objectForKey:@"shieldRecharge"] floatValue];
    shieldRechargeDelay = [[typeTemplate objectForKey:@"shieldRechargeDelay"] floatValue];
    maxShields            = [[typeTemplate objectForKey:@"shields"] floatValue];
    maxArmor                = [[typeTemplate objectForKey:@"armor"] floatValue];
    currentShields    = maxShields;
    currentArmor        = maxArmor;
    
    maxSpeed                = [[typeTemplate objectForKey:@"maxSpeed"] floatValue];
    thrusterForce     = [[typeTemplate objectForKey:@"thrusterForce"] floatValue];
    brakeForce            = [[typeTemplate objectForKey:@"brakeForce"] floatValue];
    turnSpeed             = [[typeTemplate objectForKey:@"turnSpeed"] floatValue];
    size                        = [[typeTemplate objectForKey:@"size"] floatValue];
    mass                        = [[typeTemplate objectForKey:@"mass"] floatValue];
    energyMax             = [[typeTemplate objectForKey:@"energy"] floatValue];
    energyRecharge    = [[typeTemplate objectForKey:@"energyRecharge"] floatValue];
    energyCurrent     = energyMax;
    
    // Load models and textures
    pulsePhase        = (GLfloat)rand() / (GLfloat)RAND_MAX;
    models                = [[NSMutableArray alloc] init];
    textures            = [[NSMutableArray alloc] init];
    textureStyles = [[NSMutableArray alloc] init];
    for (NSDictionary *modelPartData in [typeTemplate objectForKey:@"model"]) {
        [models         addObject:[Model3D modelNamed:[modelPartData objectForKey:@"modelName"]]];
        [textures       addObject:[Texture textureNamed:[modelPartData objectForKey:@"texture"]]];
        [textureStyles  addObject:[modelPartData objectForKey:@"style"]];
    }
    shieldBubbleTexture = [[Texture textureNamed:@"ShieldBubble.png"] retain];
    
    thrusterModel = [[Model3D modelNamed:[typeTemplate objectForKey:@"thrusterModelName"]] retain];
    thrusterTexture = [[Texture textureNamed:[typeTemplate objectForKey:@"thrusterTexture"]] retain];
    
    explosionSprite = [[typeTemplate objectForKey:@"explosionSprite"] retain];
    
    equipmentBonuses = [[NSMutableDictionary alloc] init];
    
    // Load equipment
    NSDictionary *equipmentList = [Utility dataFile:@"Equipment"];
    equipment = [[NSMutableArray alloc] initWithArray:[loadoutDictionary objectForKey:@"equipment"]];
    
    // Loop through all equipment
    for (NSString *equipmentName in equipment) {
        
        // Process the equipment if this slot has anything in it.
        if (![equipmentName isEqualToString:@"<Empty>"]) {
            
            // Add item mass
            mass += [[[equipmentList objectForKey:equipmentName] objectForKey:@"mass"] floatValue];
            
            // Loop through all effects on this equipment
            for (NSDictionary *effect in [[equipmentList objectForKey:equipmentName] objectForKey:@"effects"]) {
                NSString *stat = [effect objectForKey:@"stat"];
                GLfloat currentValue = [[equipmentBonuses objectForKey:stat] floatValue];
                NSNumber *newValue = [NSNumber numberWithFloat:currentValue + [[effect objectForKey:@"amount"] floatValue]];
                
                [equipmentBonuses setObject:newValue forKey:stat];
                
                // Create armor recharge
                if ([stat isEqualToString:@"armorRecharge"]) {
                    armorRecharge += [newValue floatValue];
                }
            }
            
        }
    }
    
    // Alter ship stats for equipment bonsuses
    shieldRecharge      += shieldRecharge       * [[equipmentBonuses objectForKey:@"shieldRecharge"] floatValue];
    shieldRechargeDelay += shieldRechargeDelay  * [[equipmentBonuses objectForKey:@"shieldRechargeDelay"] floatValue];
    energyRecharge      += energyRecharge       * [[equipmentBonuses objectForKey:@"energyRecharge"] floatValue];
    energyMax           += energyMax            * [[equipmentBonuses objectForKey:@"energy"] floatValue];
    maxShields          += maxShields           * [[equipmentBonuses objectForKey:@"shields"] floatValue];
    maxArmor            += maxArmor             * [[equipmentBonuses objectForKey:@"armor"] floatValue];
    maxSpeed            += maxSpeed             * [[equipmentBonuses objectForKey:@"maxSpeed"] floatValue];
    thrusterForce       += thrusterForce        * [[equipmentBonuses objectForKey:@"thrusterForce"] floatValue];
    brakeForce          += brakeForce           * [[equipmentBonuses objectForKey:@"brakeForce"] floatValue];
    turnSpeed           += turnSpeed            * [[equipmentBonuses objectForKey:@"turnSpeed"] floatValue];
    mass                += mass                 * [[equipmentBonuses objectForKey:@"mass"] floatValue];
    
    
    currentShields = maxShields;
    currentArmor = maxArmor;
    
    
    
    // Setup weapons
    weaponGroups = [[loadoutDictionary objectForKey:@"weaponGroups"] retain];
    gunfireRecoil = [[Vector alloc] init];
    gunfireRecoilTotal = [[Vector alloc] init];
    guns = [[NSMutableArray alloc] init];
    gunHardpoints = [[NSMutableArray alloc] init];
    
    // Make sure guns and hardpoints match quantities
    if ([[loadoutDictionary objectForKey:@"guns"] count] > [[typeTemplate objectForKey:@"gunHardpoints"] count]) {
        [Utility showError:[NSString stringWithFormat:@"Weapon hardpoint mismatch. hardpoints: %i, loadout guns: %i",
                            [[typeTemplate objectForKey:@"gunHardpoints"] count],
                            [[loadoutDictionary objectForKey:@"guns"] count]]];
    }
    
    // Mount guns
    for (int i = 0; i < [[loadoutDictionary objectForKey:@"guns"] count]; i++) {
        Vector *hardpointPos = [[[Vector alloc] init] autorelease];
        hardpointPos.x = [[[[typeTemplate objectForKey:@"gunHardpoints"] objectAtIndex:i] objectForKey:@"x"] floatValue];
        hardpointPos.y = [[[[typeTemplate objectForKey:@"gunHardpoints"] objectAtIndex:i] objectForKey:@"y"] floatValue];
        hardpointPos.z = [[[[typeTemplate objectForKey:@"gunHardpoints"] objectAtIndex:i] objectForKey:@"z"] floatValue];
        [gunHardpoints addObject:hardpointPos];
        
        [self setGunAtHardpointIndex:i toGunNamed:[[loadoutDictionary objectForKey:@"guns"] objectAtIndex:i]];
    };
    
    shuffledGuns = [[NSMutableArray alloc] initWithArray:guns];
    
    // Sounds
    explosionSoundName = [[@"Explosion." stringByAppendingString:[typeTemplate objectForKey:@"explosionSound"]] retain];
    [SoundEffect effectNamed:explosionSoundName looping:NO]; // preload the sound
    
    if ([typeTemplate objectForKey:@"thrusterSound"]) {
        thrusterSound = [[SoundEffect alloc] initWithName:[NSString stringWithFormat:@"Thruster.%@", [typeTemplate objectForKey:@"thrusterSound"]] looping:YES];
        [thrusterSound cacheWithName:[NSString stringWithFormat:@"%@-%i", thrusterSound.effectName, identifier]];
        
        if ([Game sharedGame].ship == nil) {
            reverseSound = [[SoundEffect alloc] initWithName:[NSString stringWithFormat:@"Thruster.%@.Reverse", [typeTemplate objectForKey:@"thrusterSound"]] looping:YES];
            [reverseSound cacheWithName:[NSString stringWithFormat:@"%@.Reverse-%i", reverseSound.effectName, identifier]];
        }
    }
    reverseSoundDecay = 0.0;
}

- (id)initWithDictionary:(NSDictionary *)loadoutTemplate {
    [super init];
	loadoutDictionary = [loadoutTemplate retain];
	[self _commonInit];
    return self;
}

- (id)initWithCoder:(NSCoder*)coder {
	[super initWithCoder:coder];
	
	loadoutDictionary = [[coder decodeObjectForKey:@"loadoutDictionary"] retain];
	[self _commonInit];
	
	shieldRechargeDelayElapsed = [coder decodeFloatForKey:@"shieldRechargeDelayElapsed"];
	currentShields = [coder decodeFloatForKey:@"currentShields"];
	currentArmor = [coder decodeFloatForKey:@"currentArmor"];
	energyCurrent = [coder decodeFloatForKey:@"energyCurrent"];
	
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[super encodeWithCoder:coder];
	[coder encodeObject:loadoutDictionary forKey:@"loadoutDictionary"];
	[coder encodeFloat:shieldRechargeDelayElapsed forKey:@"shieldRechargeDelayElapsed"];
	[coder encodeFloat:currentShields forKey:@"currentShields"];
	[coder encodeFloat:currentArmor forKey:@"currentArmor"];
	[coder encodeFloat:energyCurrent forKey:@"energyCurrent"];
}


- (void)setGunAtHardpointIndex:(int)hardpointIndex toGunNamed:(NSString *)gunName {
    if ([gunName isEqualToString:@"<Empty>"]) {
        [guns addObject:gunName];
    } else {
        Vector *hardpointPos = [Vector temp:nil];
        [hardpointPos setValuesToVector:[gunHardpoints objectAtIndex:hardpointIndex]];
        [hardpointPos scale:size];
        
        Weapon *gun = [[[Weapon alloc] initWithWeaponName:gunName hardpointPos:hardpointPos shipId:identifier bonuses:equipmentBonuses] autorelease];
        [guns addObject:gun];
        
        mass += gun.mass;
    }    
}

- (void)dealloc {
	[loadoutDictionary release];
	
    [gunHardpoints release];
    [weaponGroups release];
    [guns release];
    [shuffledGuns release];
    [gunfireRecoil release];
    [models release];    
    [textures release];
    [textureStyles release];
    [shieldBubbleTexture release];
    [thrusterModel release];
    [thrusterTexture release];
    [explosionSprite release];
    [explosionSoundName release];
    
    [thrusterSound stop];
    [thrusterSound release];
    
    [reverseSound stop];
    [reverseSound release];
    
    [equipmentBonuses release];
    [super dealloc];
}

#pragma mark Updating
- (void)update {
    [super update];
    [self updateEnergy];
    [self updateShields];
    [self updateGuns];
}

#define BANK_MAX 30.0
#define BANK_FILTER 0.05
- (void)updateAngle {
    [super updateAngle];
    
    // Get the difference between the current angle and the desired angle
    GLfloat turnAmount = turnToward - angle;
    
    // Get the shortest route, CW or CCW
    if (turnAmount < -180) turnAmount += 360;
    if (turnAmount >    180) turnAmount -= 360;
    
    // cap the turn amount by the max turn speed
    if (turnAmount < -turnSpeed) turnAmount = -turnSpeed;
    if (turnAmount >    turnSpeed) turnAmount =    turnSpeed;
    
    // Apply the angular offset
    angle += turnAmount;
    
    // Update banking angle
    if (turnSpeed > 0) bankAngle = bankAngle*(1.0 - BANK_FILTER) + (-turnAmount/turnSpeed)*BANK_FILTER*BANK_MAX;
    
}

- (void)updateAccel {
    [super updateAccel];
    
    // accel direction
    accel.x = -sin(angle * (M_PI/180));
    accel.y =    cos(angle * (M_PI/180));
    
    // Thrust or reverse
    GLfloat force;
    if (thrusting) {
        thrusterAlpha = 1.0;
        [thrusterSound setVolume:thrusterAlpha];
        if (!thrusterSound.playing) [thrusterSound play];
        force = thrusterForce;
        
    } else if (reversing) {
        reverseSoundDecay = 1.0;
        [reverseSound setVolume:reverseSoundDecay];
        if (!reverseSound.playing) [reverseSound play];
        force = -brakeForce;
        
    } else {
        force = 0.0;
    }
    
    if (!thrusting) {
        thrusterAlpha -= 0.1;
        if (thrusterSound.playing) {
            [thrusterSound setVolume:thrusterAlpha];
            if (thrusterAlpha < 0.05) [thrusterSound stop];
        }        
    }
    
    if (!reversing) {
        reverseSoundDecay -= 0.1;
        if (reverseSound.playing) {
            [reverseSound setVolume:reverseSoundDecay];
            if (reverseSoundDecay < 0.05) [reverseSound stop];
        }
    }
    
    [accel scale:(force / mass)];
}

- (void)updateVel {
    [self updateBraking];
    [super updateVel];
    
    // Gravity
    for (Planet *planet in [Game sharedGame].planets) {
        if (planet.gravity > 0) {
            Vector *temp = [Vector temp:planet.pos];
            [temp setValuesToVector:planet.pos];
            [temp subtract:pos];
            
            GLfloat dist = [temp length];
            GLfloat maxDist = planet.size * 5;
            GLfloat gravityAccel = planet.gravity / pow(dist, 2);
            
            
            if (dist < maxDist) {
                [temp normalize];
                
                if (dist < planet.size/2) {
                    [temp scale:(planet.gravity / pow(planet.size/2, 2)) * (dist / (planet.size/2))];
                } else {
                    [temp scale:gravityAccel];
                }
                
                [vel add:temp];
            }
        }
    }
    
    // Ensure speed limit
    [vel limit:maxSpeed];
}

- (void)updateBraking {
    if (braking && !thrusting) {
        GLfloat oldSpeed = [vel length];
        GLfloat drag = brakeForce/mass;
        if (drag > oldSpeed) {
            [vel scale:0];
        } else {
            GLfloat newSpeed = oldSpeed - drag;
            [vel normalize];
            [vel scale:newSpeed];
        } 
    }
}

- (void)updatePos {
    [super updatePos];
    
    // Turn off thruster sound
    if (thrusting || thrusterAlpha > 0.0) {
        [thrusterSound setPosition:pos];
    }
    
    if (reverseSound.playing) [reverseSound setPosition:pos];
}

- (void)updateEnergy {
    energyCurrent += energyRecharge;
    if (energyCurrent > energyMax) energyCurrent = energyMax;
}

- (void)updateShields {
    shieldRechargeDelayElapsed++;
    
    // Apply nebula effects
    for (Nebula *nebula in [Game sharedGame].nebulas) {
        Vector *temp = [Vector temp:pos];
        [temp subtract:nebula.pos];
        
        if ([temp length] < nebula.size/2) {
            // drag
            [temp setValuesToVector:vel];
            [temp normalize];
            [temp scale:nebula.drag * pow([vel length], 2) * pow(size, 1.5) / mass];
            [vel subtract:temp];
            
            // regens
            energyCurrent += nebula.energyRegen;
            if (energyCurrent > energyMax) energyCurrent = energyMax;
            
            if (currentArmor > 0.0 && (nebula.armorRegen > 0 || nebula.shieldRegen > 0)) {
                if (shieldRechargeDelayElapsed > shieldRechargeDelay) {
                    // positive nebula
                    currentShields += nebula.shieldRegen;
                    currentArmor   += nebula.armorRegen;
                    
                    if (currentArmor   > maxArmor)   currentArmor   = maxArmor;
                    if (currentShields > maxShields) currentShields = maxShields;
                }
            } else {
                // negative nebula
                [self damageShields:-nebula.shieldRegen armor:-nebula.armorRegen];
            }
        }
    }
    
    if (shieldRechargeDelayElapsed > shieldRechargeDelay) {
        currentShields += shieldRecharge;
        if (currentShields > maxShields) currentShields = maxShields;
        
        if (armorRecharge > 0.0 && currentArmor > 0.0) {
            float baseArmorRecharge = maxArmor/200.0;
            currentArmor += baseArmorRecharge * armorRecharge;
            if (currentArmor > maxArmor) currentArmor = maxArmor;
        }
    }
    
    GLfloat shieldVisbleDuration = 15.0;
    if (shieldBubbleAlpha > 0.0) {
        shieldBubbleAlpha -= 1.0/shieldVisbleDuration;
    } else {
        shieldBubbleAlpha = 0.0;
    }
}

- (void)updateGuns {
    if (currentArmor <= 0) return;
    
    BOOL playedFireSound = NO;
    BOOL doShuffle = NO;
    
    for (id gunObj in shuffledGuns) {
        if ([gunObj isKindOfClass:[Weapon class]]) {
            Weapon *gun = (Weapon *)gunObj;
            [gun updateWithPos:pos angle:angle bankAngle:bankAngle];
			
            BOOL isPlayer = [Game sharedGame].ship == self;
            int weaponGroupId = [Game sharedGame].weaponGroupId;
            NSNumber *gunIdObject = [NSNumber numberWithInt:[guns indexOfObject:gun]];
            
            // Fire.    If this is the player's ship, fire this gun only if it is in the active group.
            if (firing) {
                if ((isPlayer && [[weaponGroups objectAtIndex:weaponGroupId] indexOfObject:gunIdObject] != NSNotFound) || !isPlayer) {
                    if (energyCurrent < gun.energy) [gun stopFiringSoundAndDecay];
                    
                    if (energyCurrent >= gun.energy && [gun fire:vel alreadyPlayedSound:playedFireSound]) {
                        playedFireSound = YES;
                        
                        // Gunfire knockback
                        gunfireRecoil.x = 0.0;
                        gunfireRecoil.y = -(gun.forceFire / mass);
                        gunfireRecoil.z = 0.0;
                        
                        [gunfireRecoil rotateOnZ:angle];
                        [gunfireRecoilTotal add:gunfireRecoil];
                        
                        // subtract energy
                        energyCurrent -= gun.energy;
                        
                        // Shuffle guns
                        if ([shuffledGuns count] > 1) doShuffle = YES;
                    } 
                }
            }
            
            // is the weapon in the currently firing group
            BOOL inCurrentGroup = [[weaponGroups objectAtIndex:[Game sharedGame].weaponGroupId] indexOfObject:[NSNumber numberWithInt:[guns indexOfObject:gun]]] != NSNotFound;
            
            // If not firing stop the looping fire sound
            if (!firing || !inCurrentGroup)
                [gun stopFiringSound];
        }
    }
    
    // Do the gun shuffle
    if (doShuffle) {
        Weapon *gunToShuffle = [shuffledGuns objectAtIndex:0];
        [shuffledGuns removeObjectAtIndex:0];
        [shuffledGuns addObject:gunToShuffle];            
    }
    
    [vel add:gunfireRecoilTotal];
    gunfireRecoilTotal.x = 0;
    gunfireRecoilTotal.y = 0;
    gunfireRecoilTotal.z = 0;
}

#pragma mark State Changes
- (void)damageShields:(GLfloat)shieldAmount armor:(GLfloat)armorAmount {
    if (currentArmor <= 0) return;
    
    shieldRechargeDelayElapsed = 0;
    
    if (currentShields > 0) {
        currentShields -= shieldAmount;
        if (currentShields < 0) {
            armorAmount = (-currentShields / shieldAmount) * armorAmount;
            currentArmor -= armorAmount;
            currentShields = 0.0;
        }
        
        // Show shield graphic
        shieldBubbleAlpha = 1.0;
        
    } else {
        currentArmor -= armorAmount;
    }
    
    // Destroyed
    if (currentArmor <= 0) {
        currentArmor = 0;
        [thrusterSound stop];
        
        for (Weapon *gun in guns) {
            if ([gun respondsToSelector:@selector(stopFiringSound)]) {
                [gun stopFiringSound];
            }
        }
		
        // Create explosion
        Explosion *explosion = [[Explosion alloc] initWithPosition:pos
                                                                                                            velocity:vel
                                                                                                                    size:size*3
                                                                                                         imageName:explosionSprite
                                                                                             animationFrames:16
                                                                                                            duration:60];
        [explosion playSound:explosionSoundName];
        [[Game sharedGame].explosions addObject:explosion];
        [explosion release];
        
        // Update stats
        if (self != [Game sharedGame].ship) {
            int newKills = [[[Game sharedGame].stats objectForKey:@"Kills"] intValue] + 1;
            [[Game sharedGame].stats setObject:[NSNumber numberWithInt:newKills] forKey:@"Kills"];
        }
    }
}

- (void)turnToward:(GLfloat)turnAngle {
    turnToward = turnAngle;
}


#pragma mark Rendering
- (void)render {
    glEnable(GL_DEPTH_TEST);
//    for (id gun in guns) {
//        if ([gun isKindOfClass:[Weapon class]]) [(Weapon *)gun render];
//    }
    
    [self renderShip];
    [self renderThrusters];
    glDisable(GL_DEPTH_TEST);
    
    [self renderShieldBubble];
}

- (void)renderShip {
    // Position
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    glTranslatef(pos.x, pos.y, pos.z);
    glRotatef(angle, 0.0, 0.0, 1.0);
    glRotatef(bankAngle, 0.0, 1.0, 0.0);
    glScalef(size, size, size);
    
    for (int i = 0; i < [models count]; i++) {
        // Enable lighting
        if ([[textureStyles objectAtIndex:i] isEqualToString:@"opaque"]) {
            glEnable(GL_LIGHTING);
            glEnable(GL_LIGHT0);
        }
        
        // Setup material
        GLfloat matAmbient[] = { 0.3, 0.3, 0.3, 1.0 };
        GLfloat matDiffuse[] = { 1.0, 1.0, 1.0, 1.0 };
        GLfloat matSpecular[] = { 1.0, 1.0, 1.0, 1.0 };
        GLfloat matShininess[] = { 90.0 };
        glMaterialfv(GL_FRONT_AND_BACK, GL_AMBIENT, matAmbient);
        glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, matDiffuse);
        glMaterialfv(GL_FRONT_AND_BACK, GL_SPECULAR, matSpecular);
        glMaterialfv(GL_FRONT_AND_BACK, GL_SHININESS, matShininess);
        
        // prepare texture blending
        if ([[textureStyles objectAtIndex:i] isEqualToString:@"opaque"]) {
            [[textures objectAtIndex:i] enable];
            [[models objectAtIndex:i] render];
            
        } else if ([[textureStyles objectAtIndex:i] isEqualToString:@"add"]) {
            [[textures objectAtIndex:i] enableWithSrcFunc:GL_ONE destFunc:GL_ONE];
            [[models objectAtIndex:i] render];
            
        } else if ([[textureStyles objectAtIndex:i] isEqualToString:@"pulse"]) {
            pulsePhase += 0.01;
            if (pulsePhase > 1.0) pulsePhase -= 1.0;
            [[textures objectAtIndex:i] enable];
            [[models objectAtIndex:i] renderWithAlpha:1.0 - pulsePhase];
            
        } else {
            [NSException raise:@"Invalid Model Blending Mode" format:@"Got %@, expected opaque, add, or pulse.", [textureStyles objectAtIndex:i]];
        }
        
        [[textures objectAtIndex:i] disable];
        
        // Turn off lighting
        glDisable(GL_LIGHTING);
        glDisable(GL_LIGHT0);
        //glEnable(GL_CULL_FACE);
    }
}

- (void)renderShieldBubble {
    if (shieldBubbleAlpha <= 0.0) return;
    
    GLfloat vertices[] = {
         2.0, 2.0,
        -2.0, 2.0,
         2.0,-2.0,
        -2.0,-2.0,
    };
    
    GLshort textureCoords[] = {
        0, 0,
        1, 0,
        0, 1,
        1, 1,
    };
    
    // Load vertices
    glVertexPointer(2, GL_FLOAT, 0, vertices);
    glEnableClientState(GL_VERTEX_ARRAY);
    
    // Load texture coordinates
    glTexCoordPointer(2, GL_SHORT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
    
    // Color Shield
    CGFloat shieldRatio = currentShields/maxShields;
    glDisableClientState(GL_COLOR_ARRAY);
    glColor4f(1.0, shieldRatio, shieldRatio, shieldBubbleAlpha);
    
    // Render
    [shieldBubbleTexture enable];
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    [shieldBubbleTexture disable];
}

- (void)renderThrusters {
    if (thrusterAlpha > 0.0) {
        [thrusterTexture enable];
        [thrusterModel renderWithAlpha:thrusterAlpha];
        [thrusterTexture disable];
    }
}

@end












