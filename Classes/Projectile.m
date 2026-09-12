//
//    Projectile.m
//    Void
//
//    Created for VOID on 9/20/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Projectile.h"

#include "Game.h"
#include "Ship.h"
@class Game;
@class Ship;

@implementation Projectile

@synthesize potentialTargets, size, lifetime, expired, shipId, shieldDmg, armorDmg, forceHit, collisionSize, explosionSize;

- (id)initWithTemplate:(NSDictionary *)aTemplate belongingToShip:(int)aShipId position:(Vector *)position velocity:(Vector *)velocity angle:(GLfloat)anAngle {
	[super init];
	templateDictionary = [aTemplate retain];
    
    shipId = aShipId;
    shieldDmg = [[templateDictionary objectForKey:@"shieldDmg"] floatValue];
    armorDmg  = [[templateDictionary objectForKey:@"armorDmg"] floatValue];
    forceHit  = [[templateDictionary objectForKey:@"forceHit"] floatValue];
    lifetime  = [[templateDictionary objectForKey:@"lifetime"] intValue];
    
    spriteTexture = [[Texture textureNamed:@"Projectiles.png"] retain];
    size          = [[templateDictionary objectForKey:@"projectileSize"] floatValue];
    collisionSize = [[templateDictionary objectForKey:@"projectileCollisionSize"] floatValue];
    explosionSize = [[templateDictionary objectForKey:@"explosionSize"] floatValue];
    
    seekLockAngle = [[templateDictionary objectForKey:@"seekLockAngle"] floatValue];
    seekTurnSpeed = [[templateDictionary objectForKey:@"seekTurnSpeed"] floatValue];
    
    hitSpriteName = [[templateDictionary objectForKey:@"hitSprite"] retain];
    if (hitSpriteName == nil) hitSpriteName = explosionSize > 0 ? @"Explosion.png" : @"Hit.png";
    
    [pos setValuesToVector:position];
    [vel setValuesToVector:velocity];
    angle = anAngle;
    
    accel.y = [[aTemplate objectForKey:@"accel"] floatValue];
    [accel rotateOnZ:angle];
    
    // Set texture coords of large spritemap
    NSArray *numbers = [[aTemplate objectForKey:@"projectileImage"] componentsSeparatedByString:@","];
    spriteMapLocation = CGPointMake([[numbers objectAtIndex:0] floatValue]/4.0, [[numbers objectAtIndex:1] floatValue]/4.0);
    
    // Sounds
    soundsHit = [[NSMutableArray alloc] init];
    for (NSString *soundName in [aTemplate objectForKey:@"soundsHit"]) {
        [soundsHit addObject:[SoundEffect effectNamed:[@"Weapon." stringByAppendingString:soundName] looping:NO]];
    }
    
    // create a list of ships to check collision against
    potentialTargets = [[NSMutableArray alloc] init];
    
    if (shipId == [Game sharedGame].ship.identifier) {
        GLfloat potentialDistance = [vel length]*lifetime + [[Game sharedGame].ship.vel length]*lifetime + [accel length]*lifetime*lifetime + collisionSize;
        for (Ship *ship in [Game sharedGame].enemies) {
            if (ship.identifier != shipId) {
                if ([ship.pos distance2D:pos] < (potentialDistance + ship.maxSpeed*lifetime + ship.size)) {
                    [potentialTargets addObject:ship];
                }
            }
        }
        
    } else {
        [potentialTargets addObject:[Game sharedGame].ship];
    }
    
    distanceToTarget = [[Vector alloc] init];
    [self findATarget];
    
    return self;
}

- (id)initWithCoder:(NSCoder*)coder {
	[self initWithTemplate:[coder decodeObjectForKey:@"templateDictionary"]
                     belongingToShip:[coder decodeIntForKey:@"shipId"]
                                    position:[coder decodeObjectForKey:@"pos"]
                                    velocity:[coder decodeObjectForKey:@"vel"]
                                         angle:[coder decodeFloatForKey:@"angle"]];
	[accel setValuesToVector:[coder decodeObjectForKey:@"accel"]];
	
	lifeElapsed = [coder decodeIntForKey:@"lifeElapsed"];
	
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[super encodeWithCoder:coder];
	[coder encodeObject:templateDictionary forKey:@"templateDictionary"];
	[coder encodeInt:shipId forKey:@"shipId"];
	[coder encodeInt:lifeElapsed forKey:@"lifeElapsed"];
}

- (void)findATarget {
    // Find a target to seek
    if (seekLockAngle > 0.0) {
        GLfloat foundTargetPriority = 1000.0;
        
        for (Ship *ship in potentialTargets) {
            [distanceToTarget setValuesToVector:ship.pos];
            [distanceToTarget subtract:pos];
            GLfloat angleDifference = [Utility angleDifference:[vel angle2D] to:[distanceToTarget angle2D]];
            
            GLfloat distance = [pos distance2D:ship.pos];
            GLfloat anglePriority = fabs(angleDifference) / 180.0;
            GLfloat shipPriority = distance * pow(1.0 + anglePriority, 4);
            
            if (fabs(angleDifference) <= seekLockAngle / 2 && shipPriority < foundTargetPriority) {
                if (seekTarget) [seekTarget release];
                seekTarget = [ship retain];
                foundTargetPriority = shipPriority;
            }
        }
    }
}

