//
//  ShipyardController.m
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "ShipyardController.h"

static NSDictionary *masterShipDictionary;

@implementation ShipyardController

#define DOUBLE_TAP_TIME 0.5

+ (void)initialize {
  masterShipDictionary = [Utility dataFile:@"ShipTypes"];
}

NSInteger sortShips(id a, id b, void *context) {
  NSDictionary *ships = masterShipDictionary;
  int firstPrice  = [[[ships objectForKey:(NSString *)a] objectForKey:@"price"] intValue];
  int secondPrice = [[[ships objectForKey:(NSString *)b] objectForKey:@"price"] intValue];
  
  if (firstPrice > secondPrice) {
    return NSOrderedAscending;
  } else if (firstPrice < secondPrice) {
    return NSOrderedDescending;
  } else {
    return [(NSString *)a compare:(NSString *)b];
  }
}

// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)init {
  if (self = [super initWithNibName:@"Shipyard" bundle:nil]) {
    self.title = @"Shipyard";
    self.tabBarItem.image = [UIImage imageNamed:@"ShipyardTab.png"];
    [self setHelpScreenName:@"Shipyard"];
    
    numberFormatter = [[NSNumberFormatter alloc] init];
    [numberFormatter setFormatterBehavior:NSNumberFormatterBehavior10_4];
    [numberFormatter setNumberStyle:NSNumberFormatterDecimalStyle];
    
    selectSounds = [[NSArray alloc] initWithObjects:
                    [[[SoundEffect alloc] initWithName:@"Select" looping:NO] autorelease],
                    [[[SoundEffect alloc] initWithName:@"Select" looping:NO] autorelease],
                    [[[SoundEffect alloc] initWithName:@"Select" looping:NO] autorelease],
                    nil];
    
    pilotableShips = [Utility dataFile:@"ShipTypes"];
    pilotableShipNames = [[NSMutableArray alloc] init];
    
    Player *player = [[[Player alloc] init] autorelease];
    if (player.newShipCount > 0) self.tabBarItem.badgeValue = [NSString stringWithFormat:@"%i", player.newShipCount];
    
    for (NSString *shipName in [pilotableShips allKeys]) {
      NSDictionary *shipData = [pilotableShips objectForKey:shipName];
      BOOL isPilotable = [[shipData objectForKey:@"pilotable"] boolValue];
      BOOL isPurchasable = NO;
      BOOL isOwned = [player.ownedShips containsObject:shipName];
      
      if ([shipData objectForKey:@"unlockStages"]) {
        if ([[shipData objectForKey:@"unlockStages"] count] == 0) {
          isPurchasable = YES;
        } else {
          for (NSString *completedStageName in player.completedStages) {
            for (NSString *unlockStageName in [shipData objectForKey:@"unlockStages"]) {
              if ([completedStageName isEqualToString:unlockStageName]) isPurchasable = YES;
            }
          }
        }
      }
      
      if ((isPilotable && isPurchasable) || isOwned) [pilotableShipNames addObject:shipName];
    }
    
    [pilotableShipNames sortUsingFunction:sortShips context:NULL];
  }
  return self;
}


/*
// Implement loadView to create a view hierarchy programmatically.
- (void)loadView {
}
*/

- (void)viewDidAppear:(BOOL)animated {
  Player *player = [[Player alloc] init];
  player.newShipCount = 0;
  [player save];
  
  [shipPreview startAnimation];
  
  int row = [pilotableShipNames indexOfObject:player.shipType];
  if (row == NSNotFound) row = 0;
  [shipsTable selectRowAtIndexPath:[NSIndexPath indexPathForRow:row inSection:0] animated:NO scrollPosition:UITableViewScrollPositionNone];
  [self displayShipAtIndex:row];
  
  credits.text = [numberFormatter stringFromNumber:[NSNumber numberWithInt:player.credits]];
  
  self.tabBarItem.badgeValue = nil;
  
  if ([player.shipType isEqualToString:@"<Empty>"]) {
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"You need a ship"
                                                    message:@"You should have just enough credits for a small shuttle. Buy one here in the shipyard."
                                                   delegate:nil
                                          cancelButtonTitle:@"OK, I'll get one"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
  }
  
  [player release];
}

