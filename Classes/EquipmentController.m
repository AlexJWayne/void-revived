//
//  EquipmentController.m
//  Void
//
//  Created for VOID on 10/2/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "EquipmentController.h"
#import "Utility.h"

static NSDictionary *masterEquipmentDictionary;

@implementation EquipmentController

+ (void)initialize {
  masterEquipmentDictionary = [Utility dataFile:@"Equipment"];;
}

NSInteger sortEquipment(id a, id b, void *context) {
  NSDictionary *allEquipment = masterEquipmentDictionary;
  NSDictionary *firstItem = [allEquipment objectForKey:(NSString *)a];
  NSDictionary *otherItem = [allEquipment objectForKey:(NSString *)b];
  
  NSString *firstString = [NSString stringWithFormat:@"%@ - %@", [firstItem objectForKey:@"icon"], [firstItem objectForKey:@"groupName"]];
  NSString *otherString = [NSString stringWithFormat:@"%@ - %@", [otherItem objectForKey:@"icon"], [otherItem objectForKey:@"groupName"]];
  
  NSInteger result = [firstString compare:otherString];
  if (result == NSOrderedSame) {
    int firstPrice = [[firstItem objectForKey:@"value"] floatValue];
    int otherPrice = [[otherItem objectForKey:@"value"] floatValue];
    
    if (firstPrice > otherPrice) {
      return NSOrderedAscending; 
    } else if (firstPrice < otherPrice) {
      return NSOrderedDescending;
    } else {
      return [(NSString *)a compare:(NSString *)b];
    }
    
  } else {
    return result;
  }
}

// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)init {
  if (self = [super initWithNibName:@"Equipment" bundle:nil]) {
    self.title = @"Equipment";
    self.tabBarItem.image = [UIImage imageNamed:@"EquipmentTab.png"];
    [self setHelpScreenName:@"Equipment"];
    
    allItems  = [Utility dataFile:@"Equipment"];
    
    Player *player = [[[Player alloc] init] autorelease];
    lastSaleItems = [[NSMutableArray alloc] initWithArray:player.buybackEquipment];
    lastSaleValue = player.buybackEquipmentValue;
    
    [self updateBadge];
  }
  return self;
}

- (void)updateBadge {
  Player *player = [[Player alloc] init];
  if (player.newEquipmentCount > 0) {
    self.tabBarItem.badgeValue = [NSString stringWithFormat:@"%i", player.newEquipmentCount];
  } else {
    self.tabBarItem.badgeValue = nil;
  }
  [player release];
}

- (void)dealloc {
  NSLog(@"Dealloc EquipmentController");
  [super dealloc];
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  
  Player *player = [[[Player alloc] init] autorelease];
  
  player.newEquipmentCount = 0;
  self.tabBarItem.badgeValue = nil;
  [player save];
  
  // Load up inventory
  [inventory release];
  inventory = [[NSMutableArray alloc] initWithArray:player.equipmentInventory];
  [inventory sortUsingFunction:sortEquipment context:NULL];
  
  // Load up equipped guns
  [equipped release];
  equipped  = [[NSMutableArray alloc] initWithArray:player.equipment];
}

- (void)displayItem:(NSString *)aItemName {
  [super displayItem:aItemName];
  
  equipmentName.text = aItemName;
  
  if ([aItemName isEqualToString:@"<Empty>"]) {
    description.text  = @"";
    valueLabel.text   = @"";
  } else {
    NSDictionary *itemData = [allItems objectForKey:aItemName];
    description.text  = [itemData objectForKey:@"description"];
    valueLabel.text = [[itemData objectForKey:@"value"] stringValue];
  }
  
  [effectsTable reloadData];
}

- (int)itemSlots {
  Player *player = [[[Player alloc] init] autorelease];
  NSDictionary *shipData = [Utility dataFile:@"ShipTypes"];
  int hardpointCount = [[[shipData objectForKey:player.shipType] objectForKey:@"equipmentSlots"] intValue];
  return hardpointCount;
}

- (void)mountItemToIndex:(int)index {
  Player *player = [[[Player alloc] init] autorelease];
  player.equipmentInventory = inventory;
  player.equipment = equipped;
  [player save];  
}

- (IBAction)dismountItemAtIndex:(int)index {
  Player *player = [[[Player alloc] init] autorelease];
  player.equipmentInventory = inventory;
  player.equipment = equipped;
  [player save];
}

- (void)sellItems {
  // Sell all checked items
  if ([indexPathsToSell count] > 0) {
    [lastSaleItems removeAllObjects];
    lastSaleValue = 0;
    
    [self playSound:HyperspaceSoundSell];
    Player *player = [[[Player alloc] init] autorelease];
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
    player.equipmentInventory = inventory;
    player.buybackEquipment = lastSaleItems;
    player.buybackEquipmentValue = lastSaleValue;
    
    [player save];
    
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
  [inventory sortUsingFunction:sortEquipment context:NULL];
  player.equipmentInventory = inventory;
  
  [indexPathsToSell removeAllObjects];
  [lastSaleItems removeAllObjects];
  
  player.buybackEquipment = lastSaleItems;
  player.buybackEquipmentValue = 0;
  
  [player save];
  [player release];
  
  lastSaleValue = 0;
  buybackButton.enabled = NO;
  
  [itemTable reloadData];
}

- (BOOL)shouldEquipItem:(NSString *)itemName {
  // Ensure that there is only 1 equipment per group
  NSString *groupToEquip = [[allItems objectForKey:itemName] objectForKey:@"groupName"];
  
  for (NSString *item in equipped) {
    NSString *equippedGroup = [[allItems objectForKey:item] objectForKey:@"groupName"];
    if ([groupToEquip isEqualToString:equippedGroup]) {
      UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Duplicate Equipment Type"
                                                      message:[NSString stringWithFormat:@"You may only have a one item from an equipment group at a time.  Dequip your \"%@\" to install this item.", item]
                                                     delegate:nil
                                            cancelButtonTitle:@"OK"
                                            otherButtonTitles:nil];
      [alert show];
      [alert release];
      return NO;      
    }
  }
  
  return YES;
}