- (void)playHitSound {
    if ([soundsHit count] == 0) return;
    SoundEffect *sound = [soundsHit objectAtIndex:rand() % [soundsHit count]];
    [sound setPosition:pos];
    [sound play];
}

- (void)explode {
    [self playHitSound];
    
    // Damage with an explosion
    for (Ship *aShip in [Game sharedGame].targets) {
        if (aShip.identifier != shipId && [aShip.pos distance2D:pos] < explosionSize + aShip.size) {
            // ship within explosion radius
            
            // Damage target
            [aShip damageShields:shieldDmg armor:armorDmg];
            
            // Knockback from explosion center
            Vector *knockback = [Vector temp:aShip.pos];
            [knockback setValuesToVector:aShip.pos];
            [knockback subtract:pos];
            knockback.z = 0.0;
            GLfloat knockbackPortion = 1.0 - ([knockback length] / (explosionSize + aShip.size));
            [knockback normalize];
            [knockback scale:forceHit * knockbackPortion];
            [aShip.vel add:knockback];
        }
    }
    
    // Create explosion graphic
    Explosion *exp = [[Explosion alloc] initWithPosition:pos
                                                                                            velocity:nil
                                                                                                    size:explosionSize * 1.5
                                                                                         imageName:hitSpriteName
                                                                             animationFrames:16
                                                                                            duration:60];
    [[Game sharedGame].explosions addObject:exp];
    [exp release];
}

- (void)update {
    lifeElapsed++;
    if (lifeElapsed >= lifetime) {
        expired = YES;
        if (explosionSize > 0) {
            [self explode];
        }
        return;
    }
    if (seekTarget != nil && seekTarget.currentArmor <= 0) {
        [potentialTargets removeObject:seekTarget];
        [seekTarget release];
        seekTarget = nil;
        [self findATarget];
    }
    
    
    [super update];
    
    
    // Pursue the chosen target, if there is one.
    if (seekTarget) {
        [distanceToTarget setValuesToVector:seekTarget.pos];
        [distanceToTarget subtract:pos];
        
        // Find teh angle difference to the target.
        GLfloat angleDifference = [vel angle2D] - [distanceToTarget angle2D];
        while (angleDifference >    180.0) angleDifference -= 360.0;
        while (angleDifference < -180.0) angleDifference += 360.0;
        
        // Turn towards the target.
        if (fabs(angleDifference) < seekTurnSpeed) {
            angle -= angleDifference;
            [vel rotateOnZ:-angleDifference];
            [accel rotateOnZ:-angleDifference];
            
        } else if (angleDifference > 0) {
            angle -= seekTurnSpeed;
            [vel rotateOnZ:-seekTurnSpeed];
            [accel rotateOnZ:-seekTurnSpeed];
                
        } else {
            angle += seekTurnSpeed;
            [vel rotateOnZ:seekTurnSpeed];
            [accel rotateOnZ:seekTurnSpeed];
        }
        
        // Little vel damping on missiles to improve accuracy.
        if (accel > 0) {
            [vel scale:1.0 - 0.02];
        }
    }
}

- (void)render {
    GLfloat alphaThreshold = 0.5;
    GLfloat completion = (float)lifeElapsed/(float)lifetime;
    
    GLfloat alpha;
    if (explosionSize == 0.0 && completion > alphaThreshold) {
        alpha = 1 - (completion - alphaThreshold) / (1 - alphaThreshold);
    } else {
        alpha = 1.0;
    }
    
    GLfloat vertices[] = {
         0.5, 0.5,
        -0.5, 0.5,
         0.5,-0.5,
        -0.5,-0.5,
    };
    
    GLfloat textureCoords[] = {
        spriteMapLocation.x,                spriteMapLocation.y,
        spriteMapLocation.x + 0.25, spriteMapLocation.y,
        spriteMapLocation.x,                spriteMapLocation.y + 0.25,
        spriteMapLocation.x + 0.25, spriteMapLocation.y + 0.25,
    };
    
    // Position
    glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
    glTranslatef(pos.x, pos.y, pos.z);
    glRotatef(angle, 0.0, 0.0, 1.0);
    glScalef(size, size, 1.0);
    
    
    // Load vertices
    glVertexPointer(2, GL_FLOAT, 0, vertices);
    glEnableClientState(GL_VERTEX_ARRAY);
    
    // Load texture coordinates
    glTexCoordPointer(2, GL_FLOAT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
    
    // Vertices should be white
    glDisableClientState(GL_COLOR_ARRAY);
    glColor4f(1.0, 1.0, 1.0, alpha);    
    
    // Render
    [spriteTexture enable];
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    [spriteTexture disable];
    
}

- (void)dealloc {
	[templateDictionary release];
    if (seekTarget) [seekTarget release];
    if (distanceToTarget) [distanceToTarget release];
    [potentialTargets release];
    [spriteTexture release];
    [soundsHit release];
    [hitSpriteName release];
    
    [super dealloc];
}


@end
