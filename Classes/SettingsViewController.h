//
//  SettingsController.h
//  Void
//
//  Created for VOID on 10/25/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SoundEffect.h"
#import "BackgroundMusic.h"


@interface SettingsViewController : UIViewController <UIAccelerometerDelegate> {
    UISlider *musicSlider;
    UISlider *sensitivitySlider;
    UIImageView *steeringIndicator;
    UISwitch *invertSteeringSwitch;
    
    float turnSensitivity;
    float lastTilt;
    
    SoundEffect *closeSound;
    SoundEffect *effect;
    
    BackgroundMusic *music;
}

@property (nonatomic, retain) IBOutlet UISlider *musicSlider;
@property (nonatomic, retain) IBOutlet UISlider *sensitivitySlider;
@property (nonatomic, retain) IBOutlet UIImageView *steeringIndicator;
@property (nonatomic, retain) IBOutlet UISwitch *invertSteeringSwitch;
@property (nonatomic, retain) BackgroundMusic *music;

- (IBAction)setMusicVolume:(id)sender;
- (IBAction)startEffectsSound:(id)sender;
- (IBAction)stopEffectsSound:(id)sender;

- (IBAction)setTurnSensitivity:(id)sender;
- (IBAction)setInvertSteering:(id)sender;

- (IBAction)dismissView:(id)sender;
- (void)animationComplete;

@end
