//
//  Pickup.m
//  Void
//
//  Created for VOID on 9/26/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Pickup.h"
#include "Game.h"

@class Game;

@implementation Pickup

@synthesize expired, type, itemName;

- (void)_commonInitWithType:(NSString*)pickupType itemName:(NSString*)anItemName {
	self.type = pickupType;
	
  texture = [[Texture textureNamed:[NSString stringWithFormat:@"Pickup%@.png", pickupType]] retain];
  sound = [[SoundEffect effectNamed:[NSString stringWithFormat:@"Pickup.%@", pickupType] looping:NO] retain];
  
  angle = (GLfloat)(rand() % 360);
  size = 1.5;
  
  vel.x = ((GLfloat)rand()/RAND_MAX * 2 - 1) * 0.1;
  [vel rotateOnZ:(GLfloat)(rand() % 360)];
  
  if ([type isEqualToString:@"Money"]) {
    creditValue = rand() % 10 + 1;
    size *= (GLfloat)creditValue / 15.0 + 0.5;
    
    float creditScalar = 0;
    switch ([Game sharedGame].stageTier) {
      case 0:
        creditScalar = 0.5;
        break;
      case 1:
        creditScalar = 1.0;
        break;
      case 2:
        creditScalar = 1.25;
        break;
      case 3:
        creditScalar = 2.0;
        break;
      case 4:
        creditScalar = 4.0;
        break;
      case 5:
        creditScalar = 8.0;
        break;
    }
    
    creditValue = ceil((float)creditValue * creditScalar);
    
    NSLog(@"creditValue: %i", creditValue);
    
  } else {
    size *= 2;
    self.itemName = anItemName;
    
    if ([[[[Utility dataFile:@"Equipment"] objectForKey:itemName] objectForKey:@"type"] isEqualToString:@"Trophy"]) {
      size *= 2;
    }
  }
  
  renderSize = size;
  
  pickupAnimationDuration = 10;
  distance2DShip = [[Vector alloc] init];
}

- (id)initWithType:(NSString *)pickupType itemName:(NSString *)anItemName {
  [super init];
	[self	_commonInitWithType:pickupType itemName:anItemName];
  return self;
}

- (id)initWithCoder:(NSCoder*)coder {
	[super initWithCoder:coder];
	[self _commonInitWithType:[coder decodeObjectForKey:@"type"]
									 itemName:[coder decodeObjectForKey:@"itemName"]];
	creditValue = [coder decodeIntForKey:@"creditValue"];
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[super encodeWithCoder:coder];
	[coder encodeObject:type forKey:@"type"];
	[coder encodeObject:itemName forKey:@"itemName"];
	[coder encodeInt:creditValue forKey:@"creditValue"];
}

- (void)dealloc {
  [texture release];
  [distance2DShip release];
  [type release];
  [itemName release];
  [sound release];
  [super dealloc];
}

- (void)update {
  angle += 2;
  
  if (!pickedUp && [pos distance2D:[Game sharedGame].ship.pos] < [Game sharedGame].ship.size + size) {
    pickedUp = YES;
    [sound play];
    if ([type isEqualToString:@"Money"]) {
      [[Game sharedGame] addCredits:creditValue];
    } else {
      [[Game sharedGame] pickupItem:itemName type:type];
    }
    
  } else if (pickedUp) {
    GLfloat progress = (GLfloat)pickupAnimationCounter / (GLfloat)pickupAnimationDuration;
    renderSize = size + size * progress;
    
    [distance2DShip setValuesToVector:pos];
    [distance2DShip subtract:[Game sharedGame].ship.pos];
    [distance2DShip limit:0.1];
    [pos subtract:distance2DShip];
    
    pickupAnimationCounter++;
  } else {
    
    [super update];
  }
  
  if (pickupAnimationCounter >= pickupAnimationDuration) expired = YES;
}

- (void)updateVel {
  [super updateVel];
  [vel scale:0.965];
}

- (void)render {
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
  
  // Position
  glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
  glTranslatef(pos.x, pos.y, pos.z);
  glRotatef(angle, 0.0, 0.0, 1.0);
  glScalef(renderSize, renderSize, renderSize);
  
  // Load vertices
  glVertexPointer(2, GL_FLOAT, 0, vertices);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load texture coordinates
  glTexCoordPointer(2, GL_SHORT, 0, textureCoords);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Vertex colors
  GLfloat progress = (GLfloat)pickupAnimationCounter / (GLfloat)pickupAnimationDuration;
  glDisableClientState(GL_COLOR_ARRAY);
  glColor4f(1.0, 1.0, 1.0, 1.0 - progress);
  
  // Render
  [texture enable];
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  [texture disable];
  
}

@end
