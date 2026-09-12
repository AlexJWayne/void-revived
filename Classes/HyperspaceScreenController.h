//
//  HyperspaceScreenController.h
//  Void
//
//  Created for VOID on 3/6/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SoundEffect.h"

typedef enum {
  HyperspaceSoundSwitchTab = 0,
  HyperspaceSoundChimeIn,
  HyperspaceSoundChimeOut,
  HyperspaceSoundError,
  HyperspaceSoundPlayStage,
  HyperspaceSoundSell,
  HyperspaceSoundItemMount,
  HyperspaceSoundItemDismount,
  HyperspaceSoundBuyShip,
  HyperspaceSoundWeaponGroup,
} HyperspaceSound;

@interface HyperspaceScreenController : UIViewController {
  NSArray *sounds;
  BOOL shouldPlayInvokeSound;
  
  UIButton *showHelpScreenButton;
  UIButton *showOpenFeintButton;
  
  NSString *helpScreenName;
  UIButton *helpScreen;
}

- (void)playSound:(HyperspaceSound)soundId;
- (void)setHelpScreenName:(NSString *)helpScreenName;
- (IBAction)launchOpenFeintDashboard:(id)sender;
- (void)reset;

@end
