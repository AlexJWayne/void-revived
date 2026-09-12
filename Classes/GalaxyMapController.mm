//
//  GalaxyMapController.m
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "GalaxyMapController.h"

#include "VoidAppDelegate.h"
@class VoidAppDelegate;

#include "GalaxyMap.h"
@class GalaxyMap;

@implementation GalaxyMapController


- (id)init {
  if (self = [super initWithNibName:@"GalaxyMap" bundle:nil]) {
    
    self.title = @"Galaxy Map";
    self.tabBarItem.image = [UIImage imageNamed:@"GalaxyMapTab.png"];
    [self setHelpScreenName:@"GalaxyMap"];
    shouldPlayInvokeSound = NO;
  }
  return self;
}

// Implement viewDidLoad to do additional setup after loading the view.
- (void)viewDidLoad {
  [super viewDidLoad];
  stageDetail.hidden = YES;
}

//- (void)viewWillAppear:(BOOL)animated {
//  [super viewWillAppear:animated];
//}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];
  [map setNeedsDisplay];
  
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  Player *player = [[Player alloc] init];
  if (![defaults boolForKey:@"Seen.GalaxyConquered"] && [player.completedStages count] >= [[[Utility dataFile:@"Stages"] allKeys] count]) {
    [defaults setBool:YES forKey:@"Seen.GalaxyConquered"];
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Galaxy Conquered"
                                                    message:@"You have become the most infamous space pirate known to intelligent life.  You may now retire in your wealth or you can continue to terrorize your new minions.  The choice is yours."
                                                   delegate:self
                                          cancelButtonTitle:@"Continue"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
  }
  [player release];
}

- (void)viewWillDisappear:(BOOL)animated {
  stageDetail.hidden = YES;
  [super viewWillDisappear:animated];
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
  // Return YES for supported orientations
  return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}


- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
  // Release anything that's not essential, such as cached data
}


- (void)dealloc {
  NSLog(@"Dealloc HyperspaceController");
  [super dealloc];
}

- (void)tappedStage:(NSString *)stageName {
  if (stageDetail.hidden == NO) return;
  
  Player *player = [[Player alloc] init];
  
  if ([self canTravelTo:stageName from:player.currentStage]) {
    // Show stage detail view
    [self playSound:HyperspaceSoundChimeIn];
    
    stageNameLabel.text = stageName;
    stageDetail.hidden = NO;
    
    NSString *raceName;
    UIColor  *raceColor;
    
    switch ([[[[Utility dataFile:@"Stages"] objectForKey:stageName] objectForKey:@"zone"] intValue]) {
      case 0:
        raceName = @"Uninhabited";
        raceColor = [UIColor colorWithWhite:0.8 alpha:1.0];
        break;
        
      case 1:
        raceName = @"Cykan";
        raceColor = [UIColor colorWithRed:0.8 green:0.15 blue:0.15 alpha:1.0];
        break;
        
      case 2:
        raceName = @"Orthos";
        raceColor = [UIColor colorWithRed:0.0 green:0.6 blue:0.0 alpha:1.0];
        break;
        
      case 3:
        raceName = @"Wrethk";
        raceColor = [UIColor colorWithRed:0.8 green:0.36 blue:0.0 alpha:1.0];
        break;
        
      case 4:
        raceName = @"Lanaar";
        raceColor = [UIColor colorWithRed:0.2 green:0.5 blue:1.0 alpha:1.0];
        break;
    }
    raceNameLabel.text = raceName;
    raceNameLabel.textColor = raceColor;
    
    NSString *tierName;
    
    if (raceName == @"Uninhabited") {
      tierName = @"";
    } else {
      switch ([[[[Utility dataFile:@"Stages"] objectForKey:stageName] objectForKey:@"tier"] intValue]) {
        case 0:
          tierName = @"Tutorial"; break;
        case 1:
          tierName = @"Outer Rim"; break;
        case 2:
          tierName = @"Inner Rim"; break;
        case 3:
          tierName = @"Outer Core"; break;
        case 4:
          tierName = @"Inner Core"; break;
        case 5:
          tierName = @"Homeworld"; break;
      }      
    }
    tierNameLabel.text = tierName;

    
    
    
    stageDetail.alpha = 0.0;
    [UIView beginAnimations:@"stageDetailFadeIn" context:nil];
    [UIView setAnimationDuration:0.3];
    stageDetail.alpha = 1.0;
    [UIView commitAnimations];
    
    [map setHighlightStage:stageName];
    [map highlightStage:stageName];
    
  } else {
    // Selected stage cannont be gotten to from here.
    [self playSound:HyperspaceSoundError];
    
    #if CONFIG_Debug
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:[NSString stringWithFormat:@"%@ (%i)", stageName, [[[[Utility dataFile:@"Stages"] objectForKey:stageName] objectForKey:@"tier"] intValue]]
                                                    message:@"You may only travel to solar systems that are connected to systems you have conquered."
                                                   delegate:nil
                                          cancelButtonTitle:@"OK"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
    #endif
  }
  
  [player release];
}

