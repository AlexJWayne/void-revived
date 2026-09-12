//
//  Bench.h
//  Void
//
//  Created for VOID on 9/23/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface Bench : NSObject {
  int frames;
  int reportLimit;
  clock_t start;
  clock_t elapsed;
  
  NSString *name;
}

- (id)initWithName:(NSString *)aName;
- (id)initWithName:(NSString *)aName reportLimit:(int)limit;

- (void)start;
- (void)stop;
- (void)report;

@end
