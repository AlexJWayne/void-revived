//
//    ItemController.m
//    Void
//
//    Created for VOID on 11/7/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "ItemController.h"


@implementation ItemController

#define DOUBLE_TAP_TIME 0.5

// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        
        // TODO: these are deprecated, weed them out
        mode = ItemTableModeEquip;
        enterSellModeSound = [[SoundEffect effectNamed:@"ChimeIn" looping:NO] retain];
        sellSelectSound = [[SoundEffect effectNamed:@"SelectSell" looping:NO] retain];
        sellDeselectSound = [[SoundEffect effectNamed:@"DeselectSell" looping:NO] retain];
        // ---
        
        selectSounds = [[NSArray    alloc] initWithObjects:
                                        [[[SoundEffect alloc] initWithName:@"Select" looping:NO] autorelease],
                                        [[[SoundEffect alloc] initWithName:@"Select" looping:NO] autorelease],
                                        [[[SoundEffect alloc] initWithName:@"Select" looping:NO] autorelease],
                                        nil];
        
        indexPathsToSell = [[NSMutableArray alloc] init];
    }
    return self;
}



// Implement viewDidLoad to do additional setup after loading the view.
- (void)viewDidLoad {
    [super viewDidLoad];
    hardpointButtons = [[NSMutableArray alloc] initWithObjects:hardpoint1, hardpoint2, hardpoint3, hardpoint4, hardpoint5, nil];
}

- (void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear:animated];
    
    
    Player *player = [[Player alloc] init];
    if ([player.shipType isEqualToString:@"<Empty>"]) {
        [self displayItem:@"<Empty>"];
        [[[[UIAlertView alloc] initWithTitle:@"No Ship"
                                     message:@"Go to the shipyard to purchase your first ship."
                                    delegate:nil
                           cancelButtonTitle:@"OK"
                           otherButtonTitles:nil] autorelease] show];
    } else {
        // Select first equipped slot
        supressNextSelectSound = YES;
        [self tappedEquippedItem:[hardpointButtons objectAtIndex:[self hardpointIdForIndex:0]]];
        
        // Set buyback button state
        buybackButton.enabled = [lastSaleItems count] > 0;
        
        // Redraw table
        [itemTable reloadData];
        [self updateHardpoints];        
    }
    [player release];    
}

- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    [indexPathsToSell removeAllObjects];
    mode = ItemTableModeEquip;
//    [modeButton setTitle:@"Start Selling" forState:UIControlStateNormal];
//    [modeButton setTitle:@"Start Selling" forState:UIControlStateHighlighted];
//    [modeButton setImage:nil forState:UIControlStateNormal];
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
    [selectSounds release];
    [enterSellModeSound release];
    [sellSelectSound release];
    [sellDeselectSound release];
    
    [indexPathsToSell release];
    [selectedIndexPath release];
    
    [lastSaleItems release];
    
    [allItems release];
    [inventory release];
    [equipped release];
    
    [hardpointButtons release];
    [doubleTapTimer release];
    
    [super dealloc];
}

- (void)playSelectSound {
    if (!supressNextSelectSound) [(SoundEffect*)[selectSounds objectAtIndex:lastSelectSoundIndex] play];
    supressNextSelectSound = NO;
    lastSelectSoundIndex++;
    if (lastSelectSoundIndex >= [selectSounds count]) lastSelectSoundIndex = 0;
}

- (void)reset {
	
}

