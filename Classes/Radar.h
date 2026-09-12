//
//  Radar.h
//  Void
//
//  Created for VOID on 9/19/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Button.h"
#import "Vector.h"
#import "SpaceObject.h"
#import "Planet.h"
#import "Enemy.h"
#import "Pickup.h"
#import "Bench.h"

@interface Radar : Button {
  Vector *shipPos;
  Vector *blipOffset;
  Bench *bench;
}

- (id)initInRect:(CGRect)aFrame texFrame:(CGRect)aTexFrame;

- (void)update;
- (void)transformPositionToRadar:(Vector*)pos;

- (void)render;

@end
