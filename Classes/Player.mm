//
//    Player.m
//    Void
//
//    Created for VOID on 9/29/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Player.h"
#import "Utility.h"

#include "VoidAppDelegate.h"

#import "OFAchievement.h"
#import "OpenFeint.h"


@implementation Player

@synthesize credits, currentStage, completedStages, shipType, guns, equipment, weaponInventory, equipmentInventory, buybackWeapons, buybackEquipment, buybackWeaponsValue, buybackEquipmentValue, ownedShips, newShipCount, weaponGroups, newWeaponCount, newEquipmentCount, unlockedAcheivements;


#pragma mark Initialization
- (void)_commonInitWithDictionary:(NSDictionary*)playerData {
	credits                 = [[playerData objectForKey:@"credits"] intValue];
    currentStage            = [[playerData objectForKey:@"currentStage"] copy];
    completedStages         = [[NSMutableArray alloc] initWithArray:[playerData objectForKey:@"completedStages"]];
    shipType                = [[playerData valueForKeyPath:@"ship.type"] copy];
    guns                    = [[NSMutableArray alloc] initWithArray:[playerData valueForKeyPath:@"ship.guns"]];
    equipment               = [[NSMutableArray alloc] initWithArray:[playerData valueForKeyPath:@"ship.equipment"]];
    
    weaponInventory         = [[NSMutableArray alloc] initWithArray:[playerData valueForKeyPath:@"inventory.weapons"]];
    equipmentInventory      = [[NSMutableArray alloc] initWithArray:[playerData valueForKeyPath:@"inventory.equipment"]];
    
    buybackWeapons          = [[NSMutableArray alloc] initWithArray:[playerData objectForKey:@"buybackWeapons"]];
    buybackWeaponsValue     = [[playerData objectForKey:@"buybackWeaponsValue"] intValue];
    
    buybackEquipment        = [[NSMutableArray alloc] initWithArray:[playerData objectForKey:@"buybackEquipment"]];
    buybackEquipmentValue   = [[playerData objectForKey:@"buybackEquipmentValue"] intValue];
    
    ownedShips              = [[NSMutableArray alloc] initWithArray:[playerData objectForKey:@"ownedShips"]];
    newShipCount            = [[playerData objectForKey:@"newShipCount"] intValue];
    
    weaponGroups            = [[NSMutableArray alloc] initWithArray:[playerData valueForKeyPath:@"ship.weaponGroups"]];
    
    newWeaponCount          = [[playerData objectForKey:@"newWeaponCount"] intValue];
    newEquipmentCount       = [[playerData objectForKey:@"newEquipmentCount"] intValue];
    
    unlockedAcheivements = [[NSMutableArray alloc] initWithArray:[playerData objectForKey:@"unlockedAcheivements"]];
    if (!unlockedAcheivements) unlockedAcheivements = [[NSMutableArray alloc] init];
}

- (id)init {
    [super init];
    
    NSMutableDictionary *playerData = [[NSUserDefaults standardUserDefaults] objectForKey:@"player"];
    if (playerData == nil) {
        NSLog(@"Creating New Player save");
        playerData = [Utility dataFile:@"NewPlayer"];
    }
    
    [self _commonInitWithDictionary:playerData];
    
    return self;
}

- (id)initWithDictionary:(NSDictionary*)playerData {
	[super init];
	[self _commonInitWithDictionary:playerData];
	return self;
}


#pragma mark Serialization
- (NSDictionary *)dictionary {
	return [NSDictionary dictionaryWithObjectsAndKeys:
            [NSNumber numberWithInt:credits], @"credits", 
            [self shipDictionary],            @"ship",
            currentStage,                     @"currentStage",
            completedStages,                  @"completedStages",
            [NSDictionary dictionaryWithObjectsAndKeys:
                weaponInventory, @"weapons", 
                equipmentInventory, @"equipment", 
                nil], @"inventory",
            [NSArray arrayWithArray:buybackWeapons],        @"buybackWeapons",
            [NSNumber numberWithInt:buybackWeaponsValue],   @"buybackWeaponsValue",
            [NSArray arrayWithArray:buybackEquipment],      @"buybackEquipment",
            [NSNumber numberWithInt:buybackEquipmentValue], @"buybackEquipmentValue",
            ownedShips,                                     @"ownedShips",
            [NSNumber numberWithInt:newShipCount],          @"newShipCount",
            [NSNumber numberWithInt:newWeaponCount],        @"newWeaponCount",
            [NSNumber numberWithInt:newEquipmentCount],     @"newEquipmentCount",
            unlockedAcheivements,                           @"unlockedAcheivements",
            nil];
}

- (NSDictionary *)shipDictionary {
    return [NSDictionary dictionaryWithObjectsAndKeys:
            shipType,     @"type",
            guns,         @"guns",
            equipment,    @"equipment",
            weaponGroups, @"weaponGroups",
            nil];
}


