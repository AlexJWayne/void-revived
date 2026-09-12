//
//  Pickup.h
//  Void
//
//  Created for VOID on 9/26/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Texture.h"
#import "SoundEffect.h"

@interface Pickup : SpaceObject {
  Texture *texture;
  NSString *type;
  GLfloat size;
  GLfloat renderSize;
  
  BOOL pickedUp;
  int pickupAnimationDuration;
  int pickupAnimationCounter;
  Vector *distance2DShip;
  
  int creditValue;
  NSString *itemName;
  
  SoundEffect *sound;
  
  BOOL expired;
}

@property (readonly) BOOL expired;
@property (copy) NSString *type;
@property (copy) NSString *itemName;


- (void)_commonInitWithType:(NSString*)pickupType itemName:(NSString*)anItemName;
- (id)initWithType:(NSString *)pickupType itemName:(NSString *)anItemName;

- (void)updateVel;

@end
