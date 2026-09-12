//
//  ShipyardController.h
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "HyperspaceScreenController.h"
#import "Player.h"
#import "GLShipPreview.h"

@interface ShipyardController : HyperspaceScreenController <UIAlertViewDelegate> {
  IBOutlet UITableView *shipsTable;
  IBOutlet UILabel *credits;
  IBOutlet UILabel *shipNameLabel;
  IBOutlet UILabel *shields;
  IBOutlet UILabel *shieldRegen;
  IBOutlet UILabel *shieldDelay;
  IBOutlet UILabel *armor;
  IBOutlet UILabel *energy;
  IBOutlet UILabel *recharge;
  IBOutlet UILabel *gunMounts;
  IBOutlet UILabel *equipmentMounts;
  IBOutlet UILabel *maxSpeed;
  IBOutlet UILabel *thrust;
  IBOutlet UILabel *braking;
  IBOutlet UILabel *mass;
  IBOutlet UILabel *turnSpeed;
  IBOutlet UILabel *price;
  IBOutlet UILabel *priceLabel;
  
  IBOutlet UIButton *buyButton;
  IBOutlet UIButton *sellButton;
  
  IBOutlet GLShipPreview *shipPreview;
  
  NSNumberFormatter *numberFormatter;
  
  NSMutableArray *pilotableShipNames;
  NSMutableDictionary *pilotableShips;
  NSIndexPath *selectedShipIndexPath;
  
  NSArray *selectSounds;
  int lastSelectSoundIndex;
  
  NSTimer *doubleTapTimer;
  BOOL doDoubleTap;
}

- (IBAction)buyShip:(id)sender;
- (IBAction)sellShip:(id)sender;
- (void)displayShipAtIndex:(int)index;
- (void)timeoutDoubleTap:(NSTimer *)timer;
- (void)addShipsFromStage:(NSString *)stageName;

- (int)tradeInValue;

- (IBAction)toggleHelp:(id)sender;

@end