- (BOOL)canTravelTo:(NSString *)to from:(NSString *)from {
  NSDictionary *stages = [Utility dataFile:@"Stages"];
  
  // Allow travel if player is playing the same stage they are currently on.
  if ([to isEqualToString:from]) return YES;
  
  // Allow travel if the stage was previously completed.
  Player *player = [[[Player alloc] init] autorelease];
  if ([player.completedStages indexOfObject:to] != NSNotFound) return YES;
  
  // Allow travel if any completed stage links to destination
  for (NSString *completedStageName in player.completedStages) {
    if ([[[stages objectForKey:completedStageName] objectForKey:@"connections"] indexOfObject:to] != NSNotFound) return YES;
  }
  
  // Allow travel if the destination links to a completed stage
  for (NSString *stageName in [[stages objectForKey:to] objectForKey:@"connections"]) {
    if ([player.completedStages indexOfObject:stageName] != NSNotFound) return YES;
  }
    
  return NO;
}

- (IBAction)playStage:(id)sender {
  Player *player = [[Player alloc] init];
  
  BOOL hasShip = ![player.shipType isEqualToString:@"<Empty>"];
  
  BOOL hasGuns = NO;
  if (hasShip) {
    for (NSString *gunName in player.guns) {
      if (![gunName isEqualToString:@"<Empty>"]) hasGuns = YES;
    }    
  }
  
  BOOL hasValidWeaponGroups = NO;
  if (hasShip) {
    for (int i = 0; i < 3; i++) {
      if ([[player.weaponGroups objectAtIndex:i] count] > 0) hasValidWeaponGroups = YES;
    }    
  }
  
  if (!hasShip) {
    // No ship
    [self playSound:HyperspaceSoundError];
    
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"No Ship"
                                                    message:@"Go to the shipyard to purchase your first ship."
                                                   delegate:nil
                                          cancelButtonTitle:@"OK"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
    
  } else if (!hasGuns) {
    // No equipped guns
    [self playSound:HyperspaceSoundError];
    
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"No Weapons"
                                                    message:@"Space is dangerous.  Equip some weapons on the Weapons tab."
                                                   delegate:nil
                                          cancelButtonTitle:@"OK"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
    
  } else if (!hasValidWeaponGroups) {
    // No weapons in any weapon groups
    [self playSound:HyperspaceSoundError];
    
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"You have no weapons in any weapon group"
                                                    message:@"On the weapons screen, use the A, B and C buttons to put some guns into at least one group."
                                                   delegate:nil
                                          cancelButtonTitle:@"OK"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
    
  } else {
    // All good
    [self playSound:HyperspaceSoundPlayStage];
    player.currentStage = stageNameLabel.text;
    [player save];
    shouldPlayInvokeSound = NO;
    [(VoidAppDelegate *)[UIApplication sharedApplication].delegate playStageNamed:player.currentStage];
  }
  
  
  [player release];
}

- (IBAction)returnToMap:(id)sender {
  [self playSound:HyperspaceSoundChimeOut];
  [UIView beginAnimations:@"stageDetailFadeOut" context:nil];
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(finishedHidingDetailWindow)];
  [UIView setAnimationDuration:0.3];
  stageDetail.alpha = 0.0;
  [UIView commitAnimations];
}

- (void)finishedHidingDetailWindow {
  stageDetail.hidden = YES;
}

- (BOOL)shouldHighlightNewStage {
  return stageDetail.hidden;
}

- (IBAction)toggleHelp:(id)sender {
  helpScreen.hidden = !helpScreen.hidden;
}

@end
