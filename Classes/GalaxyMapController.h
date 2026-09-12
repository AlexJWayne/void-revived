//
//  GalaxyMapController.h
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "HyperspaceScreenController.h"
#import "Player.h"
#import "SoundEffect.h"

@class GalaxyMap;

@interface GalaxyMapController : HyperspaceScreenController {
  IBOutlet GalaxyMap *map;
  IBOutlet UIView *stageDetail;
  IBOutlet UILabel *stageNameLabel;
  IBOutlet UILabel *raceNameLabel;
  IBOutlet UILabel *tierNameLabel;
}

- (void)tappedStage:(NSString *)stageName;
- (BOOL)canTravelTo:(NSString *)to from:(NSString *)from;

- (IBAction)playStage:(id)sender;
- (IBAction)returnToMap:(id)sender;

- (void)finishedHidingDetailWindow;

- (BOOL)shouldHighlightNewStage;

- (IBAction)toggleHelp:(id)sender;

@end