// Detail table view methods
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
  if (tableView == effectsTable) {
    return [[[allItems objectForKey:equipmentName.text] objectForKey:@"effects"] count];
  } else {
    return [super tableView:tableView numberOfRowsInSection:section];
  }
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  if (tableView == effectsTable) {
    NSString *itemName = equipmentName.text;
    NSDictionary *effect = [[[allItems objectForKey:itemName] objectForKey:@"effects"] objectAtIndex:indexPath.row];
    int effectValue = (int)round(([[effect objectForKey:@"amount"] floatValue] * 100.0));
    NSString *statId = [effect objectForKey:@"stat"];
    NSString *statName;
    BOOL positiveIsGood;
    
    // Get user friendly stat name
    
    // -- Movement
    if ([statId isEqualToString:@"mass"]) {
      statName = @"Mass";
      positiveIsGood = NO;
    } else if ([statId isEqualToString:@"thrusterForce"]) {
      statName = @"Acceleration";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"maxSpeed"]) {
      statName = @"Max Speed";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"turnSpeed"]) {
      statName = @"Turn Speed";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"brakeForce"]) {
      statName = @"Braking";
      positiveIsGood = YES;
    }
    
    // -- Defense
    else if ([statId isEqualToString:@"shields"]) {
      statName = @"Shields";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"shieldRecharge"]) {
      statName = @"Shield Recharge";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"armor"]) {
      statName = @"Armor";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"armorRecharge"]) {
      statName = @"Armor Regeneration";
      positiveIsGood = YES;
    }
    
    // -- Offense
    else if ([statId isEqualToString:@"energy"]) {
      statName = @"Weapon Energy";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"energyRecharge"]) {
      statName = @"Energy Recharge";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"shieldDmg"]) {
      statName = @"Shields Damage";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"armorDmg"]) {
      statName = @"Armor Damage";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"projectileSpeed"]) {
      statName = @"Projectile Speed";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"range"]) {
      statName = @"Weapon Range";
      positiveIsGood = YES;
    } else if ([statId isEqualToString:@"coolDown"]) {
      statName = @"Weapon Cooldown";
      positiveIsGood = NO;
    } else if ([statId isEqualToString:@"spread"]) {
      statName = @"Weapon Spread";
      positiveIsGood = NO;
    } else if ([statId isEqualToString:@"seekTurnSpeed"]) {
      statName = @"Projectile Seeking";
      positiveIsGood = YES;
    }
    
    
    // Create Cell
    UITableViewCell *cell = [[UITableViewCell alloc] initWithFrame:CGRectZero];
    cell.text = statName;
    cell.font = [UIFont systemFontOfSize:14];
    cell.textColor = [UIColor whiteColor];
    
    
    // Add value as accessory
    UILabel *accessory = [[UILabel alloc] initWithFrame:CGRectMake(0.0, 0.0, 60.0, 20.0)];
    accessory.font = [UIFont boldSystemFontOfSize:16];
    accessory.textAlignment = UITextAlignmentRight;
    accessory.userInteractionEnabled = NO;
    accessory.backgroundColor = [UIColor clearColor];
    accessory.adjustsFontSizeToFitWidth = YES;
    accessory.minimumFontSize = 12;
    
    if (effectValue > 0) {
      accessory.text = [NSString stringWithFormat:@"+ %i%%", effectValue];
    } else {
      accessory.text = [NSString stringWithFormat:@"- %i%%", -effectValue];
    }
    
    // Colorize by value
    if ((positiveIsGood && effectValue > 0) || (!positiveIsGood && effectValue < 0)) {
      accessory.textColor = [UIColor greenColor];
    } else {
      accessory.textColor = [UIColor redColor];
    }
    
    cell.accessoryView = accessory;
    cell.userInteractionEnabled = NO;
    
    
    // Color Background
    UIView *background = [[UIView alloc] initWithFrame:CGRectZero];
    if (indexPath.row % 2 == 0) {
      background.backgroundColor = [UIColor colorWithWhite:0.05 alpha:1.0];
    } else {
      background.backgroundColor = [UIColor colorWithWhite:0.06 alpha:1.0];
    }
    cell.backgroundView = background;
    [background release];
    
    return [cell autorelease];
  }
  
  // Not the effects detail table
  return [super tableView:tableView cellForRowAtIndexPath:indexPath];
}

- (IBAction)dismountItem:(id)sender {
  [super dismountItem:sender];
  [inventory sortUsingFunction:sortEquipment context:NULL];
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
  
  [player.equipmentInventory removeAllObjects];
  [player.equipmentInventory addObjectsFromArray:inventory];
  [player.buybackEquipment removeAllObjects];
  [player.buybackEquipment addObjectsFromArray:lastSaleItems];
  player.buybackEquipmentValue = itemValue;
  
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

@end
