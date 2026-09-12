//
//  StageSummaryController.m
//  Void
//
//  Created for VOID on 3/3/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "StageSummaryController.h"


@implementation StageSummaryController

/*
// The designated initializer. Override to perform setup that is required before the view is loaded.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        // Custom initialization
    }
    return self;
}
*/

- (id)initWithStats:(NSDictionary *)stats {
  [self initWithNibName:@"StageSummary" bundle:nil];
  
  dismissSound = [[SoundEffect effectNamed:@"SwitchTab" looping:NO] retain];
  
  stageName = [[stats objectForKey:@"stageName"] retain];
  titleLabel.text = [NSString stringWithFormat:@"%@ COMPLETE!", stageName];
  
  kills   = [[stats objectForKey:@"Kills"]   intValue];
  credits = [[stats objectForKey:@"Credits"] intValue];
  
  weapons   = [[stats objectForKey:@"Weapons"]   retain];
  equipment = [[stats objectForKey:@"Equipment"] retain];
  
  // Ship unlock
  shipUnlock = nil;
  NSDictionary *shipsData = [Utility dataFile:@"ShipTypes"];
  NSString *unlockedShip = nil;
  for (NSString *shipName in [shipsData allKeys]) {
    if ([[[shipsData objectForKey:shipName] objectForKey:@"unlockStages"] containsObject:stageName]) {
      unlockedShip = shipName;
    }
  }
  
  if (unlockedShip) {
    Player *player = [[Player alloc] init];
    if (![player.ownedShips containsObject:unlockedShip]) {
      NSString *race = [[unlockedShip componentsSeparatedByString:@" "] objectAtIndex:0];
      
      if      ([race isEqual:@"Cyber"])   race = @"Cykan";
      else if ([race isEqual:@"Crystal"]) race = @"Orthos";
      else if ([race isEqual:@"Organic"]) race = @"Wrethk";
      else if ([race isEqual:@"Energy"])  race = @"Lanaar";
      
      NSString *name = [[shipsData objectForKey:unlockedShip] objectForKey:@"name"];
      shipUnlock = [[NSString stringWithFormat:@"%@ %@", race, name] retain];
    }
    [player release];
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
  
  // Rotate to landscape
  self.view.frame = CGRectMake(0, 0, 480.0, 320.0);
  if ([[UIApplication sharedApplication] statusBarOrientation] == UIInterfaceOrientationLandscapeRight) {
    CGAffineTransform transform = self.view.transform;
    
    // Set the center point of the view to the center point of the window's content area.      
    self.view.center = CGPointMake(160.0, 240.0);
    
    // Rotate the view 90 degrees around its new center point.
    transform = CGAffineTransformRotate(transform, (M_PI / 2.0));
    self.view.transform = transform;
  }  
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
  return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
  // Release anything that's not essential, such as cached data
}


- (IBAction)dismissSummary:(id)sender {
  [dismissSound play];
  [UIView beginAnimations:@"FadeOutSummary" context:nil];
  [UIView setAnimationDuration:0.5];
  [UIView setAnimationDidStopSelector:@selector(hide)];
  self.view.alpha = 0.0;
  self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, -320);
  [UIView commitAnimations];
}

- (void)hide {
  [self.view removeFromSuperview];
}

- (void)dealloc {
  [dismissSound release];
  [stageName release];
  [weapons release];
  [equipment release];
  [shipUnlock release];
  [super dealloc];
}


// Table view data source methods
- (NSInteger)numberOfSectionsInTableView:(UITableView *)aTableView {
  return 5;
}

- (NSInteger)tableView:(UITableView *)aTableView numberOfRowsInSection:(NSInteger)section {
  int rows = 0;
  
  switch (section) {
    case 0: // Kills
      rows = 1;
      break;
      
    case 1: // Credits
      rows = 1;
      break;
    
    case 2: // Unlocked Ships
      rows = shipUnlock ? 1 : 0;
      break;
      
    case 3: // Weapons
      rows = [weapons count];
      break;
      
    case 4: // Equipment
      rows = [equipment count];
      break;
  }
  
  return rows;
}

