//
//  LoadoutController.m
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "WeaponsController.h"
#import "Player.h"
#import "Utility.h"

@implementation WeaponsController

// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)init {
  if (self = [super initWithNibName:@"Weapons" bundle:nil]) {
    self.title = @"Weapons";
    self.tabBarItem.image = [UIImage imageNamed:@"WeaponsTab.png"];
    [self setHelpScreenName:@"Weapons"];
    
    allItems  = [Utility dataFile:@"Weapons"];
    
    Player *player = [[Player alloc] init];
    lastSaleItems = [[NSMutableArray alloc] initWithArray:player.buybackWeapons];
    lastSaleValue = player.buybackWeaponsValue;
    [player release];
    
    [self updateBadge];
  }
  return self;
}

- (void)updateBadge {
  Player *player = [[Player alloc] init];
  if (player.newWeaponCount > 0) {
    self.tabBarItem.badgeValue = [NSString stringWithFormat:@"%i", player.newWeaponCount];
  } else {
    self.tabBarItem.badgeValue = nil;
  }
  [player release];
}

- (void)viewDidLoad {
  [super viewDidLoad];  
  groupButtons = [[NSMutableArray alloc] initWithObjects:groupAButton, groupBButton, groupCButton, nil];
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  
  Player *player = [[[Player alloc] init] autorelease];
  
  player.newWeaponCount = 0;
  [player save];
  [self updateBadge];
  
  // Load up inventory
  [inventory release];
  inventory = [[NSMutableArray alloc] initWithArray:player.weaponInventory];
  [inventory sortUsingSelector:@selector(compare:)];
  
  // Load up equipped guns
  [equipped release];
  equipped  = [[NSMutableArray alloc] initWithArray:player.guns];
  
  // Set weapon group button status
  NSMutableArray *groupA = [NSMutableArray arrayWithArray:[player.weaponGroups objectAtIndex:0]];
  NSMutableArray *groupB = [NSMutableArray arrayWithArray:[player.weaponGroups objectAtIndex:1]];
  NSMutableArray *groupC = [NSMutableArray arrayWithArray:[player.weaponGroups objectAtIndex:2]];
  [weaponGroups release];
  weaponGroups = [[NSMutableArray alloc] initWithObjects:groupA, groupB, groupC, nil];
  
  // Save available weapon energy
  //FIXME: take into account equipment
  NSDictionary *shipData = [[Utility dataFile:@"ShipTypes"] objectForKey:player.shipType];
  maxEnergy = [[shipData objectForKey:@"energy"] intValue];
}


- (void)dealloc {
  NSLog(@"Dealloc WeaponsController");
  [weaponGroups release];
  [groupButtons release];
  [super dealloc];
}

- (void)displayItem:(NSString *)aItemName {
  [super displayItem:aItemName];
  
  weaponName.text = aItemName;
  
  if ([aItemName isEqualToString:@"<Empty>"]) {
    description.text  = @"";
    shieldDmg.text    = @"";
    armorDmg.text     = @"";
    firingSpeed.text  = @"";
    speed.text        = @"";
    range.text        = @"";
    energy.text       = @"";
    value.text        = @"";
    mass.text         = @"";
    for (UIButton *button in groupButtons) button.hidden = YES;
    
    modeButton.enabled = NO;
    
  } else {
    Weapon *item = [[Weapon alloc] initWithWeaponName:aItemName];
    
    description.text  = item.description;
    shieldDmg.text    = [NSString stringWithFormat:@"%i", (int)(item.shieldDmg * item.fireRate)];
    armorDmg.text     = [NSString stringWithFormat:@"%i", (int)(item.armorDmg  * item.fireRate)];
    firingSpeed.text  = [[NSString stringWithFormat:@"%3.1f", item.fireRate] stringByReplacingOccurrencesOfString:@".0" withString:@""];
    energy.text       = [NSString stringWithFormat:@"%i", (int)(item.energy * item.fireRate)];
    value.text        = [NSString stringWithFormat:@"%i", item.value];
    mass.text         = [NSString stringWithFormat:@"%i", (int)(item.mass)];
    range.text        = [NSString stringWithFormat:@"%i", (int)(item.range)];
    
    if (item.isBeam) {
      speed.text        = @"Instant";
    } else {
      speed.text        = [NSString stringWithFormat:@"%i", (int)(item.speed * 40.0)];
      range.text        = [NSString stringWithFormat:@"%i", (int)(item.range)];
    }
    
    [item release];
    
    // Group buttons
    int indexTapped = -1;
    for (int i = 0; i < [hardpointButtons count]; i++) {
      if ([[hardpointButtons objectAtIndex:i] backgroundImageForState:UIControlStateNormal] == [UIImage imageNamed:@"EmptyHardpointSelected.png"]) {
        indexTapped = [self indexForHardpointId:i];
      }
    }
    
    if (indexTapped >= 0) {
      for (UIButton *button in groupButtons) button.hidden = NO;
      for (int i = 0; i < 3; i ++) {
        if ([[weaponGroups objectAtIndex:i] indexOfObject:[NSNumber numberWithInt:indexTapped]] == NSNotFound) {
          [[groupButtons objectAtIndex:i] setBackgroundImage:[UIImage imageNamed:@"EmptyHardpoint.png"] forState:UIControlStateNormal];
        } else {
          [[groupButtons objectAtIndex:i] setBackgroundImage:[UIImage imageNamed:@"EmptyHardpointSelected.png"] forState:UIControlStateNormal];
        }
      }
    } else {
      for (UIButton *button in groupButtons) button.hidden = YES;
    }
  }
  
}


