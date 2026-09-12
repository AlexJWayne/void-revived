//
//  TitleController.h
//  Void
//
//  Created for VOID on 10/18/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SoundEffect.h"
#import "BackgroundMusic.h"
#import "SettingsViewController.h"
#import "InstructionsController.h"
#import "CreditsController.h"

@interface TitleController : UIViewController <UIAlertViewDelegate> {
    UIButton *continueButton;
    UIButton *newDevGameButton;
    UIImageView *background;
    
    BackgroundMusic *music;
    SoundEffect *selectedItemSound;
    UIView *overlay;

    SettingsViewController *settingsController;
    InstructionsController *instructionsController;
    CreditsController *creditsController;
}

@property (nonatomic, retain) IBOutlet UIButton *continueButton;
@property (nonatomic, retain) IBOutlet UIButton *newDevGameButton;
@property (nonatomic, retain) IBOutlet UIImageView *background;

- (IBAction)continueGame;
- (IBAction)newGame;
- (IBAction)instructions;
- (IBAction)settings;
- (IBAction)credits;
- (IBAction)openFeintDashboard;
- (void)fetchLitePlayerData;

- (void)fadeIn;
- (UIView*)overlayableView;
- (void)hideContinue;




- (IBAction)newDevGame;

@end
