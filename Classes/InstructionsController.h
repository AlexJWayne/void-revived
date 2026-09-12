//
//  InstructionsController.h
//  Void
//
//  Created for VOID on 1/3/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface InstructionsController : UIViewController <UIScrollViewDelegate> {
  IBOutlet UIPageControl *pageControl;
  IBOutlet UIScrollView *imageView;
  
  IBOutlet UIButton *previousButton;
  IBOutlet UIButton *nextButton;
}

- (IBAction)menu:(id)sender;

- (void)animationComplete;

@end
