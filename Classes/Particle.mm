//
//  Particle.mm
//  Void
//
//  Created for VOID on 8/5/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "Particle.h"
#import "Game.h"

@implementation Particle

@synthesize lifetime, lifetimeElapsed, damping, size, colorR, colorG, colorB;

+ (void)renderParticles:(NSArray*)particles {
	GLint total = [particles count];
	GLint count = 0;
    CGFloat scaleFactor = [Game sharedGame].screenScaleFactor;
	
	GLfloat verts[total * 3];
    GLfloat sizes[total];
    GLfloat colors[total * 4];
	
	for (Particle *particle in particles) {
		verts[count*3]      = particle.pos.x;
		verts[count*3 + 1]  = particle.pos.y;
		verts[count*3 + 2]  = particle.pos.z;
		
		sizes[count]        = particle.size * scaleFactor;
		
		colors[count*4]     = particle.colorR;
		colors[count*4 + 1] = particle.colorG;
		colors[count*4 + 2] = particle.colorB;
		colors[count*4 + 3] = particle.alpha;
		
		count++;
	}
	
	// Reset
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
	
	// Load vertices
	glVertexPointer(3, GL_FLOAT, 0, verts);
    glEnableClientState(GL_VERTEX_ARRAY);
	
	// Load colors
	glColorPointer(4, GL_FLOAT, 0, colors);
    glEnableClientState(GL_COLOR_ARRAY);
	
	// Point sizes
	glPointSizePointerOES(GL_FLOAT, 0, sizes);
    glEnableClientState(GL_POINT_SIZE_ARRAY_OES);
	
	// Set alpha blend mode
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
	
	// Render
	glDrawArrays(GL_POINTS, 0, total);
	
	// Cleanup
	glDisableClientState(GL_COLOR_ARRAY);
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_POINT_SIZE_ARRAY_OES);
    glColor4ub(255, 255, 255, 255);
}

- (id)initWithPos:(Vector*)aPos lifetime:(GLuint)aLifetime maxSpeed:(GLfloat)maxSpeed {
	[super init];
	[self resetWithPos:aPos lifetime:aLifetime maxSpeed:maxSpeed];
	return self;
}

- (void)resetWithPos:(Vector*)aPos lifetime:(GLuint)aLifetime maxSpeed:(GLfloat)maxSpeed {
	[pos setValuesToVector:aPos];
	lifetime = aLifetime - (GLfloat)rand()/(GLfloat)RAND_MAX * aLifetime*0.6;
	lifetimeElapsed = 0;
	
	size = (GLfloat)(rand() % 4 + 1.5);
	damping = (GLfloat)rand()/(GLfloat)RAND_MAX * 0.06 + 0.94;
	
	colorR = (GLfloat)rand()/(GLfloat)RAND_MAX * 0.3 + 0.7;
	colorG = (GLfloat)rand()/(GLfloat)RAND_MAX * 0.4 + 0.6;
	colorB = (GLfloat)rand()/(GLfloat)RAND_MAX * 0.6 + 0.4;
	
	vel.z = (GLfloat)rand()/(GLfloat)RAND_MAX * maxSpeed;
	[vel rotateOnY:(GLfloat)rand()/(GLfloat)RAND_MAX * 360.0];
	[vel rotateOnZ:(GLfloat)rand()/(GLfloat)RAND_MAX * 360.0];
}

- (void)update {
	[super update];
	lifetimeElapsed++;
}

- (void)updateVel {
	[vel scale:damping];
	[super updateVel];
}

- (GLfloat)alpha {
	GLfloat alpha = 1.0 - (GLfloat)lifetimeElapsed/(GLfloat)lifetime;
	if (alpha < 0.0) alpha = 0.0;
	return alpha*0.75;
}

- (void)render {
	//... Handled by [Particle renderParticles:particlesArray]
}

@end