#pragma mark Actions

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  [super tableView:tableView didSelectRowAtIndexPath:indexPath];
  for (UIButton *button in groupButtons) button.hidden = YES;
}

- (void)mountItemToIndex:(int)index {
  // Assign to all weapon groups, by default
//  for (int i = 0; i < 3; i++) {
//    [[weaponGroups objectAtIndex:i] addObject:[NSNumber numberWithInt:index]];
//  }
  
  // Save
  Player *player = [[[Player alloc] init] autorelease];
  player.weaponGroups = weaponGroups;
  player.weaponInventory = inventory;
  player.guns = equipped;
  [player save];  
}

- (IBAction)dismountItemAtIndex:(int)index {
  // Remove weapon from groups
//  for (int i = 0; i < 3; i++) {
//    [[weaponGroups objectAtIndex:i] removeObject:[NSNumber numberWithInt:index]];
//  }
  
  // Save state
  Player *player = [[[Player alloc] init] autorelease];
  player.weaponGroups = weaponGroups;
  player.weaponInventory = inventory;
  player.guns = equipped;
  [player save];
}

- (void)sellItems {
  // Sell all checked weapons
  if ([indexPathsToSell count] > 0) {
    [lastSaleItems removeAllObjects];
    lastSaleValue = 0;
    
    [self playSound:HyperspaceSoundSell];
    Player *player = [[Player alloc] init];
    for (int i = 0; i < [inventory count]; i++) {
      if ([indexPathsToSell indexOfObject:[NSIndexPath indexPathForRow:i inSection:0]] != NSNotFound) {
        NSString *name = [inventory objectAtIndex:i];
        lastSaleValue += [[[allItems objectForKey:name] objectForKey:@"value"] intValue];
        [lastSaleItems addObject:name];
        [inventory replaceObjectAtIndex:i withObject:@"<Empty>"];
      }
    }
    [inventory removeObject:@"<Empty>"];
    
    player.credits += lastSaleValue;
    player.weaponInventory = inventory;
    player.buybackWeapons = lastSaleItems;
    player.buybackWeaponsValue = lastSaleValue;
    
    [player save];
    [player release];
    
    buybackButton.enabled = YES;
    
    [indexPathsToSell removeAllObjects];
  } else {
    [self playSound:HyperspaceSoundError];
  }
}

- (IBAction)buyback:(id)sender {
  mode = ItemTableModeEquip;
  [self playSound:HyperspaceSoundSell];
  
  Player *player = [[Player alloc] init];
  player.credits -= lastSaleValue;
  
  [inventory addObjectsFromArray:lastSaleItems];
  [inventory sortUsingSelector:@selector(compare:)];
  player.weaponInventory = inventory;
  
  [indexPathsToSell removeAllObjects];
  [lastSaleItems removeAllObjects];
  
  player.buybackWeapons = lastSaleItems;
  player.buybackWeaponsValue = 0;
  
  [player save];
  [player release];

  lastSaleValue = 0;
  buybackButton.enabled = NO;
  
  [itemTable reloadData];
}

