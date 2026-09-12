//
//  Particle.h
//  Void
//
//  Created for VOID on 8/5/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SpaceObject.h"
#import "Vector.h"

@interface Particle : SpaceObject {
	GLuint lifetime;
	GLuint lifetimeElapsed;
	
	GLfloat damping;
	
	GLfloat size;
	GLfloat colorR;
	GLfloat colorG;
	GLfloat colorB;
}

@property (assign, nonatomic) GLuint lifetime;
@property (assign, nonatomic) GLuint lifetimeElapsed;
@property (assign, nonatomic) GLfloat damping;
@property (assign, nonatomic) GLfloat size;
@property (assign, nonatomic) GLfloat colorR;
@property (assign, nonatomic) GLfloat colorG;
@property (assign, nonatomic) GLfloat colorB;

@property (readonly) GLfloat alpha;

+ (void)renderParticles:(NSArray*)particles;

- (id)initWithPos:(Vector*)aPos lifetime:(GLuint)aLifetime maxSpeed:(GLfloat)maxSpeed;
- (void)resetWithPos:(Vector*)aPos lifetime:(GLuint)aLifetime maxSpeed:(GLfloat)maxSpeed;

@end