#pragma mark Event Handlers
- (void)swapMode:(id)sender {
//    [selectedIndexPath release];
//    selectedIndexPath = nil;
//    
//    [itemTable deselectRowAtIndexPath:[itemTable indexPathForSelectedRow] animated:YES];
//    
//    if (mode == ItemTableModeEquip) {
//        // Enter sell mode
//        mode = ItemTableModeSell;
//        [enterSellModeSound play];
//        [modeButton setTitle:@"Sell Items" forState:UIControlStateNormal];
//        [modeButton setTitle:@"Sell Items" forState:UIControlStateHighlighted];
//        [modeButton setImage:[UIImage imageNamed:@"SellAccessory.png"] forState:UIControlStateNormal];
//        [self displayItem:@"<Empty>"];
//        
//    } else {
//        // Exit sell mode
//        mode = ItemTableModeEquip;
//        [modeButton setTitle:@"Start Selling" forState:UIControlStateNormal];
//        [modeButton setTitle:@"Start Selling" forState:UIControlStateHighlighted];
//        [modeButton setImage:nil forState:UIControlStateNormal];
//        buybackButton.enabled = [lastSaleItems count] > 0;
//        [self displayItem:@"<Empty>"];
//        [self sellItems];
//    }
//    
//    [itemTable reloadData];
}

- (IBAction)tappedEquippedItem:(id)sender {
    BOOL wasPreviouslySelected;
    
    if ([(UIButton *)sender backgroundImageForState:UIControlStateNormal] == [UIImage imageNamed:@"EmptyHardpointSelected.png"]) {
        wasPreviouslySelected = YES;
    } else {
        [self playSelectSound];
        wasPreviouslySelected = NO;
    }
    
    if ([itemTable indexPathForSelectedRow]) [itemTable deselectRowAtIndexPath:[itemTable indexPathForSelectedRow] animated:NO];
    [selectedIndexPath release];
    selectedIndexPath = nil;
    
    int idTapped = -1;
    for (int i = 0; i <    [hardpointButtons count]; i++) {
        [[hardpointButtons objectAtIndex:i] setBackgroundImage:[UIImage imageNamed:@"EmptyHardpoint.png"] forState:UIControlStateNormal];
        if ([hardpointButtons objectAtIndex:i] == sender) idTapped = i;
    }
    
    int indexTapped;
    if (idTapped >= 0) {
        indexTapped = [self indexForHardpointId:idTapped];
        [sender setBackgroundImage:[UIImage imageNamed:@"EmptyHardpointSelected.png"] forState:UIControlStateNormal];
        [self displayItem:[equipped objectAtIndex:indexTapped]];
    }
    
    if (doDoubleTap && wasPreviouslySelected && idTapped > -1) {
        doDoubleTap = NO;
        [self dismountItem:[hardpointButtons objectAtIndex:idTapped]];
    } else {
        [self startDoubleTapDetection];
    }
}

- (void)mountItemAtIndex:(int)index {
    NSString *itemName = [itemTable cellForRowAtIndexPath:[NSIndexPath indexPathForRow:index inSection:0]].text;
    
    if ([self shouldEquipItem:itemName]) {
        supressNextSelectSound = YES;
        
        int insertAtIndex = -1;
        for (int i = 0; i < [self itemSlots]; i++) {
            if ([[equipped objectAtIndex:i] isEqualToString:@"<Empty>"] && 
                    [[hardpointButtons objectAtIndex:[self hardpointIdForIndex:i]] backgroundImageForState:UIControlStateNormal] == [UIImage imageNamed:@"EmptyHardpointSelected.png"]) {
                insertAtIndex = i;
            }
        }
        if (insertAtIndex < 0) insertAtIndex = [equipped indexOfObject:@"<Empty>"];
        
        if (insertAtIndex != NSNotFound) {
            [self playSound:HyperspaceSoundItemMount];
            [inventory removeObjectAtIndex:index];
            [equipped replaceObjectAtIndex:insertAtIndex withObject:itemName];
            [self mountItemToIndex:insertAtIndex];
            
            [self updateHardpoints];
            [itemTable deselectRowAtIndexPath:[itemTable indexPathForSelectedRow] animated:NO];
            [itemTable deleteRowsAtIndexPaths:[NSArray arrayWithObject:[NSIndexPath indexPathForRow:index inSection:0]] withRowAnimation:UITableViewRowAnimationRight];
            [itemTable reloadData];
            
            [self tappedEquippedItem:[hardpointButtons objectAtIndex:[self hardpointIdForIndex:insertAtIndex]]];
            
        } else {
            [self playSound:HyperspaceSoundError];
            UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"No more item mounts"
                                                                                                                    message:@"To mount more items you first must clear a spot by double tapping an equipped item to remove it from its socket."
                                                                                                                 delegate:nil
                                                                                                cancelButtonTitle:@"OK"
                                                                                                otherButtonTitles:nil];
            [alertView show];
            [alertView release];
        }
    }
}

