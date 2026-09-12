//
//  Hypergate.m
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Hypergate.h"
#import "Particle.h"
#include "Game.h"

@class Game;

@implementation Hypergate

- (id)initAtPosition:(Vector *)position {
    [super init];

    [pos setValuesToVector:position];

    layer1 = [[Texture textureNamed:@"Hypergate1.png"] retain];
    layer2 = [[Texture textureNamed:@"Hypergate2.png"] retain];

    birthDuration = 3;
    birthProgress = 0;

    particleQty = 100;
    particles = [[NSMutableArray alloc] initWithCapacity:particleQty];
    for (int i = 0; i < particleQty; i++) {
        [particles addObject:[[[Particle alloc] initWithPos:pos lifetime:60 maxSpeed:0.3] autorelease]];
    }


    return self;
}

- (void)dealloc {
    [layer1 release];
    [layer2 release];
    [particles release];
    [super dealloc];
}

- (void)update {
    angle  -= 0.75;
    angle2 += 2.0;

    if (birthProgress <= birthDuration) {
        birthProgress += 1;
    }
	
	for (Particle *particle in particles) {
		[particle update];
		if (particle.lifetimeElapsed > particle.lifetime) {
			[particle resetWithPos:pos lifetime:60 maxSpeed:[[Game sharedGame] canBeCompleted] ? 0.25 : 0.15];
		}
	}
}

- (void)render {
	[Particle renderParticles:particles];
	
    GLfloat vertices[] = {
         0.5, 0.5,
        -0.5, 0.5,
         0.5,-0.5,
        -0.5,-0.5,
    };

    GLshort textureCoords[] = {
        0, 1,
        1, 1,
        0, 0,
        1, 0,
    };
  
    GLfloat baseSize = 6.0;

    // Animation progress
    GLfloat size1;
    GLfloat size2;

    if (birthProgress < birthDuration) {
        GLfloat progress = (float)birthProgress/(float)birthDuration;
        size1 = baseSize * (-pow(progress - 1, 2) + 1);

        if (progress < 0.5) {
            size2 = baseSize * 1.5 * (-pow(2*progress -1, 2) + 1);
        } else {
            size2 = baseSize * (-sin(2*M_PI*progress + M_PI/2)/2 + 1);
        }
    } else {
        size1 = baseSize;
        if ([[Game sharedGame] canBeCompleted]) {
            size2 = baseSize;
        } else {
            size2 = baseSize / 2.0;
        }
    }
  
    // Position
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    glTranslatef(pos.x, pos.y, pos.z);
    glScalef(size1, size1, 1.0);
    glRotatef(angle, 0.0, 0.0, 1.0);

    // Load vertices
    glVertexPointer(2, GL_FLOAT, 0, vertices);
    glEnableClientState(GL_VERTEX_ARRAY);

    // Load texture coordinates
    glTexCoordPointer(2, GL_SHORT, 0, textureCoords);
    glEnableClientState(GL_TEXTURE_COORD_ARRAY);

    // Vertices should be white
    glDisableClientState(GL_COLOR_ARRAY);
    glColor4f(1.0, 1.0, 1.0, 1.0);

    // Render
    [layer1 enable];
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    [layer1 disable];


    // Position
    glLoadIdentity();
    glTranslatef(pos.x, pos.y, pos.z);
    glScalef(size2, size2, 1.0);
    glRotatef(angle, 0.0, 0.0, 1.0);

    [layer2 enableWithSrcFunc:GL_SRC_ALPHA destFunc:GL_ONE];
    glRotatef(angle2, 0.0, 0.0, 1.0);
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    [layer2 disable];  
}

@end
