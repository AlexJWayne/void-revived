//
//  LoadoutController.h
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ItemController.h"
#import "Weapon.h"

@interface WeaponsController : ItemController {
  IBOutlet UILabel *weaponName;
  IBOutlet UITextView *description;
  IBOutlet UILabel *shieldDmg;
  IBOutlet UILabel *armorDmg;
  IBOutlet UILabel *firingSpeed;
  IBOutlet UILabel *speed;
  IBOutlet UILabel *range;
  IBOutlet UILabel *energy;
  IBOutlet UILabel *value;
  IBOutlet UILabel *mass;
  
  NSMutableArray *weaponGroups;
  NSMutableArray *groupButtons;
  IBOutlet UIButton *groupAButton;
  IBOutlet UIButton *groupBButton;
  IBOutlet UIButton *groupCButton;
  
  int maxEnergy;
}

- (void)updateBadge;

- (IBAction)buyback:(id)sender;
- (IBAction)assignGroup:(id)sender;

- (IBAction)toggleHelp:(id)sender;

@end