- (IBAction)dismountItem:(id)sender {
    int idTapped = [hardpointButtons indexOfObject:sender];
    int indexTapped = [self indexForHardpointId:idTapped];
    
    if (![[equipped objectAtIndex:indexTapped] isEqualToString:@"<Empty>"]) {
        [self playSound:HyperspaceSoundItemDismount];
        
        // remove item from hardpoint, and insert into inventory
        [inventory addObject:[equipped objectAtIndex:indexTapped]];
        [equipped replaceObjectAtIndex:indexTapped withObject:@"<Empty>"];
        [inventory sortUsingSelector:@selector(compare:)];
        
        [self dismountItemAtIndex:indexTapped];
    }
    
    // refresh the display
    [self updateHardpoints];
    [self tappedEquippedItem:[hardpointButtons objectAtIndex:idTapped]];
    [itemTable reloadData];
}

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath {
    [self mountItemAtIndex:indexPath.row];
}


#pragma mark Helper Methodsz
- (int)hardpointIdForIndex:(int)index {
    int hardpointCount = [self itemSlots];
    
    if (index < hardpointCount) {
        switch (hardpointCount) {
            case 1:
                return 2;
                
            case 2:
                switch (index) {
                    case 0: return 1;
                    case 1: return 3;
                }
                
            case 3:
                switch (index) {
                    case 0: return 0;
                    case 1: return 2;
                    case 2: return 4;
                }
                
            case 4:
                switch (index) {
                    case 0: return 0;
                    case 1: return 1;
                    case 2: return 3;
                    case 3: return 4;
                }
                
            case 5:
                return index;
        }
    }
    
    [NSException raise:@"HardpointOutOfRange" format:@"asked for hardpoint %i, but only %i hardpoints total", index, hardpointCount];
    return -1;
}

- (int)indexForHardpointId:(int)hardpointId {
    for (int i = 0; i < [self itemSlots]; i++) {
        if ([self hardpointIdForIndex:i] == hardpointId) return i;
    }
    
    return -1;
}

- (void)startDoubleTapDetection {
    doDoubleTap = YES;
    [NSTimer scheduledTimerWithTimeInterval:DOUBLE_TAP_TIME target:self selector:@selector(timeoutDoubleTap:) userInfo:nil repeats:NO];
}

- (void)timeoutDoubleTap:(NSTimer *)timer {
    doDoubleTap = NO;
}

- (void)updateHardpoints {
    int hardpointCount = [self itemSlots];
    
    // Remove all weapon icons, set to disabled
    for (int i = 0; i < 5; i++) {
        [[hardpointButtons objectAtIndex:i] setImage:nil forState:UIControlStateNormal];
        [[hardpointButtons objectAtIndex:i] setImage:nil forState:UIControlStateHighlighted];
        [[hardpointButtons objectAtIndex:i] setImage:nil forState:UIControlStateSelected];
        [[hardpointButtons objectAtIndex:i] setEnabled:NO];
    }
    
    // Enable active hardpoints
    for (int i = 0; i < hardpointCount; i++) {
        int hardpointId = [self hardpointIdForIndex:i];
        [[hardpointButtons objectAtIndex:hardpointId] setEnabled:YES];
        
        // if the hardpoint has a wepaon in it, show that weapons icon
        if (![[equipped objectAtIndex:i] isEqualToString:@"<Empty>"]) {
            NSString *iconName = [[allItems objectForKey:[equipped objectAtIndex:i]] objectForKey:@"icon"];
            iconName = [NSString stringWithFormat:@"ItemIcon.%@.png", iconName];
            
            [[hardpointButtons objectAtIndex:hardpointId] setImage:[UIImage imageNamed:iconName] forState:UIControlStateNormal];
            [[hardpointButtons objectAtIndex:hardpointId] setImage:[UIImage imageNamed:iconName] forState:UIControlStateHighlighted];
            [[hardpointButtons objectAtIndex:hardpointId] setImage:[UIImage imageNamed:iconName] forState:UIControlStateSelected];
        }
    }
}

