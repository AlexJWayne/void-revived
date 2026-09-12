//
//  StageSummaryController.h
//  Void
//
//  Created for VOID on 3/3/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Utility.h"
#import "Player.h"
#import "SoundEffect.h"

@interface StageSummaryController : UIViewController <UITableViewDelegate, UITableViewDataSource> {
  IBOutlet UITableView *tableView;
  IBOutlet UILabel *titleLabel;
  
  NSString *stageName;
  
  int kills;
  int credits;
  NSArray *weapons;
  NSArray *equipment;
  NSString *shipUnlock;
  
  SoundEffect *dismissSound;
}

- (id)initWithStats:(NSDictionary *)stats;
- (IBAction)dismissSummary:(id)sender;
- (void)hide;

@end
