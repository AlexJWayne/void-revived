//
//  InstructionsController.m
//  Void
//
//  Created for VOID on 1/3/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "InstructionsController.h"


@implementation InstructionsController

#define TOTAL_SCREENS 6

/*
// The designated initializer. Override to perform setup that is required before the view is loaded.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        // Custom initialization
    }
    return self;
}
*/

/*
// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView {
}
*/


// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
  [super viewDidLoad];
  
  // Setup scroll view
  imageView.contentSize = CGSizeMake(480 * TOTAL_SCREENS, 320);
  
  // Insert images
  for (int i = 0; i < TOTAL_SCREENS; i++) {
    NSString *filename = [NSString stringWithFormat:@"Instructions%i", i+1];
    UIImage *singleImage = [[UIImage alloc] initWithContentsOfFile:[[NSBundle mainBundle] pathForResource:filename ofType:@"png"]];
    UIImageView *singleImageView = [[UIImageView alloc] initWithImage:singleImage];
    
    singleImageView.transform = CGAffineTransformTranslate(singleImageView.transform, i * 480, 0);
    [imageView addSubview:singleImageView];
    
    [singleImage release];
    [singleImageView release];
  }
  
  // Setup page control
  pageControl.numberOfPages = TOTAL_SCREENS;
  
  // Animate view into place
  self.view.alpha = 0.0;
  self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, 320);
  
  [UIView beginAnimations:@"FadeInInstructions" context:nil];
  [UIView setAnimationDuration:0.5];
  self.view.alpha = 1.0;
  self.view.transform = CGAffineTransformTranslate(self.view.transform, 0, -320);
  [UIView commitAnimations];
}


/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
  // Release anything that's not essential, such as cached data
}


- (void)dealloc {
  [super dealloc];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
  pageControl.currentPage = imageView.contentOffset.x / imageView.contentSize.width * TOTAL_SCREENS;
}

- (IBAction)menu:(id)sender {
  [UIView beginAnimations:@"FadeOutInstructions" context:nil];
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
