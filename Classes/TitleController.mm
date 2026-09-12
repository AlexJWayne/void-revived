//
//    TitleController.m
//    Void
//
//    Created for VOID on 10/18/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "TitleController.h"

#include "VoidAppDelegate.h"
@class VoidAppDelegate;

#import "OpenFeint.h"

@implementation TitleController

@synthesize continueButton, newDevGameButton, background;

#pragma mark Lifecycle
- (id)init {
    if (self = [super initWithNibName:@"Title" bundle:nil]) {
        self.tabBarItem.title = @"Menu";
        self.tabBarItem.image = [UIImage imageNamed:@"MenuTab.png"];
    }
    return self;
}

- (void)viewDidUnload {
    self.continueButton = nil;
    self.newDevGameButton = nil;
    self.background = nil;
}

- (void)dealloc {
    NSLog(@"Dealloc TitleController");
    [settingsController release];
    [instructionsController release];
    [creditsController release];
    [selectedItemSound release];
    [music stop];
    [music release];
    [overlay release];
    [super dealloc];
}



- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Load sounds
    if (!self.tabBarController) {
        music = [[BackgroundMusic alloc] initWithTrack:@"MusicTheme"];
        [music play];
    }
    selectedItemSound = [[SoundEffect effectNamed:@"MainSelect" looping:NO] retain];
    
    // Cheat only in Debug
    #if !CONFIG_Debug
    newDevGameButton.hidden = YES;
    #endif
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    
    // Disable continue button of there is no player data
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"player"]) {
        continueButton.enabled = YES;
    } else {
        continueButton.enabled = NO;
    }    
}

- (void)viewDidAppear:(BOOL)animated {
    [self performSelector:@selector(fetchLitePlayerData) withObject:nil afterDelay:0.1];
    
    if (self.tabBarController) {
        continueButton.hidden = YES;
    }
    
    NSString *imageName = [[NSArray arrayWithObjects:@"Cyber", @"Organic", @"Crystal", @"Energy", nil] objectAtIndex:(rand() % 4)];
    background.image = [UIImage imageNamed:[NSString stringWithFormat:@"Title.%@.png", imageName]];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}


- (IBAction)continueGame {
    [selectedItemSound play];
    
    [Utility cacheDataFiles];
    
    if ([(VoidAppDelegate *)[UIApplication sharedApplication].delegate isLegit]) {
        [(VoidAppDelegate *)[UIApplication sharedApplication].delegate showHyperspace];
    } else {
        [[[[UIAlertView alloc] initWithTitle:@"Busted!"
                                     message:@"Your installation is not legal, so ability to continue your game is disabled."
                                    delegate:nil
                           cancelButtonTitle:@":("
                           otherButtonTitles:nil] autorelease] show];
    }
}

- (IBAction)newGame {
    [selectedItemSound play];
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"player"]) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Existing Game Data!"
                                                        message:@"Starting a new game will erase your current game, and you will start over.    Are you sure you want to do this?"
                                                       delegate:self
                                              cancelButtonTitle:@"Cancel"
                                              otherButtonTitles:@"New Game", nil];
        [alert show];
        [alert release];        
    } else {
        [[NSUserDefaults standardUserDefaults] setBool:NO forKey:@"Seen.GalaxyConquered"];
        [self continueGame];
    }
}

