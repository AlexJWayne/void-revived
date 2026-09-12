//
//  HyperspaceController.m
//  Void
//
//  Created for VOID on 9/29/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "HyperspaceController.h"

@implementation HyperspaceController


// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
//- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
//  if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
//    // Custom initialization
//  }
//  return self;
//}


/*
// Implement loadView to create a view hierarchy programmatically.
- (void)loadView {
}
*/


// Implement viewDidLoad to do additional setup after loading the view.
- (void)viewDidLoad {
  [super viewDidLoad];
  
  // Rotate to landscape
  self.view.frame = CGRectMake(0, 0, 480.0, 320.0);
  if ([[UIApplication sharedApplication] statusBarOrientation] == UIInterfaceOrientationLandscapeRight) {
    CGAffineTransform transform = self.view.transform;
    
    // Set the center point of the view to the center point of the window's content area.      
    self.view.center = CGPointMake(160.0, 240.0);
    
    // Rotate the view 90 degrees around its new center point.
    transform = CGAffineTransformRotate(transform, (M_PI / 2.0));
    self.view.transform = transform;
  }
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  
  // Start music
  music = [[BackgroundMusic alloc] initWithTrack:@"MusicHyperspace"];
  [music play];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  
  // Stop music
  [music stop];
  [music release];
}



- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
  // Return YES for supported orientations
  return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}


- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
  // Release anything that's not essential, such as cached data
  NSLog(@"LOW MEMORY WARNING!");
}


- (void)dealloc {
  NSLog(@"Dealloc HyperspaceController");
  [music stop];
  [music release];
  [super dealloc];
}

- (void)updateBadges {
  [[self.viewControllers objectAtIndex:1] updateBadge];
  [[self.viewControllers objectAtIndex:2] updateBadge];
}


@end
