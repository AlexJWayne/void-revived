//
//  BackgroundMusic.m
//  Void
//
//  Created for VOID on 10/17/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "BackgroundMusic.h"
#import <AudioToolbox/AudioToolbox.h>

static BackgroundMusic *globalMusic;

@implementation BackgroundMusic

@synthesize trackName;

+ (BackgroundMusic*)globalMusic {
    return globalMusic;
}

+ (BOOL)isItunesPlaying {
    UInt32 itunesIsPlaying  = 0;
    UInt32 propertyDataSize = sizeof(UInt32);
    AudioSessionGetProperty(kAudioSessionProperty_OtherAudioIsPlaying, &propertyDataSize, &itunesIsPlaying);    
    return itunesIsPlaying > 0;
}

- (id)initWithTrack:(NSString *)name {
    [super init];
    
    self.trackName = name;
    
    if (![BackgroundMusic isItunesPlaying]) {
        NSString *audioUrl = [[NSBundle mainBundle] pathForResource:trackName ofType:@"caf"];
        player = [[AVAudioPlayer alloc] initWithContentsOfURL:[NSURL URLWithString:audioUrl] error:nil];
        player.volume = [[NSUserDefaults standardUserDefaults] floatForKey:@"musicVolume"];
        player.numberOfLoops = -1;        
    }
    
    return self;
}

- (void)play {
    [player play];
    globalMusic = self;
}

- (void)stop {
    [player stop];
    if (globalMusic == self) {
        globalMusic = nil;
    }
}

- (void)setVolume:(float)_volume {
    player.volume = _volume;
}

- (float)volume {
    return player.volume;
}

- (void)dealloc {
    NSLog(@"dealloc Music: %@", trackName);
    if (globalMusic == self) {
        globalMusic = nil;
    }
    [player release];
    self.trackName = nil;
    [super dealloc];
}

@end