- (void)viewWillDisappear:(BOOL)animated {
  [shipPreview stopAnimation];
  [super viewDidDisappear:animated];
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
  NSLog(@"Dealloc shipyardController");
  [selectSounds release];
  //[pilotableShips release];
  [numberFormatter release];
  
  [super dealloc];
}

#pragma mark Actions
- (IBAction)buyShip:(id)sender {
  Player *player = [[Player alloc] init];
  
  BOOL firstShip = ([player.ownedShips count] == 0);
  
  NSString *shipType = [pilotableShipNames objectAtIndex:[shipsTable indexPathForSelectedRow].row];
  NSDictionary *aTemplate = [pilotableShips objectForKey:shipType];
  int shipPrice = [[aTemplate objectForKey:@"price"] intValue];
  
  NSLog(@"credits:   %i", player.credits);
  NSLog(@"shipPrice: %i", shipPrice);
  
  BOOL ownsThisShip = [player.ownedShips indexOfObject:shipType] != NSNotFound;
  
  if (player.credits >= shipPrice || ownsThisShip) {
    // Has the money
    
    [self playSound:HyperspaceSoundBuyShip];
    
    if (!ownsThisShip) {
      // Buy the ship
      player.credits -= shipPrice;
      [player.ownedShips addObject:shipType];
    }
    
    player.shipType = shipType;
    
    if (firstShip) {
      NSString *race = [[shipType componentsSeparatedByString:@" "] objectAtIndex:0];
      if      ([race isEqual:@"Cyber"])   [player.weaponInventory addObject:@"Genjuro Blaster"];
      else if ([race isEqual:@"Crystal"]) [player.weaponInventory addObject:@"Edge"];
      else if ([race isEqual:@"Organic"]) [player.weaponInventory addObject:@"Spine Hurler"];
      else if ([race isEqual:@"Energy"])  [player.weaponInventory addObject:@"Mining Laser"];
    }
    
    
    // Remove all weapons
    for (NSString *gun in player.guns) {
      if (![gun isEqualToString:@"<Empty>"]) [player.weaponInventory addObject:gun];
    }
    player.guns = [[[NSMutableArray alloc] init] autorelease];
    NSMutableArray *groupArray = [NSMutableArray array];
    for (int i = 0; i < [[aTemplate objectForKey:@"gunHardpoints"] count]; i++) {
      [player.guns addObject:@"<Empty>"];
      [groupArray addObject:[NSNumber numberWithInt:i]];
    }
    player.weaponGroups = [NSArray arrayWithObjects:
                           [NSArray arrayWithArray:groupArray],
                           [NSArray arrayWithArray:groupArray],
                           [NSArray arrayWithArray:groupArray],
                           nil];
    
    
    // Remove all equipment
    for (NSString *equipment in player.equipment) {
      if (![equipment isEqualToString:@"<Empty>"]) [player.equipmentInventory addObject:equipment];
    }
    player.equipment = [[[NSMutableArray alloc] init] autorelease];
    for (int i = 0; i < [[aTemplate objectForKey:@"equipmentSlots"] intValue]; i++) [player.equipment addObject:@"<Empty>"];
    
    [player save];
    
    [shipsTable reloadData];
    credits.text = [numberFormatter stringFromNumber:[NSNumber numberWithInt:player.credits]];
    [self displayShipAtIndex:[shipsTable indexPathForSelectedRow].row];
  } else {
    // Needs to trade in
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Trade In"
                                                    message:@"You must trade in your owned ships to have enough credits to buy this ship.  Do you want to trade in all ships now?"
                                                   delegate:self
                                          cancelButtonTitle:@"Cancel"
                                          otherButtonTitles:@"Buy Ship", nil];
    [alert show];
    [alert release];
  }
  
  [player release];
}