- (UIView *)tableView:(UITableView *)aTableView viewForHeaderInSection:(NSInteger)section {
  NSString *text = @"";
	BOOL showThisSection = YES;
  
  switch (section) {
    case 0: // Kills
      text = @"Kills";
      break;
      
    case 1: // Credits
      text = @"Credits Earned";
      break;
      
    case 2: // Unlocked Ships
			text = @"New Ship Unlocked";
      if (!shipUnlock) showThisSection = NO;
      break;
      
    case 3: // Weapons
      text = @"Weapons Found";
			if ([weapons count] == 0) showThisSection = NO;
      break;
      
    case 4: // Equipment
      text = @"Equipment Found";
			if ([equipment count] == 0) showThisSection = NO;
      break;
  }
	
	UILabel *label = nil;
	
	if (showThisSection) {
		text = [NSString stringWithFormat:@"  %@", text];
		label = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, tableView.frame.size.width, 24)];
		label.text = text;
		label.backgroundColor = [UIColor colorWithWhite:0.25 alpha:0.5];
		label.textColor = [UIColor colorWithRed:0.6 green:0.8 blue:1.0 alpha:1.0];
		label.font = [UIFont boldSystemFontOfSize:12];
	}
	
  return [label autorelease];
}

- (UITableViewCell *)tableView:(UITableView *)aTableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  UITableViewCell *cell = [[UITableViewCell alloc] initWithFrame:CGRectZero];
  
  NSString *itemName;
  NSDictionary *itemData;
  
  NSNumberFormatter *numberFormatter = [[NSNumberFormatter alloc] init];
  [numberFormatter setFormatterBehavior:NSNumberFormatterBehavior10_4];
  [numberFormatter setNumberStyle:NSNumberFormatterDecimalStyle];
  
  switch (indexPath.section) {
    case 0: // Kills
      cell.image = [UIImage imageNamed:@"KillsIcon.png"];
      cell.text = [NSString stringWithFormat:@"%i", kills];
      cell.textColor = [UIColor redColor];
      break;
      
    case 1: // Credits
      cell.image = [UIImage imageNamed:@"MoneyIcon.png"];
      cell.text = [numberFormatter stringFromNumber:[NSNumber numberWithInt:credits]];
      cell.textColor = [UIColor greenColor];
      break;
      
    case 2:
      if (shipUnlock) {
        cell.text = shipUnlock;
        cell.image = [UIImage imageNamed:@"ShipyardTab.png"];
        cell.textColor = [UIColor colorWithRed:0.6 green:0.9 blue:1.0 alpha:1.0];
      } else {
        cell.text = @"None";
        cell.font = [UIFont italicSystemFontOfSize:cell.font.pointSize];
        cell.textColor = [UIColor grayColor];
      }
      break;
      
    case 3: // Weapons
      itemName = [weapons objectAtIndex:indexPath.row];
      itemData = [[Utility dataFile:@"Weapons"] objectForKey:itemName];
      
      cell.image = [UIImage imageNamed:[NSString stringWithFormat:@"ItemIcon.%@.png", [itemData objectForKey:@"icon"]]];
      cell.text  = itemName;
      cell.textColor = [UIColor whiteColor];
      
      break;
      
    case 4: // Equipment
      itemName = [equipment objectAtIndex:indexPath.row];
      itemData = [[Utility dataFile:@"Equipment"] objectForKey:itemName];
      
      cell.image = [UIImage imageNamed:[NSString stringWithFormat:@"ItemIcon.%@.png", [itemData objectForKey:@"icon"]]];
      cell.text  = itemName;
      cell.textColor = [UIColor whiteColor];
      
      break;
  }
  
  [numberFormatter release];
  return [cell autorelease];
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  return nil;
}

@end
