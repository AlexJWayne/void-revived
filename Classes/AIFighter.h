//
//  AIFighter.h
//  Void
//
//  Created for VOID on 10/11/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#include "AIBase.h"

@interface AIFighter : AIBase {
  Vector *homePosition;
}

- (void)updateWithAggro;
- (void)updateWithoutAggro;

- (void)gainAggro;
- (void)dropAggro;

@end
