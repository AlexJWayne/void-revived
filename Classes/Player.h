//
//  Player.h
//  Void
//
//  Created for VOID on 9/29/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "JSON.h"

#import "Utility.h"

@interface Player : NSObject {
  int credits;
  NSString *currentStage;
  NSMutableArray *completedStages;
  NSString *shipType;
  NSMutableArray *guns;
  NSMutableArray *equipment;
  
  NSMutableArray *weaponInventory;
  NSMutableArray *equipmentInventory;
  
  NSMutableArray *buybackWeapons;
  NSMutableArray *buybackEquipment;
  int buybackWeaponsValue;
  int buybackEquipmentValue;
  
  NSMutableArray *ownedShips;
  int newShipCount;
  
  NSMutableArray *weaponGroups;
  
  int newWeaponCount;
  int newEquipmentCount;
  
  NSMutableArray *unlockedAcheivements;
}

@property (assign) int credits;
@property (copy) NSString *currentStage;
@property (retain) NSMutableArray *completedStages;
@property (copy) NSString *shipType;
@property (retain) NSMutableArray *guns;
@property (retain) NSMutableArray *equipment;
@property (retain) NSMutableArray *weaponInventory;
@property (retain) NSMutableArray *equipmentInventory;

@property (retain) NSMutableArray *buybackWeapons;
@property (assign) int buybackWeaponsValue;

@property (retain) NSMutableArray *buybackEquipment;
@property (assign) int buybackEquipmentValue;


@property (assign) NSMutableArray *ownedShips;
@property (assign) int newShipCount;

@property (retain) NSMutableArray *weaponGroups;

@property (assign) int newWeaponCount;
@property (assign) int newEquipmentCount;

@property (retain) NSMutableArray *unlockedAcheivements;

- (void)_commonInitWithDictionary:(NSDictionary*)playerData;
- (id)initWithDictionary:(NSDictionary*)playerDaya;
- (NSDictionary *)dictionary;
- (NSDictionary *)shipDictionary;

- (void)addWeaponToInventory:(NSString *)itemName;
- (void)addEquipmentToInventory:(NSString *)itemName;
- (void)completeStage:(NSString *)stageName;

- (void)save;

- (void)unlockAchievements;
- (void)unlockAchievementId:(NSString *)achievementId;

@end
