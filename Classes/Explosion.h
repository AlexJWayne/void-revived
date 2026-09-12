//
//  Explosion.h
//  Void
//
//  Created for VOID on 9/25/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Texture.h"
#import "SoundEffect.h"

@interface Explosion : SpaceObject {
  Texture *texture;
  int lifetime;
  int lifeElapsed;
  GLfloat size;
  BOOL expired;
  int animationFrames;
  SoundEffect *sound;
	
	NSMutableArray *particles;
}

@property (readonly) BOOL expired;

- (id)initWithPosition:(Vector *)position velocity:(Vector *)velocity size:(GLfloat)aSize imageName:(NSString *)imageName animationFrames:(int)animFrames duration:(int)aDuration;

- (void)playSound:(NSString *)soundName;

@end
