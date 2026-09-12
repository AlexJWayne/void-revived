//
//    SettingsController.m
//    Void
//
//    Created for VOID on 10/25/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "SettingsViewController.h"
#import "TitleController.h"

@implementation SettingsViewController


// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        effect = [[SoundEffect alloc] initWithName:@"Select" looping:YES];
        closeSound = [[SoundEffect effectNamed:@"MainSelect" looping:NO] retain];
        [[UIAccelerometer sharedAccelerometer] setDelegate:self];
        [[UIAccelerometer sharedAccelerometer] setUpdateInterval:1.0 / 30.0];
    }
    return self;
}


/*
// Implement loadView to create a view hierarchy programmatically.
- (void)loadView {
}
*/


// Implement viewDidLoad to do additional setup after loading the view.
- (void)viewDidLoad {
    [super viewDidLoad];
    
    turnSensitivity = [[NSUserDefaults standardUserDefaults] floatForKey:@"turnSensitivity"];
    
    musicSlider.value     = [[NSUserDefaults standardUserDefaults] floatForKey:@"musicVolume"];
    sensitivitySlider.value = turnSensitivity;
    
    loggingSwitch.on                = [[NSUserDefaults standardUserDefaults] boolForKey:@"gameLogging"];
    invertSteeringSwitch.on = [[NSUserDefaults standardUserDefaults] boolForKey:@"invertSteering"];
    
    [levelSlider setMinimumTrackImage:[UIImage imageNamed:@"LevelTrack.png"] forState:UIControlStateNormal];
    [levelSlider setMaximumTrackImage:[UIImage imageNamed:@"LevelTrack.png"] forState:UIControlStateNormal];
    [levelSlider setThumbImage:[UIImage imageNamed:@"LevelThumb.png"] forState:UIControlStateNormal];
    levelSlider.frame = CGRectMake(levelSlider.frame.origin.x, levelSlider.frame.origin.y, levelSlider.frame.size.width, 30.0);
    
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


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
    // Release anything that's not essential, such as cached data
}


- (void)dealloc {
    NSLog(@"Dealloc SettingsViewController");
    [[UIAccelerometer sharedAccelerometer] setDelegate:nil];
    [effect release];
    [closeSound release];
    [super dealloc];
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
    
    levelSlider.value = -lastTilt;
}


#pragma mark Actions
- (IBAction)setMusicVolume:(id)sender {
    float musicVolume = [(UISlider *)sender value];
    [(TitleController*)[self parentViewController] music].volume = musicVolume;
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

- (IBAction)setLogging:(id)sender {
    [[NSUserDefaults standardUserDefaults] setBool:loggingSwitch.on forKey:@"gameLogging"];
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
