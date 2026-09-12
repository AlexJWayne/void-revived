//
//  BackgroundMusic.h
//  Void
//
//  Created for VOID on 10/17/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>


@interface BackgroundMusic : NSObject {
    NSString *trackName;
    
    AVAudioPlayer *player;
}

@property (nonatomic, copy) NSString *trackName;

+ (BackgroundMusic*)globalMusic;

+ (BOOL)isItunesPlaying;
- (id)initWithTrack:(NSString *)name;

- (void)play;
- (void)stop;

- (void)setVolume:(float)_volume;

@end
