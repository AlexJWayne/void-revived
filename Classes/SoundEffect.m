//
//    SoundEffect.m
//    Void
//
//    Created for VOID on 10/17/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "SoundEffect.h"

#include "Game.h"
@class Game;

static NSMutableDictionary *effects;
static Vector *listenerPos;

#define SOUND_EFFECT_NEAR_RANGE 8.0
#define SOUND_EFFECT_FAR_RANGE  20.0

@implementation SoundEffect

@synthesize playing, effectName;

+ (void)initialize {
    effects = [[NSMutableDictionary alloc] init];
    listenerPos = [[Vector alloc] init];
}

+ (void)drainCache {
    [effects removeAllObjects];
}

+ (void)setListenerPos:(Vector*)pos {
    [listenerPos setValuesToVector:pos];
}

+ (void)resetListenerPos {
    [listenerPos scale:0];
}


+ (SoundEffect *)effectNamed:(NSString *)aSoundEffectName looping:(BOOL)looping {
    SoundEffect *effect = nil;
    
    if ([effects objectForKey:aSoundEffectName]) {
        effect = [effects objectForKey:aSoundEffectName];
    } else {
        effect = [[[SoundEffect alloc] initWithName:aSoundEffectName looping:looping] autorelease];
        if (effect) {
            [effects setObject:effect forKey:aSoundEffectName];
        }
    }
    
    return effect;
}

- (id)initWithName:(NSString *)aSoundEffectName looping:(BOOL)looping {
    [super init];
    
    effectName = [aSoundEffectName copy];
    
    NSString *audioUrl = [[NSBundle mainBundle] pathForResource:effectName ofType:@"caf"];
    if (audioUrl == nil) {
        [effectName release];
        return nil;
    }
    
//    if (looping) {
//        if ([effectName rangeOfString:@"Thruster."].location != NSNotFound) {
//            NSString *fadeInPath = [[NSBundle mainBundle] pathForResource:[effectName stringByReplacingOccurrencesOfString:@"Thruster." withString:@"Thruster.FadeIn."] ofType:@"caf"];
//            SoundEngine_LoadLoopingEffect([path UTF8String], [fadeInPath UTF8String], NULL, &effectID);
//        }
//    } else {
//        SoundEngine_LoadEffect([path UTF8String], &effectID);
//    }
    
    player = [[AVAudioPlayer alloc] initWithContentsOfURL:[NSURL URLWithString:audioUrl] error:nil];
    player.numberOfLoops = looping ? -1 : 0;
    [player prepareToPlay];
    
    return self;
}

- (void)release {
    if ([self retainCount] == 1 && !firedDeallocTimer) {
        [self stop];
        firedDeallocTimer = YES;
        [NSTimer scheduledTimerWithTimeInterval:0.1 target:self selector:@selector(release) userInfo:nil repeats:NO];
    } else {
        [super release];
    }
}

- (void)dealloc {
    [self stop];
    NSLog(@"dealloc Sound: %@", effectName);
    [player stop];
    [player release];
    [effectName release];
    [super dealloc];    
}

- (void)cacheWithName:(NSString *)name {
    [effects setObject:self forKey:name];
}

- (void)play {
    [player play];
}

- (void)stop {
    [player stop];
}

- (void)stopAndDecay {
    [player stop];
}

- (BOOL)playing {
    return player.playing;
}


- (void)setVolume:(float)_volume {
    player.volume = _volume;
}

- (void)setPosition:(Vector *)pos{
    float distance = [pos distance2D:listenerPos];
    
    if (distance < SOUND_EFFECT_NEAR_RANGE) {
        player.volume = 1.0;
    } else if (distance > SOUND_EFFECT_FAR_RANGE) {
        player.volume = 0.0;
    } else {
        player.volume = (distance - SOUND_EFFECT_NEAR_RANGE) / (SOUND_EFFECT_FAR_RANGE - SOUND_EFFECT_NEAR_RANGE);
    }
}


@end
