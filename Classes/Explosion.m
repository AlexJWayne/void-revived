//
//  Explosion.m
//  Void
//
//  Created for VOID on 9/25/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Explosion.h"
#import "Particle.h"

@implementation Explosion

@synthesize expired;

- (id)initWithPosition:(Vector *)position velocity:(Vector *)velocity size:(GLfloat)aSize imageName:(NSString *)imageName animationFrames:(int)animFrames duration:(int)aDuration {
  [super init];
  
  [pos setValuesToVector:position];
  if (velocity) [vel setValuesToVector:velocity];
  texture = [[Texture textureNamed:imageName] retain];
  lifetime = aDuration;
  size = aSize;
  angle = (GLfloat)(rand() % 360);
  animationFrames = animFrames;
	
	if (size >= 1.0) {
		int particleQty = round(size*15.0);
		particles = [[NSMutableArray alloc] initWithCapacity:particleQty];
		for (int i = 0; i < particleQty; i++) {
			Particle *particle = [[Particle alloc] initWithPos:pos lifetime:lifetime maxSpeed:size/7.0];
			[particle.vel add:velocity];
			[particles addObject:particle];
			[particle release];
		}
	}
  
  return self;
}

- (void)dealloc {
  [texture release];
  [sound release];
	[particles release];
  [super dealloc];
}

- (void)update {
  [super update];
  [sound setPosition:pos];
  lifeElapsed++;
  if (lifeElapsed >= lifetime) expired = YES;
	
	[particles makeObjectsPerformSelector:@selector(update)];
}

- (void)render {
	[Particle renderParticles:particles];
	
  GLfloat vertices[] = {
     0.5, 0.5,
    -0.5, 0.5,
     0.5,-0.5,
    -0.5,-0.5,
  };
  
  GLfloat progress = (GLfloat)lifeElapsed / (GLfloat)lifetime;
  GLuint textureFrame1Id = (int)(progress * animationFrames);
  GLuint textureFrame2Id = textureFrame1Id + 1;
  GLuint imagesAccross = sqrt(animationFrames);
  
  // Generate texture coords
  GLfloat span = 1.0 / (GLfloat)imagesAccross;
  
  GLfloat tex1X = (GLfloat)(textureFrame1Id % imagesAccross) / imagesAccross;
  GLfloat tex1Y = (GLfloat)(textureFrame1Id / imagesAccross) / imagesAccross;
  GLfloat textureCoords1[] = {
    tex1X       , tex1Y + span,
    tex1X + span, tex1Y + span,
    tex1X       , tex1Y,
    tex1X + span, tex1Y,
  };
  
  GLfloat tex2X = (GLfloat)(textureFrame2Id % imagesAccross) / imagesAccross;
  GLfloat tex2Y = (GLfloat)(textureFrame2Id / imagesAccross) / imagesAccross;
  GLfloat textureCoords2[] = {
    tex2X       , tex2Y + span,
    tex2X + span, tex2Y + span,
    tex2X       , tex2Y,
    tex2X + span, tex2Y,
  };
  
  // Explosion grows as it ages
  GLfloat currentSize = size + 2*size * (1 - (pow(1 - progress, 2)));
  
  // Explosion fades between 2 frames
  GLfloat alpha = progress*animationFrames;
  while (alpha >= 1.0) alpha--;
  
  // Position
  glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
  glTranslatef(pos.x, pos.y, pos.z);
  glRotatef(angle, 0.0, 0.0, 1.0);
  glScalef(currentSize, currentSize, currentSize);
  
  
  GLfloat alpha1 = -(pow(alpha, 2)) + 1.0;
  GLfloat alpha2 = -(pow(alpha-1.0, 2)) + 1.0;
  
  // -- Render first frame
  [texture enable];
  
  // Load vertices
  glVertexPointer(2, GL_FLOAT, 0, vertices);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load texture coordinates
  glTexCoordPointer(2, GL_FLOAT, 0, textureCoords1);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Fade
  glDisableClientState(GL_COLOR_ARRAY);
  glColor4f(1.0, 1.0, 1.0, alpha1);
  
  // Render
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  
  
  // -- Render next frame
  if (textureFrame2Id <= 15) {
    // Load texture coordinates
    glTexCoordPointer(2, GL_FLOAT, 0, textureCoords2);
    glEnableClientState(GL_TEXTURE_COORD_ARRAY);
    
    // Fade
    glDisableClientState(GL_COLOR_ARRAY);
    glColor4f(1.0, 1.0, 1.0, alpha2);
    
    // Render
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    
    // Cleanup
    [texture disable];
  }
}

- (void)playSound:(NSString *)soundName {
  sound = [[SoundEffect effectNamed:soundName looping:NO] retain];
  [sound setPosition:pos];
  [sound play];
}

@end