#pragma mark Semantic Actions
- (void)displayItem:(NSString *)aItemName {
    modeButton.enabled = [itemTable indexPathForSelectedRow] != nil;
}
- (void)sellItems {}
- (int)itemSlots { return 0; }
- (void)mountItemToIndex:(int)index {}
- (void)dismountItemAtIndex:(int)index {}
- (void)tappedEquippedItemIndex:(int)index {}
- (BOOL)shouldEquipItem:(NSString *)itemName {
    return YES;
}

- (IBAction)sellItem:(id)sender {}
- (IBAction)tappedEquipButton:(id)sender {
    NSIndexPath *indexPath = nil;
    
    // Find the cell that has the accessory buton that was tapped.
    for (UITableViewCell *cell in [itemTable visibleCells]) {
        if (cell.accessoryView == sender)
            indexPath = [itemTable indexPathForCell:cell];
    }
    
    // Call the method that discolosure button would have called automatically
    if (indexPath) {
        [self tableView:itemTable accessoryButtonTappedForRowWithIndexPath:indexPath];
    }
}

#pragma mark Table Methods
- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section {
    return [[[UIView alloc] initWithFrame:CGRectZero] autorelease];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return [inventory count];
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
    
    
    
    // Item name
    cell.text = [inventory objectAtIndex:indexPath.row];
    
    // Item Icon
    NSString *iconName = [[allItems objectForKey:[inventory objectAtIndex:indexPath.row]] objectForKey:@"icon"];
    cell.image = [UIImage imageNamed:[NSString stringWithFormat:@"ItemIcon.%@.png", iconName]];
        
    // zebra stripes
    cell.backgroundView.backgroundColor = [UIColor colorWithWhite:(indexPath.row % 2 == 0 ? 0.2 : 0.25) alpha:1.0];
    
    // return the cell
    return cell;
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
    if (selectedIndexPath) [itemTable selectRowAtIndexPath:selectedIndexPath animated:NO scrollPosition:UITableViewScrollPositionNone];
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    if (indexPath == selectedIndexPath) supressNextSelectSound = YES;
    if (doDoubleTap && indexPath == selectedIndexPath) {
        doDoubleTap = NO;
        if (mode == ItemTableModeSell) {
            // Mark or Unmark items for sale
            UITableViewCell *cell = [itemTable cellForRowAtIndexPath:indexPath];
            supressNextSelectSound = YES;
            
            if ([indexPathsToSell indexOfObject:indexPath] != NSNotFound) {
                [indexPathsToSell removeObject:indexPath];
                cell.accessoryView = nil;
                [sellDeselectSound play];
            } else {
                [indexPathsToSell addObject:indexPath];
                
                UIImageView *accessory = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"SellAccessory.png"]];
                accessory.userInteractionEnabled = NO;
                cell.accessoryView = accessory;
                [accessory release];
                
                [sellSelectSound play];
            }
            
        } else {
            // Tap selected weapon mounts an item
            int inventoryCount = [inventory count];
            [self mountItemAtIndex:indexPath.row];
            if ([inventory count] < inventoryCount) return nil;
        }
    }    
    return indexPath;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    [self playSelectSound];
    
    [selectedIndexPath release];
    selectedIndexPath = [indexPath retain];
    
    [self displayItem:[itemTable cellForRowAtIndexPath:indexPath].text];
    for (int i = 0; i <    [hardpointButtons count]; i++) {
        [[hardpointButtons objectAtIndex:i] setBackgroundImage:[UIImage imageNamed:@"EmptyHardpoint.png"] forState:UIControlStateNormal];
    }
    
    [self startDoubleTapDetection];
}

@end
