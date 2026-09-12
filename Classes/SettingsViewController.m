//
//    SettingsController.m
//    Void
//
//    Created for VOID on 10/25/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "SettingsViewController.h"

@implementation SettingsViewController

@synthesize musicSlider, sensitivitySlider, steeringIndicator, invertSteeringSwitch;
@synthesize music;

#pragma mark Lifecycle
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        effect = [[SoundEffect alloc] initWithName:@"Select" looping:YES];
        closeSound = [[SoundEffect effectNamed:@"MainSelect" looping:NO] retain];
        [[UIAccelerometer sharedAccelerometer] setDelegate:self];
        [[UIAccelerometer sharedAccelerometer] setUpdateInterval:1.0 / 30.0];
    }
    return self;
}

- (void)viewDidUnload {
    NSLog(@"Unloading SettingsViewController");
    self.musicSlider = nil;
    self.sensitivitySlider = nil;
    self.steeringIndicator = nil;
    self.invertSteeringSwitch = nil;
}

- (void)dealloc {
    NSLog(@"Dealloc SettingsViewController");
    [[UIAccelerometer sharedAccelerometer] setDelegate:nil];
    [effect release];
    [closeSound release];
    [music release];
    [super dealloc];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    
    musicSlider.value       = [defaults floatForKey:@"musicVolume"];
    invertSteeringSwitch.on = [defaults boolForKey:@"invertSteering"];
    
    turnSensitivity         = [defaults floatForKey:@"turnSensitivity"];
    sensitivitySlider.value = turnSensitivity;

//    [levelSlider setMinimumTrackImage:[UIImage imageNamed:@"LevelTrack.png"] forState:UIControlStateNormal];
//    [levelSlider setMaximumTrackImage:[UIImage imageNamed:@"LevelTrack.png"] forState:UIControlStateNormal];
//    [levelSlider setThumbImage:[UIImage imageNamed:@"LevelThumb.png"] forState:UIControlStateNormal];
//    levelSlider.frame = CGRectMake(levelSlider.frame.origin.x, levelSlider.frame.origin.y, levelSlider.frame.size.width, 30.0);
    
    // Animate view into place
    self.view.alpha = 0.0;
    self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, 320);
    
    [UIView beginAnimations:@"FadeInSettings" context:nil];
    [UIView setAnimationDuration:0.5];
    self.view.alpha = 1.0;
    self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, -320);
    [UIView commitAnimations];
    
}



- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}


- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration {
    // Set range of values to only 1/5 of a vertical tilt
    GLfloat currentTilt = acceleration.y * turnSensitivity;
    if (currentTilt >    1.0) currentTilt =    1.0;
    if (currentTilt < -1.0) currentTilt = -1.0;
    
    // Apply deadzone
    GLfloat deadZone = 0.2;
    if (currentTilt < deadZone && currentTilt > -deadZone) {
        currentTilt = 0.0;
    } else {
        if (currentTilt > 0) currentTilt -= deadZone;
        if (currentTilt < 0) currentTilt += deadZone;
        currentTilt *= 1.0/(1.0 - deadZone);
    }
    if (invertSteeringSwitch.on) currentTilt = -currentTilt;
    lastTilt = lastTilt * 0.8 + currentTilt * 0.2;
    
    
    steeringIndicator.transform = CGAffineTransformMakeRotation(-lastTilt * M_PI/4);
}


#pragma mark Actions
- (IBAction)setMusicVolume:(id)sender {
    float musicVolume = [(UISlider *)sender value];
    [[BackgroundMusic globalMusic] setVolume:musicVolume];
    [[NSUserDefaults standardUserDefaults] setFloat:musicVolume forKey:@"musicVolume"];
}

- (IBAction)startEffectsSound:(id)sender {
    [effect play];
}

- (IBAction)stopEffectsSound:(id)sender {
    [effect stopAndDecay];
}

- (IBAction)setTurnSensitivity:(id)sender {
    turnSensitivity = [(UISlider *)sender value];
    [[NSUserDefaults standardUserDefaults] setFloat:turnSensitivity forKey:@"turnSensitivity"];
}

- (IBAction)setInvertSteering:(id)sender {
    [[NSUserDefaults standardUserDefaults] setBool:invertSteeringSwitch.on forKey:@"invertSteering"];
}



- (IBAction)dismissView:(id)sender {
    [closeSound play];
    [effect stop];
    
    [UIView beginAnimations:@"FadeOutSettings" context:nil];
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(animationComplete)];
    [UIView setAnimationDuration:0.5];
    self.view.alpha = 0.0;
    self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, 320);
    [UIView commitAnimations];
}

- (void)animationComplete {
    [self.view removeFromSuperview];
}

@end
