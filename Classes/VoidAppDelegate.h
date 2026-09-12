//
//  VoidAppDelegate.h
//  Void
//
//  Created for VOID on 9/17/08.
//  Copyright __MyCompanyName__ 2008. All rights reserved.
//

#import <UIKit/UIKit.h>

#import "TitleController.h"
#import "FlightInterface.h"
#import "HyperspaceController.h"
#import "GalaxyMapController.h"
#import "WeaponsController.h"
#import "EquipmentController.h"
#import "ShipyardController.h"
#import "StageSummaryController.h"
#import "EAGLView.h"

#import <AVFoundation/AVFoundation.h>

@interface VoidAppDelegate : NSObject {
    UIWindow *window;
    AVAudioSession *audioSession;
    
    TitleController *titleController;
    UIView *titleView;

    FlightInterface *gameController;
    EAGLView *gameView;

    HyperspaceController *hyperspaceController;
    UIView *hyperspaceView;

    StageSummaryController *stageSummaryController;

    NSString *playedStageName;
}

@property (nonatomic, retain) IBOutlet UIWindow *window;
@property (nonatomic, retain) FlightInterface *gameController;
@property (nonatomic, retain) HyperspaceController *hyperspaceController;

+ (void)launchOpenFeintDashboard;

- (void)showTitle;
- (void)showHyperspace;
- (void)showHyperspaceWithStats:(NSDictionary *)stats;
- (void)playStageNamed:(NSString *)stageName;
- (void)playStageWithSaveData:(NSData *)stageData;

- (BOOL)isLegit;

+ (void)onHighScoreSubmissionSuccess;
+ (void)onHighScoreSubmissionFailure;

@end