- (IBAction)sellShip:(id)sender {
  Player *player = [[Player alloc] init];
  NSString *shipType = [pilotableShipNames objectAtIndex:[shipsTable indexPathForSelectedRow].row];
  
  if (sender != nil) [self playSound:HyperspaceSoundSell];
  NSDictionary *aTemplate = [pilotableShips objectForKey:shipType];
  
  [player.ownedShips removeObject:shipType];
  player.credits = player.credits + (int)([[aTemplate objectForKey:@"price"] floatValue] * 0.75);
  [player save];
  
  credits.text = [numberFormatter stringFromNumber:[NSNumber numberWithInt:player.credits]];
  [shipsTable reloadData];
  [self displayShipAtIndex:[shipsTable indexPathForSelectedRow].row];    
  
  [player release];
}

- (void)displayShipAtIndex:(int)index {
  NSString *shipName = [pilotableShipNames objectAtIndex:index];
  NSDictionary *aTemplate = [pilotableShips objectForKey:shipName];
  Player *player = [[[Player alloc] init] autorelease];
  
  NSString *shipRace = [[shipName componentsSeparatedByString:@" "] objectAtIndex:0];
  if      ([shipRace isEqualToString:@"Cyber"])   shipRace = @"Cykan";
  else if ([shipRace isEqualToString:@"Crystal"]) shipRace = @"Orthos";
  else if ([shipRace isEqualToString:@"Organic"]) shipRace = @"Wrethk";
  else if ([shipRace isEqualToString:@"Energy"])  shipRace = @"Lanaar";
  
  float frameRate = 40.0;
  
  [selectedShipIndexPath release];
  selectedShipIndexPath = [[NSIndexPath indexPathForRow:[pilotableShipNames indexOfObject:shipName] inSection:0] retain];
  
  shipNameLabel.text= [NSString stringWithFormat:@"%@ %@", shipRace, [aTemplate objectForKey:@"name"]];
  
  shields.text      = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"shields"] intValue]];
  shieldRegen.text  = [NSString stringWithFormat:@"%i", (int)([[aTemplate objectForKey:@"shieldRecharge"] floatValue] * frameRate)];
  shieldDelay.text  = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"shieldRechargeDelay"] intValue]];
  armor.text        = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"armor"] intValue]];
  energy.text       = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"energy"] intValue]];
  recharge.text     = [NSString stringWithFormat:@"%i", (int)([[aTemplate objectForKey:@"energyRecharge"] floatValue] * frameRate)];
  gunMounts.text    = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"gunHardpoints"] count]];
  equipmentMounts.text = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"equipmentSlots"] intValue]];
  
  maxSpeed.text     = [NSString stringWithFormat:@"%i", (int)([[aTemplate objectForKey:@"maxSpeed"] floatValue] * frameRate)];
  thrust.text       = [NSString stringWithFormat:@"%i", (int)([[aTemplate objectForKey:@"thrusterForce"] floatValue] * 1000.0)];
  braking.text      = [NSString stringWithFormat:@"%i", (int)([[aTemplate objectForKey:@"brakeForce"] floatValue] * 1000.0)];
  mass.text         = [NSString stringWithFormat:@"%i", [[aTemplate objectForKey:@"mass"] intValue]];
  turnSpeed.text    = [NSString stringWithFormat:@"%i", (int)([[aTemplate objectForKey:@"turnSpeed"] floatValue] * frameRate)];
  
  price.text        = [numberFormatter stringFromNumber:[aTemplate objectForKey:@"price"]];
  
  buyButton.enabled = YES;
  sellButton.hidden = YES;
  
  if ([player.ownedShips indexOfObject:shipName] != NSNotFound) {
    // Player owns this ship
    if ([player.shipType isEqualToString:shipName]) buyButton.enabled = NO;
    [buyButton setTitle:@"Pilot Ship" forState:UIControlStateNormal];
    [buyButton setTitle:@"Pilot Ship" forState:UIControlStateHighlighted];
    [buyButton setTitle:@"Pilot Ship" forState:UIControlStateDisabled];
    
    NSNumber *sellPrice = [NSNumber numberWithFloat:[[aTemplate objectForKey:@"price"] floatValue] * 0.75];
    price.alpha = 0.5;
    price.text  = [numberFormatter stringFromNumber:sellPrice];
    
    priceLabel.text = @"Sell Value:";
    sellButton.hidden = NO;
    
  } else {
    // Player can buy this ship?
    if (player.credits + [self tradeInValue] < [[aTemplate objectForKey:@"price"] intValue]) {
      buyButton.enabled = NO;
    }
    
    [buyButton setTitle:@"Buy Ship" forState:UIControlStateNormal];
    [buyButton setTitle:@"Buy Ship" forState:UIControlStateHighlighted];
    [buyButton setTitle:@"Buy Ship" forState:UIControlStateDisabled];
    price.alpha = 1.0;
    priceLabel.text = @"Price:";
  }
  
  if ([player.shipType isEqualToString:shipName]) sellButton.hidden = YES;
  
  [shipPreview displayShipNamed:shipName];
}