- (IBAction)newDevGame {
    [[NSUserDefaults standardUserDefaults] setBool:NO forKey:@"Seen.GalaxyConquered"];
    
    NSDictionary *devPlayer = [Utility dataFile:@"NewPlayerDev"];
    [[NSUserDefaults standardUserDefaults] setObject:devPlayer forKey:@"player"];
    [self continueGame];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex {
    if (buttonIndex == 1) {
        [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"player"];
        [self newGame];
        
        if (self.tabBarController) {
            self.tabBarController.viewControllers = [NSArray arrayWithObjects:
                                                     [[[GalaxyMapController alloc] init] autorelease],
                                                     [[[WeaponsController   alloc] init] autorelease],
                                                     [[[EquipmentController alloc] init] autorelease],
                                                     [[[ShipyardController  alloc] init] autorelease],
                                                     self, nil];
            
            [self.tabBarController setSelectedIndex:0];
        }
    }
}

- (IBAction)instructions {
    [selectedItemSound play];
    [instructionsController release];
    instructionsController = [[InstructionsController alloc] initWithNibName:@"Instructions" bundle:[NSBundle mainBundle]];
    [[self overlayableView] addSubview:instructionsController.view];
}

- (IBAction)settings {
    [selectedItemSound play];
    [settingsController release];
    settingsController = [[SettingsViewController alloc] initWithNibName:@"Settings" bundle:[NSBundle mainBundle]];
    settingsController.music = music;
    [[self overlayableView] addSubview:settingsController.view];
}

- (IBAction)credits {
    [selectedItemSound play];
    [creditsController release];
    creditsController = [[CreditsController alloc] initWithNibName:@"Credits" bundle:[NSBundle mainBundle]];
    [[self overlayableView] addSubview:creditsController.view];
}

- (IBAction)openFeintDashboard {
    [VoidAppDelegate launchOpenFeintDashboard];
}

- (void)fadeIn {
    overlay = [[UIView alloc] initWithFrame:self.view.frame];
    overlay.backgroundColor = [UIColor blackColor];
    [[self view] addSubview:overlay];
    
    // Fade from black to white
    [UIView beginAnimations:@"TitleColorChange" context:nil];
    [UIView setAnimationDuration:1.7];
    overlay.backgroundColor = [UIColor whiteColor];
    [UIView commitAnimations];
    
    // Fade out revealing menu
    [UIView beginAnimations:@"TitleColorChange" context:nil];
    [UIView setAnimationDuration:0.5];
    [UIView setAnimationDelay:1.7];
    overlay.alpha = 0.0;
    [UIView commitAnimations];
}

- (UIView*)overlayableView {
    UIView *returnValue = nil;
    if (self.tabBarController) {
        returnValue = self.tabBarController.view;
    } else {
        returnValue = self.view;
    }
    return returnValue;
}

- (void)hideContinue {
    continueButton.hidden = YES;
}

- (void)fetchLitePlayerData {
//    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
//    
//    if (![defaults boolForKey:@"checkedForLiteData"]) {
//        NSURL *url = [NSURL URLWithString:[NSString stringWithFormat:@"https://example.invalid/player_states/latest_lite/%@.json", [[UIDevice currentDevice] uniqueIdentifier]]];
//        NSError *error;
//        NSString *response = [NSString stringWithContentsOfURL:url encoding:NSASCIIStringEncoding error:&error];
//        
//        if (response && !error) {
//            NSDictionary *litePlayerData = [response JSONValue];
//            if (![defaults objectForKey:@"player"]) {
//                [defaults setObject:[litePlayerData objectForKey:@"data"] forKey:@"player"];
//                
//                Player *player = [[Player alloc] init];
//                
//                NSDictionary *shipTemplate = [[Utility dataFile:@"ShipTypes"] objectForKey:player.shipType];
//                int i;
//                
//                // Strip weapons
//                for (NSString *weaponName in player.guns) {
//                    if (![weaponName isEqualToString:@"<Empty>"]) {
//                        [player.weaponInventory addObject:weaponName];
//                    }
//                }
//                [player.guns removeAllObjects];
//                for (i = 0; i < [[shipTemplate objectForKey:@"gunHardpoints"] count]; i++) {
//                    [player.guns addObject:@"<Empty>"];
//                }
//                
//                // Strip equipment
//                for (NSString *itemName in player.equipment) {
//                    if (![itemName isEqualToString:@"<Empty>"]) {
//                        [player.equipmentInventory addObject:itemName];
//                    }
//                }
//                [player.equipment removeAllObjects];
//                for (i = 0; i < [[shipTemplate objectForKey:@"equipmentSlots"] intValue]; i++) {
//                    [player.equipment addObject:@"<Empty>"];
//                }
//                
//                [player save];
//                [player release];
//                
//                [self viewWillAppear:NO];
//            }
//            [defaults setBool:YES forKey:@"checkedForLiteData"];
//        }
//    }
}

@end
