//
//  Bench.m
//  Void
//
//  Created for VOID on 9/23/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Bench.h"


@implementation Bench

- (id)initWithName:(NSString *)aName {
  return nil;
  
  [super init];
  reportLimit = 600;
  name = [aName retain];
  return self;
}

- (id)initWithName:(NSString *)aName reportLimit:(int)limit {
  [self initWithName:aName];
  reportLimit = limit;
  return self;
}

- (void)dealloc {
  [name release];
  [super dealloc];
}


- (void)start {
  start = clock();
}

- (void)stop {
  elapsed += clock() - start;
  frames++;
  if (frames >= reportLimit) {
    [self report];
    frames  = 0;
    elapsed = 0;
  }
}

- (void)report {
  NSLog(@"bench :: %@ :: %f seconds", name, (float)(elapsed)/CLOCKS_PER_SEC);
}


@end

    //  double elapsed;
    //  double start = (double)clock();
    //  double end = (double)clock();
    //  elapsed += end - start;
    //  NSLog(@"Bench: %f", elapsed / (double)CLOCKS_PER_SEC);
