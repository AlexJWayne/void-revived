//
//  CreditsController.m
//  Void
//
//  Created for VOID on 10/25/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "CreditsController.h"

@implementation CreditsController

/*
// Override initWithNibName:bundle: to load the view using a nib file then perform additional customization that is not appropriate for viewDidLoad.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
  if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
    //...
  }
  return self;
}
 */


/*
 // Implement loadView to create a view hierarchy programmatically.
 - (void)loadView {
 }
 */


// Implement viewDidLoad to do additional setup after loading the view.
- (void)viewDidLoad {
  [super viewDidLoad];
  
  closeSound = [[SoundEffect effectNamed:@"MainSelect" looping:NO] retain];
  
  // Animate view into place
  self.view.alpha = 0.0;
  self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, 320);
  
  [UIView beginAnimations:@"FadeInSettings" context:nil];
  [UIView setAnimationDuration:0.5];
  self.view.alpha = 1.0;
  self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, -320);
  [UIView commitAnimations];
  
}



- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
  return (interfaceOrientation == UIInterfaceOrientationLandscapeRight);
}


- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
  // Release anything that's not essential, such as cached data
}


- (void)dealloc {
  NSLog(@"Dealloc CreditsController");
  [closeSound release];
  [super dealloc];
}

- (IBAction)sendFeedback:(id)sender {
  [[UIApplication sharedApplication] openURL:
   [NSURL URLWithString:@"https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?id=307867865&type=Purple+Software"]];
}

- (IBAction)dismissView:(id)sender {
  [closeSound play];
  
  [UIView beginAnimations:@"FadeOutSettings" context:nil];
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(animationComplete)];
  [UIView setAnimationDuration:0.5];
  self.view.alpha = 0.0;
  self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, 320);
  [UIView commitAnimations];
}

- (void)animationComplete {
  [self.view removeFromSuperview];
}

@end