- (void)timeoutDoubleTap:(NSTimer *)timer {
  doDoubleTap = NO;
}

- (void)addShipsFromStage:(NSString *)stageName {
  Player *player = [[Player alloc] init];
  
  for (NSString *shipName in [pilotableShips allKeys]) {
    NSDictionary *shipData = [pilotableShips objectForKey:shipName];
    BOOL isPilotable = [[shipData objectForKey:@"pilotable"] boolValue];
    BOOL isPurchasable = NO;
    BOOL isNotAleadyPurchasable = NO;
    
    if ([shipData objectForKey:@"unlockStages"]) {
      for (NSString *unlockStageName in [shipData objectForKey:@"unlockStages"]) {
        if ([stageName isEqualToString:unlockStageName]) isPurchasable = YES;
      }
    }
    
    if ([pilotableShipNames indexOfObject:shipName] == NSNotFound) isNotAleadyPurchasable = YES;
    
    if (isPilotable && isPurchasable && isNotAleadyPurchasable) {
      [pilotableShipNames addObject:shipName];
      player.newShipCount = player.newShipCount + 1;
    }
  }
  
  [pilotableShipNames sortUsingFunction:sortShips context:NULL];
  [shipsTable reloadData];
  
  if (player.newShipCount > 0) self.tabBarItem.badgeValue = [NSString stringWithFormat:@"%i", player.newShipCount];
  [player save];
  [player release];
}


- (int)tradeInValue {
  Player *player = [[Player alloc] init];
  float value = 0.0;
  for (NSString *shipName in player.ownedShips) {
    value += [[[pilotableShips objectForKey:shipName] objectForKey:@"price"] floatValue] * 0.75;
  }
  [player release];
  
  return (int)value;
}

