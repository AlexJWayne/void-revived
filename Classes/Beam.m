//
//    Beam.m
//    Void
//
//    Created for VOID on 10/23/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Beam.h"

#include "Game.h"
@class Game;

@implementation Beam

@synthesize expired;

- (id)initWithTemplate:(NSDictionary *)aTemplate belongingToShip:(int)aShipId position:(Vector *)position velocity:(Vector *)velocity angle:(GLfloat)anAngle {
    [super init];
    
    shipId = aShipId;
    [pos setValuesToVector:position];
    [vel setValuesToVector:velocity];
    angle = anAngle;
    
    width = [[aTemplate objectForKey:@"projectileSize"] floatValue];
    length = [[aTemplate objectForKey:@"beamRange"] floatValue];
    maxRange = length;
    collisionWidth = [[aTemplate objectForKey:@"projectileCollisionSize"] floatValue];
    lifetime = [[aTemplate objectForKey:@"lifetime"] intValue];
    texture = [[Texture textureNamed:@"Projectiles.png"] retain];
    
    shieldDmg = [[aTemplate objectForKey:@"shieldDmg"] floatValue];
    armorDmg    = [[aTemplate objectForKey:@"armorDmg"] floatValue];
    forceHit    = [[aTemplate objectForKey:@"forceHit"] floatValue];
    
    // Set texture coords of large spritemap
    NSArray *numbers = [[aTemplate objectForKey:@"projectileImage"] componentsSeparatedByString:@","];
    spriteMapLocation = CGPointMake([[numbers objectAtIndex:0] floatValue]/4.0, [[numbers objectAtIndex:1] floatValue]/4.0);
    
    // Sounds
    NSArray *hitSounds = [aTemplate objectForKey:@"soundsHit"];
    if ([hitSounds count] > 0) {
        NSString *hitSoundName = [hitSounds objectAtIndex:rand() % [hitSounds count]];
        hitSound = [[SoundEffect effectNamed:[@"Weapon." stringByAppendingString:hitSoundName] looping:NO] retain];
    }
    
    [self checkCollision];
    
    return self;
}

- (void)dealloc {
    [hitSound release];
    [super dealloc];
}

- (void)checkCollision {
    Vector *circleCenter = [[[Vector alloc] init] autorelease];
    Vector *nearestPoint = [[[Vector alloc] init] autorelease];
    
    GLfloat nearestTargetDistance = 1000.0;
    Ship *nearestTarget = nil;
    
    // Do collision detection
    Game *game = [Game sharedGame];
    NSMutableArray *targets = [NSMutableArray array];
    if (shipId == game.ship.identifier) {
        [targets addObjectsFromArray:game.enemies];
    } else {
        [targets addObject:game.ship];
    }
    
    for (Ship *target in targets) {
        if (shipId != target.identifier && target.currentArmor > 0.0 && [pos distance2D:target.pos] < target.size + length) {
            // Potential hit
            
            [circleCenter setValuesToVector:target.pos];
            [circleCenter subtract:pos];
            [circleCenter rotateOnZ:-angle];
            
            nearestPoint.x = circleCenter.x;
            if (nearestPoint.x < -collisionWidth/2) nearestPoint.x = -collisionWidth/2;
            if (nearestPoint.x >    collisionWidth/2) nearestPoint.x =    collisionWidth/2;
            
            nearestPoint.y = circleCenter.y;
            if (nearestPoint.y < 0.0) nearestPoint.y = 0.0;
            if (nearestPoint.y > length) nearestPoint.y =    length;
            
            if ([circleCenter distance2D:nearestPoint] < target.size && [pos distance2D:target.pos] - target.size < nearestTargetDistance) {
                nearestTargetDistance = [pos distance2D:target.pos] - target.size;
                nearestTarget = target;
            }
        }
    }
    
    // Affect only nearest target
    if (nearestTarget) {
        // Damage target
        [nearestTarget damageShields:shieldDmg armor:armorDmg];
        
        // Adjust beam rendering length to stop at target
        length = [pos distance2D:nearestTarget.pos] - nearestTarget.size/2;
        
        // Play hit sound
        [hitSound setPosition:nearestTarget.pos];
        [hitSound play];
        
        // Hit knockback
        Vector *knockback = [Vector temp:nil];
        knockback.y = forceHit;
        [knockback rotateOnZ:angle];
        [knockback scale:forceHit/nearestTarget.mass];
        [nearestTarget.vel add:knockback];
        
        // Create hit graphic
        Vector *endPoint = [Vector temp:nil];
        endPoint.y = length;
        [endPoint rotateOnZ:angle];
        [endPoint add:pos];
        Explosion *exp = [[[Explosion alloc] initWithPosition:endPoint
                                                     velocity:nil
                                                         size:width / 2
                                                    imageName:@"Hit.png"
                                              animationFrames:4
                                                     duration:15] autorelease];
        [[Game sharedGame].explosions addObject:exp];
    }
}

- (void)update {
    [super update];
    if (lifeElapsed >= lifetime) expired = YES;
    lifeElapsed++;
}

- (void)render {
    GLfloat alpha = 1.0 - (float)lifeElapsed/(float)lifetime;
    GLfloat renderedWidth = width + width * 0.8 * (1.0 - alpha);
    
    GLfloat vertices[] = {
         0.5, 1.0,
        -0.5, 1.0,
         0.5, 0.0,
        -0.5, 0.0,
    };
    
    
    GLfloat textureCoords[] = {
        spriteMapLocation.x,        spriteMapLocation.y + 0.25 - 0.25 * (length/maxRange),
        spriteMapLocation.x + 0.25, spriteMapLocation.y + 0.25 - 0.25 * (length/maxRange),
        spriteMapLocation.x,        spriteMapLocation.y + 0.25,
        spriteMapLocation.x + 0.25, spriteMapLocation.y + 0.25,
    };
    
    
    // Position
    glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
    glTranslatef(pos.x, pos.y, pos.z);
    glRotatef(angle, 0.0, 0.0, 1.0);
    glScalef(renderedWidth, length, 1.0);
    
    
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
    [texture enable];
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    [texture disable];
}


@end
