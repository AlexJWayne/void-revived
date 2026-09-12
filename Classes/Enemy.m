//
//    Enemy.m
//    Void
//
//    Created for VOID on 9/20/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Enemy.h"

#include "Game.h"
@class Game;

static NSDictionary *lootTables;

@implementation Enemy

@synthesize optional;

+ (void)initialize {
    lootTables = [Utility dataFile:@"LootTables"];
}

- (void)_commonInit {
	[super _commonInit];
	
	distanceToTarget = [[Vector alloc] init];
    loot = [[loadoutDictionary objectForKey:@"loot"] retain];
    
    // Assign AI
    NSString *aiType = [loadoutDictionary objectForKey:@"aiType"];
    if ([aiType isEqualToString:@"Stationary"]) ai = (AIBase *)[[AIStationary alloc]    initWithShip:self];
    if ([aiType isEqualToString:@"Fighter"])    ai = (AIBase *)[[AIFighter alloc]       initWithShip:self];
    if ([aiType isEqualToString:@"Warship"])    ai = (AIBase *)[[AIWarship alloc]       initWithShip:self];
    if ([aiType isEqualToString:@"Crate"])      ai = (AIBase *)[[AICrate alloc]         initWithShip:self];
    
	// Mine data
    NSDictionary *mineData = [loadoutDictionary objectForKey:@"mine"];
    if (mineData && [[mineData objectForKey:@"size"] floatValue] > 0.0) {
        isMine = YES;
        mineShieldDamage    = [[mineData objectForKey:@"shieldDamage"]    floatValue];
        mineArmorDamage     = [[mineData objectForKey:@"armorDamage"]     floatValue];
        mineSize                    = [[mineData objectForKey:@"size"]                    floatValue];
    }
}

- (id)initWithDictionary:(NSDictionary *)loadoutTemplate {
    return [super initWithDictionary:loadoutTemplate];
}

- (id)initWithCoder:(NSCoder*)coder {
	[super initWithCoder:coder];
	[self _commonInit];
	self.optional = [coder decodeBoolForKey:@"optional"];
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[super encodeWithCoder:coder];
	[coder encodeBool:optional forKey:@"optional"];
}

- (void)update {
    [ai update];
	
	if (ai.noticedPlayer || [vel length] > 0.0 || [accel length] > 0.0) {
		[super update];
	} else {
		if ([ai class] == [AICrate class])
		[self updateAngle];
		[self updateEnergy];
		[self updateShields];
		[self updateGuns];
	}
    
    // explode mine
    if (isMine && [[Game sharedGame].ship.pos distance2D:pos] < mineSize) {
        [self damageShields:1000000 armor:1000000];
        
        NSDictionary *projData = [[NSDictionary alloc] initWithObjectsAndKeys:
                                                            [NSNumber numberWithFloat:mineShieldDamage], @"shieldDmg",
                                                            [NSNumber numberWithFloat:mineArmorDamage], @"armorDmg",
                                                            [NSNumber numberWithFloat:mineSize], @"explosionSize",
                                                            [NSNumber numberWithInt:0], @"lifetime",
                                                            [NSNumber numberWithFloat:mineShieldDamage], @"shieldDmg",
                                                            explosionSprite, @"hitSprite",
                                                            nil];
        
        Projectile *proj = [[Projectile alloc] initWithTemplate:projData
                                                                                        belongingToShip:identifier
                                                                                                     position:pos
                                                                                                     velocity:vel
                                                                                                            angle:angle];
        [[Game sharedGame].projectiles addObject:proj];
        
        [proj release];
        [projData release];
    }
}

- (void)dealloc {
    [distanceToTarget release];
    [loot release];
    [ai release];
    [super dealloc];
}

- (void)spawnLoot {
    // Create pickups
    int qtyToSpawn;
    
    for (NSString *lootTableName in [loot allKeys]) {
        if ([lootTableName isEqualToString:@"credits"]) {
            
            // Spawn credits
            qtyToSpawn = rand() % ([[loot valueForKeyPath:@"credits.max"] intValue] - [[loot valueForKeyPath:@"credits.min"] intValue] + 1) + [[loot valueForKeyPath:@"credits.min"] intValue];
            for (int i = 0; i < qtyToSpawn; i++) {
                Pickup *pickup = [[Pickup alloc] initWithType:@"Money" itemName:nil];
                [pickup.pos setValuesToVector:pos];
                [[Game sharedGame].pickups addObject:pickup];
                [pickup release];
            }
            
        } else {
            
            // Spawn items from a loot table
            int qty = [[[loot objectForKey:lootTableName] objectForKey:@"qty"] intValue];
            if (qty == 0) qty = 1;
            for (int i = 0; i < qty; i++) {
                if ((GLfloat)rand() / RAND_MAX < [[[loot objectForKey:lootTableName] objectForKey:@"chance"] floatValue]) {
                    int itemIndex = rand() % [[lootTables objectForKey:lootTableName] count];
                    NSString *itemName = [[[lootTables objectForKey:lootTableName] objectAtIndex:itemIndex] objectForKey:@"name"];
                    NSString *itemType = [[[lootTables objectForKey:lootTableName] objectAtIndex:itemIndex] objectForKey:@"type"];
                    
                    Pickup *pickup = [[Pickup alloc] initWithType:itemType itemName:itemName];
                    [pickup.pos setValuesToVector:pos];
                    [[Game sharedGame].pickups addObject:pickup];
                    [pickup release];
                    
                    NSLog(@"Spawned: %@", itemName);
                }
            }
            
        }
    }
}

// Tell AI damage was taken
- (void)damageShields:(GLfloat)shieldAmount armor:(GLfloat)armorAmount {
    [super damageShields:shieldAmount armor:armorAmount];
    [ai tookDamage];
}

@end
