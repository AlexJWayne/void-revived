//
//  HyperspaceController.h
//  Void
//
//  This is the tab controller that holds all the Hyperspace view controllers
//
#import <UIKit/UIKit.h>
#import "GalaxyMapController.h"
#import "WeaponsController.h"
#import "BackgroundMusic.h"

@interface HyperspaceController : UITabBarController {
  BackgroundMusic *music;
}

- (void)updateBadges;

@end
