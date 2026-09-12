//
//    Radar.m
//    Void
//
//    Created for VOID on 9/19/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Radar.h"
#import "Game.h"
@class Game;

#define RADAR_RANGE 32.0

@implementation Radar

- (id)initInRect:(CGRect)aFrame texFrame:(CGRect)aTexFrame {
    [super initInRect:aFrame texFrame:aTexFrame];
    shipPos    = [[Vector alloc] init];
    blipOffset = [[Vector alloc] init];
    bench      = [[Bench alloc] initWithName:@"- - InnerRadarRender" reportLimit:600*11];
    return self;
}

- (void)update {
    [shipPos setValuesToVector:[Game sharedGame].ship.pos];
}

- (void)transformPositionToRadar:(Vector*)pos {
	[pos subtract:shipPos];
	[pos scale:0.5];
	[pos limit:RADAR_RANGE];
}

- (void)render {
    Game *game = [Game sharedGame];
    CGFloat scaleFactor = game.screenScaleFactor;
    
    [super render];
    glDisable(GL_TEXTURE_2D);
    
    GLint count = 0;
    
    // Position origin in center of radar
    [Button loadIdentity];
    glTranslatef(40.5, 40.5, 0.0);
    glScalef(1.0, -1.0, 0.0);
    
    // Rotate by the camera angle
    glRotatef(-game.angle, 0.0, 0.0, 1.0);
    
    // Setup geometry arrays
    GLint totalBlips = [game.planets count] + [game.enemies count] + [game.pickups count] + 1;
    
    GLfloat verts[totalBlips * 2];
    GLfloat sizes[totalBlips];
    GLubyte colors[totalBlips * 4];
    
    Vector *tempPos = nil;
    
    // Planets
    for (Planet *planet in game.planets) {
        // Position
        tempPos = [Vector temp:planet.pos];
		[self transformPositionToRadar:tempPos];
        
        verts[count*2]     = tempPos.x;
        verts[count*2 + 1] = tempPos.y;
        
        // Size
        if (planet.gravity > 0)
            sizes[count] = planet.size / 2 * scaleFactor;
        else
            sizes[count] = planet.size / 4 * scaleFactor;
        
        // Color
        colors[count*4]     = 64;
        colors[count*4 + 1] = 64;
        colors[count*4 + 2] = 64;
        colors[count*4 + 3] = 255;
        
        count++;
    }
    
    // Pickups
    for (Pickup *pickup in game.pickups) {
        // Position
        tempPos = [Vector temp:pickup.pos];        
        [self transformPositionToRadar:tempPos];
        
        verts[count*2]     = tempPos.x;
        verts[count*2 + 1] = tempPos.y;
        
        // Size
        sizes[count]                = 1.0 * scaleFactor;
        
        // Color
        if ([pickup.type isEqualToString:@"Money"]) {
            colors[count*4]     = 0;
            colors[count*4 + 1] = 192;
            colors[count*4 + 2] = 0;
            
        } else if ([pickup.type isEqualToString:@"Weapon"]) {
            colors[count*4]     = 192;
            colors[count*4 + 1] = 96;
            colors[count*4 + 2] = 0;
            
        } else if ([pickup.type isEqualToString:@"Equipment"]) {
            colors[count*4]     = 192;
            colors[count*4 + 1] = 192;
            colors[count*4 + 2] = 0;
        }
        colors[count*4 + 3] = 255;
        
        count++;
    }
    
    // Enemies
    for (Enemy *enemy in game.enemies) {
        
        // Position
        tempPos = [Vector temp:enemy.pos];
        [self transformPositionToRadar:tempPos];
        
        verts[count*2]     = tempPos.x;
        verts[count*2 + 1] = tempPos.y;
        
        // Size
        sizes[count] = 2.0 * scaleFactor;
        
        // Color
        if (enemy.optional) {
            colors[count*4]     = 192;
            colors[count*4 + 1] = 192;
            colors[count*4 + 2] = 96;
        } else {
            colors[count*4]     = 255;
            colors[count*4 + 1] = 0;
            colors[count*4 + 2] = 0;
        }
        colors[count*4 + 3] = 255;
        
        count++;
    }
    
    
    // Hypergate
    {        
        // Position
        tempPos = [Vector temp:game.hypergate.pos];
        [self transformPositionToRadar:tempPos];
        
        verts[count*2]     = tempPos.x;
        verts[count*2 + 1] = tempPos.y;
        
        // Size
        sizes[count] = 3.0 * scaleFactor;
        
        // Color
        if ([game canBeCompleted]) {
            colors[count*4]     = 255;
            colors[count*4 + 1] = 0;
            colors[count*4 + 2] = 255;
        } else {
            colors[count*4]     = 127;
            colors[count*4 + 1] = 0;
            colors[count*4 + 2] = 127;
        }
        colors[count*4 + 3] = 255;
        
        //count++;
    }
    
    glVertexPointer(2, GL_FLOAT, 0, verts);
    glEnableClientState(GL_VERTEX_ARRAY);
    
    glColorPointer(4, GL_UNSIGNED_BYTE, 0, colors);
    glEnableClientState(GL_COLOR_ARRAY);
    
    glPointSizePointerOES(GL_FLOAT, 0, sizes);
    glEnableClientState(GL_POINT_SIZE_ARRAY_OES);
    
    glDrawArrays(GL_POINTS, 0, totalBlips);
    
    // Cleanup
    glDisableClientState(GL_COLOR_ARRAY);
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_POINT_SIZE_ARRAY_OES);
    glColor4ub(255, 255, 255, 255);
}

- (void)dealloc {
    [shipPos release];
    [blipOffset release];
    [super dealloc];
}

@end
