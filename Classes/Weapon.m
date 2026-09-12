//
//    Weapon.m
//    Void
//
//    Created for VOID on 9/20/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Weapon.h"
#import "Game.h"

static NSDictionary *aTemplates;

@class Game;

@implementation Weapon

@synthesize name, iconName, description, value;
@synthesize isBeam, forceFire, energy, speed, shieldDmg, armorDmg, lifetime, mass;

+ (void)initialize {
    aTemplates = [Utility dataFile:@"Weapons"];
}

- (id)initWithWeaponName:(NSString *)aTemplateName {
    if ([aTemplateName isEqualToString:@"<Empty>"]) return nil;
    [super init];
    
    // Load weapon from aTemplate
    weaponTemplate    = [[NSMutableDictionary alloc] initWithDictionary:[aTemplates objectForKey:aTemplateName]];
    
    name                        = [aTemplateName retain];
    iconName                = [[weaponTemplate objectForKey:@"icon"] retain];
    description         = [[weaponTemplate objectForKey:@"description"] retain];
    value                     = [[weaponTemplate objectForKey:@"value"] intValue];
    
    isBeam                    = [[weaponTemplate objectForKey:@"beam"] boolValue];
    coolDown                = [[weaponTemplate objectForKey:@"coolDown"] floatValue];
    lifetime                = [[weaponTemplate objectForKey:@"lifetime"] floatValue];
    speed                     = [[weaponTemplate objectForKey:@"speed"] floatValue];
    spread                    = [[weaponTemplate objectForKey:@"spread"] floatValue];
    shieldDmg             = [[weaponTemplate objectForKey:@"shieldDmg"] floatValue];
    armorDmg                = [[weaponTemplate objectForKey:@"armorDmg"] floatValue];
    forceFire             = [[weaponTemplate objectForKey:@"forceFire"] floatValue];
    forceHit                = [[weaponTemplate objectForKey:@"forceHit"] floatValue];
    energy                    = [[weaponTemplate objectForKey:@"energy"] floatValue];
    size                        = [[weaponTemplate objectForKey:@"modelSize"] floatValue];
    targetingArc        = [[weaponTemplate objectForKey:@"targetingArc"] floatValue];
    mass                        = [[weaponTemplate objectForKey:@"mass"] floatValue];
    fireSoundLoops    = [[weaponTemplate objectForKey:@"fireSoundLoops"] boolValue];
    beamRange             = [[weaponTemplate objectForKey:@"beamRange"] floatValue];
    seekTurnSpeed     = [[weaponTemplate objectForKey:@"seekTurnSpeed"] floatValue];
    
    return self;
}

- (id)initWithWeaponName:(NSString *)aTemplateName hardpointPos:(Vector *)aHardpointPos shipId:(int)aShipId bonuses:(NSDictionary *)bonuses {
    if ([aTemplateName isEqualToString:@"<Empty>"]) return nil;
    
    [self initWithWeaponName:aTemplateName];
    
    
    shipId = aShipId;
    posOffset = [[Vector alloc] init];
    
    // Apply bonuses
    shieldDmg += shieldDmg    * [[bonuses objectForKey:@"shieldDmg"] floatValue];
    armorDmg    += armorDmg     * [[bonuses objectForKey:@"armorDmg"] floatValue];
    speed         += speed            * [[bonuses objectForKey:@"projectileSpeed"] floatValue];
    coolDown    += coolDown     * [[bonuses objectForKey:@"coolDown"] floatValue];
    spread        += spread         * [[bonuses objectForKey:@"spread"] floatValue];
    
    seekTurnSpeed += seekTurnSpeed * [[bonuses objectForKey:@"seekTurnSpeed"] floatValue];
    beamRange         += beamRange         * [[bonuses objectForKey:@"range"]                 floatValue];
    if (!isBeam) lifetime += lifetime * [[bonuses objectForKey:@"range"] floatValue];
    
    // Update aTemplate
    [weaponTemplate setObject:[NSNumber numberWithFloat:shieldDmg] forKey:@"shieldDmg"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:armorDmg] forKey:@"armorDmg"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:speed] forKey:@"speed"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:beamRange] forKey:@"beamRange"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:lifetime] forKey:@"lifetime"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:coolDown] forKey:@"coolDown"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:spread] forKey:@"spread"];
    [weaponTemplate setObject:[NSNumber numberWithFloat:seekTurnSpeed] forKey:@"seekTurnSpeed"];    
    
    projectileImage = [[weaponTemplate objectForKey:@"projectileImage"] retain];
    projectileSize    = [[weaponTemplate objectForKey:@"projectileSize"] floatValue];
    projectileCollisionSize = [[weaponTemplate objectForKey:@"projectileCollisionSize"] floatValue];
    projectileIsDirectional = [[weaponTemplate objectForKey:@"projectileIsDirectional"] boolValue];
    
