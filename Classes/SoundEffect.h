//
//  SoundEffect.h
//  Void
//
//  Created for VOID on 10/17/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import "Vector.h"

@interface SoundEffect : NSObject {
  NSString *effectName;
  AVAudioPlayer *player;
  BOOL firedDeallocTimer;
}

@property (readonly) NSString* effectName;
@property (readonly) BOOL playing;

+ (SoundEffect *)effectNamed:(NSString *)aSoundEffectName looping:(BOOL)looping;
+ (void)setListenerPos:(Vector*)pos;
+ (void)resetListenerPos;

+ (void)drainCache;

- (id)initWithName:(NSString *)aSoundEffectName looping:(BOOL)looping;

- (void)play;
- (void)stop;
- (void)stopAndDecay;

- (void)setVolume:(float)volume;
- (void)setPosition:(Vector *)pos;


- (void)cacheWithName:(NSString *)name;

@end
