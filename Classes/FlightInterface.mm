//
//    FlightInterface.m
//    Void
//
//    Created for VOID on 9/16/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "VoidAppDelegate.h"
#import "FlightInterface.h"
#import "OpenFeint.h"

@implementation FlightInterface

/*
// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
        if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
                // Custom initialization
        }
        return self;
}
*/

/*
// Implement loadView to create a view hierarchy programmatically.
- (void)loadView {
}
*/

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Rotate pause view and credit readout to landscape
    if ([[UIApplication sharedApplication] statusBarOrientation] == UIInterfaceOrientationLandscapeRight) {
        pauseOverlay.center = CGPointMake(240.0, 160.0);
        creditsLabel.center = CGPointMake(104.0, 12.0);
    }
    
    pauseOverlay.hidden = YES;
    
    #if !CONFIG_Debug
    cheatButton.hidden = YES;
    #endif
    
	[glView startAnimation];
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
    // Release anything that's not essential, such as cached data
    NSLog(@"LOW MEMORY WARNING!");
}


- (void)dealloc {
    NSLog(@"Dealloc FlightInterface");
    [glView release];
    [super dealloc];
}

- (void)updateCredits:(int)credits {
    creditsLabel.text = [NSString stringWithFormat:@"%i", credits];
}

- (void)togglePause {
    #if !CONFIG_Debug
    debugText.hidden = YES;
    #endif
    
    #if CONFIG_Debug
    Ship *ship = [Game sharedGame].ship;
    
    NSMutableString *debugOutput = [[NSMutableString alloc] initWithString:@"SHIP DEBUG\n"];
    [debugOutput appendString:[NSString stringWithFormat:@"shields: %f\n", ship.maxShields]];
    [debugOutput appendString:[NSString stringWithFormat:@"shieldRecharge: %f\n", ship.shieldRecharge]];
    [debugOutput appendString:[NSString stringWithFormat:@"shieldRechargeDelay: %f\n", ship.shieldRechargeDelay]];
    
    [debugOutput appendString:[NSString stringWithFormat:@"armor: %f\n", ship.maxArmor]];
    [debugOutput appendString:[NSString stringWithFormat:@"armorRecharge: %f\n", ship.armorRecharge]];
    
    [debugOutput appendString:[NSString stringWithFormat:@"thrusterForce: %f\n", ship.thrusterForce]];
    [debugOutput appendString:[NSString stringWithFormat:@"brakeForce: %f\n", ship.brakeForce]];
    [debugOutput appendString:[NSString stringWithFormat:@"mass: %f\n", ship.mass]];
    [debugOutput appendString:[NSString stringWithFormat:@"turnSpeed: %f\n", ship.turnSpeed]];
    
    [debugOutput appendString:[NSString stringWithFormat:@"energy: %f\n", ship.energyMax]];
    [debugOutput appendString:[NSString stringWithFormat:@"energyRecharge: %f\n", ship.energyRecharge]];
    
    debugText.text = debugOutput;
    [debugOutput release];
    #endif
    
    if (pauseOverlay.hidden) {
        pauseOverlay.hidden = NO;
        [glView stopAnimation];
        
        pauseOverlay.alpha = 0.0;
        [UIView beginAnimations:@"PauseFadeIn" context:nil];
        pauseOverlay.alpha = 1.0;
        [UIView commitAnimations];
    } else {
        pauseOverlay.hidden = YES;
        [glView startAnimation];
    }
}

- (IBAction)abortStage:(id)sender {
    [glView abortStage];
    pauseOverlay.hidden = YES;
    [glView startAnimation];
}

- (IBAction)autocompleteStage:(id)sender {
    [glView autocomplete];
    pauseOverlay.hidden = YES;
    [glView startAnimation];
}

- (IBAction)showOpenFeintDashboard:(id)sender {
    [VoidAppDelegate launchOpenFeintDashboard];
}

@end
