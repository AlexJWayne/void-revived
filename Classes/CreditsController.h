//
//  CreditsController.h
//  Void
//
//  Created for VOID on 1/7/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SoundEffect.h"


@interface CreditsController : UIViewController {
  SoundEffect *closeSound;
}

- (IBAction)sendFeedback:(id)sender;
- (IBAction)dismissView:(id)sender;
- (void)animationComplete;

@end
