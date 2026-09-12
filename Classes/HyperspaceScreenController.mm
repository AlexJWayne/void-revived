//
//  HyperspaceScreenController.m
//  Void
//
//  Created for VOID on 3/6/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "VoidAppDelegate.h"
#import "HyperspaceScreenController.h"
#import "OpenFeint.h"

@implementation HyperspaceScreenController


// The designated initializer. Override to perform setup that is required before the view is loaded.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
  if ((self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil])) {
    
    helpScreen = nil;
    
    sounds = [[NSArray alloc] initWithObjects:
              [SoundEffect effectNamed:@"SwitchTab" looping:NO],
              [SoundEffect effectNamed:@"ChimeIn" looping:NO],
              [SoundEffect effectNamed:@"ChimeOut" looping:NO],
              [SoundEffect effectNamed:@"Error" looping:NO],
              [SoundEffect effectNamed:@"PlayStage" looping:NO],
              [SoundEffect effectNamed:@"Sell" looping:NO],
              [SoundEffect effectNamed:@"Mount" looping:NO],
              [SoundEffect effectNamed:@"Dismount" looping:NO],
              [SoundEffect effectNamed:@"BuyShip" looping:NO],
              [SoundEffect effectNamed:@"WeaponSwap" looping:NO],
              nil];
        
    shouldPlayInvokeSound = YES;
  }
  return self;
}

/*
// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView {
}
*/


// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
  [super viewDidLoad];
  
  // Help Button
  showHelpScreenButton = [[UIButton alloc] initWithFrame:CGRectMake(457, 48, 20, 20)];
  [showHelpScreenButton setImage:[UIImage imageNamed:@"HelpButton.png"] forState:UIControlStateNormal];
  [showHelpScreenButton addTarget:self action:@selector(toggleHelp:) forControlEvents:UIControlEventTouchUpInside];
  showHelpScreenButton.showsTouchWhenHighlighted = YES;
  [self.view addSubview:showHelpScreenButton];
  
  // Open Feint Button
  showOpenFeintButton = [[UIButton alloc] initWithFrame:CGRectMake(457, 78, 20, 20)];
  [showOpenFeintButton setImage:[UIImage imageNamed:@"OpenFeintButton.png"] forState:UIControlStateNormal];
  [showOpenFeintButton addTarget:self action:@selector(launchOpenFeintDashboard:) forControlEvents:UIControlEventTouchUpInside];
  showOpenFeintButton.showsTouchWhenHighlighted = YES;
  [self.view addSubview:showOpenFeintButton];
  
  NSString *helpScreenDefaultsKey = [NSString stringWithFormat:@"Seen.Help.%@", helpScreenName];
  helpScreen.hidden = [[NSUserDefaults standardUserDefaults] boolForKey:helpScreenDefaultsKey];
  [[NSUserDefaults standardUserDefaults] setBool:YES forKey:helpScreenDefaultsKey];
  [self.view addSubview:helpScreen];
}


/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
  // Release anything that's not essential, such as cached data
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  if (shouldPlayInvokeSound) [self playSound:HyperspaceSoundSwitchTab];
  shouldPlayInvokeSound = YES;
}

- (void)playSound:(HyperspaceSound)soundId {
  SoundEffect *sound = [sounds objectAtIndex:soundId];
  [sound play];
}

- (void)setHelpScreenName:(NSString *)aHelpScreenName {
  [helpScreenName release];
  helpScreenName = [aHelpScreenName copy];
  
  [helpScreen release];
  
  NSString *imageFileName = [NSString stringWithFormat:@"Help.%@.png", helpScreenName];
  
  helpScreen = [[UIButton alloc] initWithFrame:CGRectMake(0.0, 0.0, 480.0, 271.0)];
  [helpScreen setBackgroundImage:[UIImage imageNamed:imageFileName] forState:UIControlStateNormal];
  [helpScreen setBackgroundImage:[UIImage imageNamed:imageFileName] forState:UIControlStateHighlighted];
  [helpScreen setBackgroundImage:[UIImage imageNamed:imageFileName] forState:UIControlStateSelected];
  [helpScreen addTarget:self action:@selector(toggleHelp:) forControlEvents:UIControlEventTouchUpInside];
}

- (IBAction)launchOpenFeintDashboard:(id)sender {
  [VoidAppDelegate launchOpenFeintDashboard];
}

- (void)reset {
	//...
}

- (void)dealloc {
  [showHelpScreenButton release];
  [showOpenFeintButton release];
  [sounds release];
  [helpScreen release];
  [helpScreenName release];
  [super dealloc];
}


@end
