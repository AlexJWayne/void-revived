//
//  ItemController.h
//  Void
//
//  Created for VOID on 11/7/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "HyperspaceScreenController.h"
#import "SoundEffect.h"
#import "Player.h"


enum {
  ItemTableModeEquip = 0,
  ItemTableModeSell
};

@interface ItemController : HyperspaceScreenController <UITableViewDelegate, UITableViewDataSource> {
  // Outlets
  IBOutlet UITableView *itemTable;
  IBOutlet UIButton *modeButton;
  
  NSMutableArray *hardpointButtons;
  IBOutlet UIButton *hardpoint1;
  IBOutlet UIButton *hardpoint2;
  IBOutlet UIButton *hardpoint3;
  IBOutlet UIButton *hardpoint4;
  IBOutlet UIButton *hardpoint5;
  
  // Item stores
  NSDictionary *allItems;
  NSMutableArray *inventory;
  NSMutableArray *equipped;  
  
  // Sell mode or Equip mode flag
  int mode;
  
  // Sounds
  SoundEffect *enterSellModeSound;
  SoundEffect *sellSelectSound;
  SoundEffect *sellDeselectSound;
  
  int lastSelectSoundIndex;
  NSArray *selectSounds;
  
  BOOL supressNextSelectSound;
  
  
  
  NSMutableArray *indexPathsToSell;
  NSIndexPath *selectedIndexPath;
  
  
  
  IBOutlet UIButton *buybackButton;
  NSMutableArray *lastSaleItems;
  int lastSaleValue;
  
  
  // Double taps
  NSTimer *doubleTapTimer;
  BOOL doDoubleTap;
}

- (void)playSelectSound;

// Actions
- (IBAction)swapMode:(id)sender;  // Deprecated
- (IBAction)tappedEquippedItem:(id)sender;
- (IBAction)dismountItem:(id)sender;
- (void)mountItemAtIndex:(int)index;
- (IBAction)sellItem:(id)sender;
- (IBAction)tappedEquipButton:(id)sender;

// Helpers
- (int)hardpointIdForIndex:(int)index;
- (int)indexForHardpointId:(int)hardpointId;

// Double taps
- (void)startDoubleTapDetection;
- (void)timeoutDoubleTap:(NSTimer *)timer;

// Methods to override
- (void)displayItem:(NSString *)aItemName;
- (void)sellItems;
- (int)itemSlots;
- (void)tappedEquippedItemIndex:(int)index;
- (void)mountItemToIndex:(int)index;
- (void)dismountItemAtIndex:(int)index;
- (void)updateHardpoints;
- (BOOL)shouldEquipItem:(NSString *)itemName;

@end
