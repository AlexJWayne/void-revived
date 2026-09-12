//
//  GalaxyMap.h
//  Void
//
//  Created for VOID on 10/9/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>


#include "GalaxyMapController.h"
@class GalaxyMapController;

@interface GalaxyMap : UIView {
  NSDictionary *stages;
  IBOutlet GalaxyMapController *delegate;
  UIImageView *stageHighliter;
  
  NSString *highlightStage;
}

@property (copy) NSString *highlightStage;

- (CGPoint)stageLocation:(NSString *)stageName;
- (NSString *)stageNameAtLocation:(CGPoint)location;

- (void)highlightStage:(NSString *)stageName;

@end