# pragma mark Inventory
- (void)addWeaponToInventory:(NSString *)itemName {
    [weaponInventory addObject:itemName];
}

- (void)addEquipmentToInventory:(NSString *)itemName {
    [equipmentInventory addObject:itemName];
}


# pragma mark Actions
- (void)completeStage:(NSString *)stageName {
    if (![completedStages containsObject:stageName]) {
        [completedStages addObject:stageName];
    }
}

- (void)save {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:[self dictionary] forKey:@"player"];
	[defaults synchronize];
    [self unlockAchievements];
}

#pragma mark Achievements
- (void)unlockAchievements {
    NSDictionary *achievements = [Utility dataFile:@"Achievements"];
    
    for (NSDictionary *achievementName in achievements) {
        NSDictionary *achievement = [achievements objectForKey:achievementName];
        NSString *requirementCategory = [achievement objectForKey:@"requirementCategory"];
        
        // Clear X stages
        if ([requirementCategory isEqualToString:@"StageClears"]) {
            NSInteger neededStages;
            
            if ([[achievement objectForKey:@"requirementValue"] intValue] == -1) { // Clear all stages
                neededStages = [[Utility dataFile:@"Stages"] count];
            } else {
                neededStages = [[achievement objectForKey:@"requirementValue"] intValue];
            }
            
            if ([completedStages count] >= neededStages) {
                [self unlockAchievementId:[achievement objectForKey:@"id"]];
            }
        }
        
        // Clear a single stage named X
        else if ([requirementCategory isEqualToString:@"SingleStageClear"]) {
            NSString *stageName = [achievement objectForKey:@"requirementValue"];
            if ([completedStages containsObject:stageName]) {
                [self unlockAchievementId:[achievement objectForKey:@"id"]];
            }
        }
        
        // Pilot a ship tier
        else if ([requirementCategory isEqualToString:@"PilotShipTier"]) {
            if ([[[self shipDictionary] objectForKey:@"type"] rangeOfString:[achievement objectForKey:@"requirementValue"]].location != NSNotFound) {
                [self unlockAchievementId:[achievement objectForKey:@"id"]];
            }
        }
        
        // Pilot all ships
        else if ([requirementCategory isEqualToString:@"OwnAllShips"]) {
            if ([ownedShips count] == 32) {
                [self unlockAchievementId:[achievement objectForKey:@"id"]];
            }
        }
        
        // Weapons
        else if ([requirementCategory isEqualToString:@"WeaponQty"]) {
            NSDictionary *requirement = [achievement objectForKey:@"requirementValue"];
            NSInteger count = 0;
            
            for (NSString *gun in guns) {
                if ([gun isEqualToString:[requirement objectForKey:@"name"]]) {
                    count++;
                }
            }
            
            if (count >= [[requirement objectForKey:@"qty"] intValue]) {
                [self unlockAchievementId:[achievement objectForKey:@"id"]];
            }
        }
        
        // Any Equipment from a group
        else if ([requirementCategory isEqualToString:@"EquipmentGroup"]) {
            for (NSString *equipmentName in equipment) {
                NSString *equipmentGroup = [[[Utility dataFile:@"Equipment"] objectForKey:equipmentName] objectForKey:@"group"];
                if ([equipmentGroup isEqualToString:[achievement objectForKey:@"requirementValue"]]) {
                    [self unlockAchievementId:[achievement objectForKey:@"id"]];
                }
            }
        }
        
        // Found all equipment in array
        else if ([requirementCategory isEqualToString:@"PosessAllEquipment"]) {
            BOOL foundAll = YES;
            
            for (NSString *requiredEquipment in [achievement objectForKey:@"requirementValue"]) {
                if (![equipmentInventory containsObject:requiredEquipment]) {
                    foundAll = NO;
                }
            }
            
            if (foundAll) [self unlockAchievementId:[achievement objectForKey:@"id"]];
        }

        // Cash on hand
        else if ([requirementCategory isEqualToString:@"Cash"]) {
            if (credits >= [[achievement objectForKey:@"requirementValue"] intValue]) {
                [self unlockAchievementId:[achievement objectForKey:@"id"]];
            }
        }
        
    }
}

- (void)unlockAchievementId:(NSString *)achievementId {
    if ([unlockedAcheivements indexOfObject:achievementId] == NSNotFound) {
        [[OFAchievement achievement:achievementId] updateProgressionComplete:100.0f andShowNotification:YES];
        [unlockedAcheivements addObject:achievementId];
    }
}


#pragma mark Dealloc
- (void)dealloc {
    [shipType release];
    [guns release];
    [equipment release];
    [currentStage release];
    [completedStages release];
    [weaponInventory release];
    [equipmentInventory release];
    [buybackWeapons release];
    [buybackEquipment release];
    [weaponGroups release];
    [unlockedAcheivements release];
    [super dealloc];
}

@end