//    model = [[Model3D modelNamed:[@"Weapon." stringByAppendingString:[weaponTemplate objectForKey:@"modelName"]]] retain];
//    if ([weaponTemplate objectForKey:@"modelTexture"]) {
//        texture = [[Texture textureNamed:[weaponTemplate objectForKey:@"modelTexture"]] retain];
//    } else {
//        texture = [[Texture textureNamed:[[weaponTemplate objectForKey:@"modelName"] stringByAppendingString:@".png"]] retain];
//    }

    // Load sounds
    soundsFire            = [[NSMutableArray alloc] init];
    if (fireSoundLoops) {
        NSString *soundName = [[weaponTemplate objectForKey:@"soundsFire"] objectAtIndex:0];
        SoundEffect *effect = [[SoundEffect alloc] initWithName:[@"Weapon." stringByAppendingString:soundName] looping:YES];
        [soundsFire addObject:effect];
        [effect cacheWithName:[NSString stringWithFormat:@"%@-%i-%@", effect.effectName, shipId, [aHardpointPos description]]];
        [effect release];
    } else {
        for (NSString *soundName in [weaponTemplate objectForKey:@"soundsFire"]) {
            SoundEffect *effect = [[SoundEffect alloc] initWithName:[@"Weapon." stringByAppendingString:soundName] looping:NO];
            [soundsFire addObject:effect];
            [effect cacheWithName:[NSString stringWithFormat:@"%@-%i-%@", effect.effectName, shipId, [aHardpointPos description]]];
            [effect release];
        }        
    }
    
    hardpointPos = [[Vector alloc] init];
    [hardpointPos setValuesToVector:aHardpointPos];
    
    return self;
}

- (void)dealloc {
    [name release];
    [iconName release];
    [description release];
    
    [weaponTemplate release];
    [hardpointPos release];
    [posOffset release];
//    [model release];
//    [texture release];
    [soundsFire makeObjectsPerformSelector:@selector(stop)];
    [soundsFire release];
    [projectileImage release];
    [super dealloc];
}

- (void)updateWithPos:(Vector *)weaponPos angle:(GLfloat)weaponAngle bankAngle:(GLfloat)bankAngle {
    if (coolDownCounter > 0) coolDownCounter--;
    parentAngle = weaponAngle;
    [pos setValuesToVector:weaponPos];
}