#pragma mark TableView Methods
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
  NSArray *names = pilotableShipNames;
  return [names count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  NSArray *names = pilotableShipNames;
  NSDictionary *allShips = [Utility dataFile:@"ShipTypes"];
  
  UITableViewCell *cell = [[[UITableViewCell alloc] initWithFrame:CGRectZero] autorelease];
  cell.text = [[allShips objectForKey:[names objectAtIndex:indexPath.row]] objectForKey:@"name"];
  cell.font = [UIFont boldSystemFontOfSize:16];
  cell.textColor = [UIColor whiteColor];
  
  UIView *background = [[UIView alloc] initWithFrame:CGRectZero];
  if (indexPath.row % 2 == 0) {
    background.backgroundColor = [UIColor colorWithWhite:0.2 alpha:1.0];
  } else {
    background.backgroundColor = [UIColor colorWithWhite:0.25 alpha:1.0];
  }
  cell.backgroundView = background;
  [background release];
  
  Player *player = [[Player alloc] init];
  
  BOOL pilotingShip = ([pilotableShipNames indexOfObject:player.shipType] == indexPath.row);
  BOOL ownsShip     = ([player.ownedShips indexOfObject:[names objectAtIndex:indexPath.row]] != NSNotFound);
  
  if (pilotingShip) {
    cell.image = [UIImage imageNamed:@"CheckmarkAccessory.png"];
  } else if (ownsShip) {
    cell.image = [UIImage imageNamed:@"ShipOwnedAccessory.png"];
  } else {
    cell.image = [UIImage imageNamed:@"ShipUnownedAccessory.png"];
  }
  [player release];
  
  return cell;
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  Player *player = [[Player alloc] init];
  
  BOOL isSameRow = (indexPath == [shipsTable indexPathForSelectedRow]);
  BOOL playerOwnsShip = ([player.ownedShips indexOfObject:[pilotableShipNames objectAtIndex:indexPath.row]] != NSNotFound);
  BOOL playerIsPilotingThisShip = [player.shipType isEqualToString:[pilotableShipNames objectAtIndex:indexPath.row]];
  
  if (doDoubleTap && isSameRow && playerOwnsShip && !playerIsPilotingThisShip) {
    doDoubleTap = NO;
    [self buyShip:nil];
  } else {
    doDoubleTap = YES;
    [NSTimer scheduledTimerWithTimeInterval:DOUBLE_TAP_TIME target:self selector:@selector(timeoutDoubleTap:) userInfo:nil repeats:NO];
  }
  [player release];
  
  return indexPath;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  [(SoundEffect*)[selectSounds objectAtIndex:lastSelectSoundIndex] play];
  lastSelectSoundIndex++;
  if (lastSelectSoundIndex >= [selectSounds count]) lastSelectSoundIndex = 0;
  
  [self displayShipAtIndex:indexPath.row];
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
  [shipsTable selectRowAtIndexPath:selectedShipIndexPath animated:NO scrollPosition:UITableViewScrollPositionNone];
}

- (IBAction)toggleHelp:(id)sender {
  helpScreen.hidden = !helpScreen.hidden;
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex {
  if (buttonIndex == 1) {
    int trade = [self tradeInValue];
    NSArray *ownedShips;
    
    Player *player;
    
    player = [[Player alloc] init];
    ownedShips = [NSArray arrayWithArray:player.ownedShips];
    player.credits += trade;
    [player save];
    [player release];
    
    [self buyShip:nil];
    
    NSIndexPath *justBoughtShipIndexPath = [shipsTable indexPathForSelectedRow];
    NSString *justBoughtShipName = [pilotableShipNames objectAtIndex:justBoughtShipIndexPath.row];
    
    for (NSString *shipName in ownedShips) {
      if (![shipName isEqualToString:justBoughtShipName]) {
        int indexOfShipToSell = [pilotableShipNames indexOfObject:shipName];
        [shipsTable selectRowAtIndexPath:[NSIndexPath indexPathForRow:indexOfShipToSell inSection:0] animated:NO scrollPosition:UITableViewScrollPositionNone];
        [self sellShip:nil];
      }
    }
    
    player = [[Player alloc] init];
    player.credits -= trade;
    [player save];
    
    [shipsTable reloadData];
    [shipsTable selectRowAtIndexPath:justBoughtShipIndexPath animated:NO scrollPosition:UITableViewScrollPositionNone];
    [self displayShipAtIndex:justBoughtShipIndexPath.row];
    credits.text = [NSString stringWithFormat:@"%i", player.credits];
    
    [player release];
  }
}

@end
