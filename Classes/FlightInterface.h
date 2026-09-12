//
//  FlightInterface.h
//  Void
//
//  Created for VOID on 9/16/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Game.h"
#import "EAGLView.h"
#import "GenericButton.h"

@interface FlightInterface : UIViewController {
  IBOutlet EAGLView *glView;
  IBOutlet UILabel *creditsLabel;
  IBOutlet UIView *pauseOverlay;
  IBOutlet UIButton *cheatButton;
  
  IBOutlet UITextView *debugText;
}

- (void)updateCredits:(int)credits;
- (void)togglePause;

- (IBAction)abortStage:(id)sender;
- (IBAction)autocompleteStage:(id)sender;

- (IBAction)showOpenFeintDashboard:(id)sender;

@end