- (IBAction)assignGroup:(id)sender {
  // Play sound
  [self playSound:HyperspaceSoundWeaponGroup];
  
  // Find the group id that was tapped.
  int groupId = [groupButtons indexOfObject:sender];
  
  // Get the currently selected hardpoint button
  UIButton *selectedHardpointButton = nil;
  for (UIButton *button in hardpointButtons) {
    if ([button backgroundImageForState:UIControlStateNormal] == [UIImage imageNamed:@"EmptyHardpointSelected.png"]) {
      selectedHardpointButton = button;
    }
  }
  
  // Find the index of the gun to assign the group for
  int selectedWeaponIndex = [self indexForHardpointId:[hardpointButtons indexOfObject:selectedHardpointButton]];
  
  // Set the group
  NSMutableArray *weaponGroup = [weaponGroups objectAtIndex:groupId];
  NSNumber *indexObject = [NSNumber numberWithInt:selectedWeaponIndex];
  if ([weaponGroup indexOfObject:indexObject] == NSNotFound) {
    [weaponGroup addObject:indexObject];
  } else {
    [weaponGroup removeObject:indexObject];
  }
  
  // Save the group
  Player *player = [[Player alloc] init];
  player.weaponGroups = weaponGroups;
  [player save];
  [player release];
  
  doDoubleTap = NO;
  [self tappedEquippedItem:selectedHardpointButton];
}

- (int)itemSlots {
  Player *player = [[[Player alloc] init] autorelease];
  NSDictionary *shipData = [Utility dataFile:@"ShipTypes"];
  int hardpointCount = [[[shipData objectForKey:player.shipType] objectForKey:@"gunHardpoints"] count];
  return hardpointCount;
}

- (BOOL)shouldEquipItem:(NSString *)itemName {
  int requiredEnergy = [[[allItems objectForKey:itemName] objectForKey:@"energy"] intValue];
  
  if (requiredEnergy <= maxEnergy) {
    return YES;
  } else {
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Not enough energy"
                                                    message:[NSString stringWithFormat:@"Your ship needs at least %i energy to fire the %@, but it only has %i.", requiredEnergy, itemName, maxEnergy]
                                                   delegate:nil
                                          cancelButtonTitle:@"OK"
                                          otherButtonTitles:nil];
    [alert show];
    [alert release];
    return NO;
  }
}

- (IBAction)sellItem:(id)sender {
  int itemIndex           = [itemTable indexPathForSelectedRow].row;
  NSString *itemName      = [inventory objectAtIndex:itemIndex];
  NSDictionary *itemData  = [allItems objectForKey:itemName];
  int itemValue           = [[itemData objectForKey:@"value"] intValue];
  
  [self playSound:HyperspaceSoundSell];
  
  Player *player = [[Player alloc] init];
  
  [inventory removeObjectAtIndex:itemIndex];  
  [lastSaleItems removeAllObjects];
  [lastSaleItems addObject:itemName];
  lastSaleValue = itemValue;
  
  [player.weaponInventory removeAllObjects];
  [player.weaponInventory addObjectsFromArray:inventory];
  [player.buybackWeapons removeAllObjects];
  [player.buybackWeapons addObjectsFromArray:lastSaleItems];
  player.buybackWeaponsValue = itemValue;
  
  player.credits += itemValue;
  
  [player save];
  [player release];
  
  buybackButton.enabled = YES;
  [itemTable reloadData];
  
  if (itemIndex < [inventory count]) {
    [self displayItem:[inventory objectAtIndex:itemIndex]];
  } else {
    supressNextSelectSound = YES;
    [self tappedEquippedItem:[hardpointButtons objectAtIndex:[self hardpointIdForIndex:0]]];
  }
  
}

- (IBAction)toggleHelp:(id)sender {
  helpScreen.hidden = !helpScreen.hidden;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"itemTableCell"];
  
  if (cell == nil) {
    // Cell
    cell = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"itemTableCell"] autorelease];
    cell.font = [UIFont systemFontOfSize:14];
    cell.textColor = [UIColor whiteColor];
    
    // Equip button
    UIButton *equipButton = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 26, 40)];
    [equipButton setImage:[UIImage imageNamed:@"EquipAccessory.png"] forState:UIControlStateNormal];
    [equipButton addTarget:self action:@selector(tappedEquipButton:) forControlEvents:UIControlEventTouchUpInside];
    equipButton.adjustsImageWhenHighlighted = NO;
    cell.accessoryView = equipButton;
    [equipButton release];
    
    // background
    UIView *background = [[UIView alloc] initWithFrame:CGRectZero];
    cell.backgroundView = background;
    [background release];
  }
  
  // Weapon
  Weapon *item = [[Weapon alloc] initWithWeaponName:[inventory objectAtIndex:indexPath.row]];
  
  // Item name
  cell.text = item.name;
  
  // Item Icon
  cell.image = [UIImage imageNamed:[NSString stringWithFormat:@"ItemIcon.%@.png", item.iconName]];
  
  // Release Item
  [item release];
  
  // zebra stripes
  cell.backgroundView.backgroundColor = [UIColor colorWithWhite:(indexPath.row % 2 == 0 ? 0.2 : 0.25) alpha:1.0];
  
  // return the cell
  return cell;
}

@end