- (BOOL)fire:(Vector *)baseVelocity alreadyPlayedSound:(BOOL)alreadyPlayedSound {
    if (coolDownCounter <= 0) {
        // Reset Cooldown
        coolDownCounter = coolDown;
        
		// incorporate hardpoint offset
		[posOffset setValuesToVector:hardpointPos];
		//[posOffset rotateOnY:-bankAngle];
		[posOffset rotateOnZ:parentAngle];
		[pos add:posOffset];
		
		// Move sound
		if (fireSoundLoops && [[soundsFire objectAtIndex:0] playing])
			[(SoundEffect*)[soundsFire objectAtIndex:0] setPosition:pos];
		
        // Play random fire sound
        SoundEffect *firstSound = [soundsFire objectAtIndex:0];
        if (fireSoundLoops) {
            if (![firstSound playing]) {
                [firstSound play];
            }
        } else {
            if ([soundsFire count] > 0) {
                SoundEffect *sound = [soundsFire objectAtIndex:rand() % [soundsFire count]];
                [sound setPosition:pos];
                [sound play];
            }            
        }
        
        GLfloat adjustedAngle = parentAngle;
        
        // find a target in the arc
        if (targetingArc > 0.0) {
            Vector *distanceToTarget = [Vector temp:nil];
            GLfloat closest = 1000.0;
            
            NSArray *targetArray;
            if (shipId == [Game sharedGame].ship.identifier) {
                targetArray = [Game sharedGame].enemies;
            } else {
                targetArray = [NSArray arrayWithObject:[Game sharedGame].ship];
            }
            
            for (Ship *ship in targetArray) {
                if (isBeam) {
                    [distanceToTarget setValuesToVector:ship.pos];
                    [distanceToTarget subtract:pos];
                } else {
                    [distanceToTarget setValuesToVector:baseVelocity];
                    [distanceToTarget scale:-[ship.pos distance2D:pos] / speed];
                    [distanceToTarget add:ship.pos];
                    [distanceToTarget subtract:pos];
                }
                
                GLfloat angleDifference = parentAngle - [distanceToTarget angle2D];
                while (angleDifference >    180.0) angleDifference -= 360.0;
                while (angleDifference < -180.0) angleDifference += 360.0;
                
                if (fabs(angleDifference) < targetingArc/2.0 && [distanceToTarget length] < closest) {
                    closest = [distanceToTarget length];
                    adjustedAngle = [distanceToTarget angle2D];
                    angle = adjustedAngle - parentAngle;
                }
            }
        }
        
        // Adjust angle by the weapons spread
        adjustedAngle += ((GLfloat)rand() / RAND_MAX * spread) - spread/2;
        
        if (isBeam) {
            // Create beam
            Beam *beam = [[[Beam alloc] initWithTemplate:weaponTemplate
                                                                     belongingToShip:shipId
                                                                                    position:pos
                                                                                    velocity:baseVelocity
                                                                                         angle:adjustedAngle] autorelease];
            [[Game sharedGame].beams addObject:beam];
            
        } else {
            // Create projectile
            Vector *projVel = [Vector temp:nil];
            projVel.x = -sin(adjustedAngle*M_PI/180);
            projVel.y = cos(adjustedAngle*M_PI/180);
            projVel.z = 0;
            [projVel scale:speed];
            [projVel add:baseVelocity];
            
            Projectile *projectile = [[[Projectile alloc] initWithTemplate:weaponTemplate 
                                                                                                         belongingToShip:shipId
                                                                                                                        position:pos
                                                                                                                        velocity:projVel
                                                                                                                             angle:projectileIsDirectional ? adjustedAngle : rand() % 360] autorelease];
            [[Game sharedGame].projectiles addObject:projectile];
        }

        return YES;
    } else {
        return NO;
    }
}

- (void)stopFiringSound {
    if (fireSoundLoops) [[soundsFire objectAtIndex:0] stop];
}

- (void)stopFiringSoundAndDecay {
    if (fireSoundLoops) [[soundsFire objectAtIndex:0] stopAndDecay];
}

- (void)render {
    // Position
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    glTranslatef(pos.x, pos.y, pos.z);
    glRotatef(parentAngle + angle, 0.0f, 0.0f, 1.0f);
    glScalef(size, size, size);
    
    // Setup material
    GLfloat matAmbient[] = { 0.3, 0.3, 0.3, 1.0 };
    GLfloat matDiffuse[] = { 1.0, 1.0, 1.0, 1.0 };
    glMaterialfv(GL_FRONT_AND_BACK, GL_AMBIENT, matAmbient);
    glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, matDiffuse);
    
    // Renering flags
    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0);
    
    // Render
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    [texture enable];
    [model render];
    [texture disable];
    
    // Turn off lighting
    glDisable(GL_LIGHTING);
    glDisable(GL_LIGHT0);
}

/* Data Methods */

- (GLfloat)range {
    if (isBeam) {
        return beamRange;
    } else {
        float a = [[weaponTemplate objectForKey:@"accel"] floatValue];
        return lifetime*speed + a*lifetime*lifetime/2;
    }
    
    return 0;
}

- (GLfloat)fireRate {
    return 40.0 / coolDown;
}

@end
