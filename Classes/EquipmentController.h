//
//  EquipmentController.h
//  Void
//
//  Created for VOID on 10/2/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ItemController.h"
#import "Player.h"

@interface EquipmentController : ItemController {
  IBOutlet UILabel *equipmentName;
  IBOutlet UITextView *description;
  IBOutlet UITableView *effectsTable;
  IBOutlet UILabel *valueLabel;
}

- (void)updateBadge;

- (IBAction)buyback:(id)sender;

- (IBAction)toggleHelp:(id)sender;

@end
