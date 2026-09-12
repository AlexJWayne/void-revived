//
//    VoidAppDelegate.m
//    Void
//
//    Created for VOID on 9/17/08.
//    Copyright __MyCompanyName__ 2008. All rights reserved.
//

#import "VoidAppDelegate.h"
#import "FlightInterface.h"

#import "Texture.h"
#import "Model3D.h"
#import "Utility.h"

#import <AudioToolbox/AudioToolbox.h>

@interface NSDate (SuppressWarnings)
+ (NSDate *)dateWithNaturalLanguageString:(NSString *)dateString;
- (NSString *)descriptionWithCalendarFormat:(NSString *)formatString timeZone:(NSTimeZone *)aTimeZone locale:(id)localeDictionary;
@end

@implementation VoidAppDelegate

@synthesize window;
@synthesize gameController;
@synthesize hyperspaceController;

+ (void)launchOpenFeintDashboard {
    // The discontinued OpenFeint integration was removed from this reference archive.
}

- (void)applicationDidFinishLaunching:(UIApplication *)application {
    srand(time(NULL));
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleBlackTranslucent];
    [[UIApplication sharedApplication] setStatusBarHidden:YES];
    
    // Register standard defaults
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults registerDefaults:[NSDictionary dictionaryWithObjectsAndKeys:
                                [NSNumber numberWithFloat:0.5], @"musicVolume",
                                [NSNumber numberWithFloat:3.0], @"turnSensitivity",
                                [NSNumber numberWithBool:NO], @"invertSteering",
                                [NSNumber numberWithBool:NO], @"checkedForLiteData",
                                nil]];
    
    
    // Initialize audio
    audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryAmbient error:nil];
    
    // Load data files
    [Utility cacheDataFiles];
    
    // Load item icons
    NSArray *paths = [[NSBundle mainBundle] pathsForResourcesOfType:@"png" inDirectory:nil];
    for (NSString *filename in paths) {
        filename = [[filename componentsSeparatedByString:@"/"] lastObject];
        if ([filename hasPrefix:@"ItemIcon"]) {
            [UIImage imageNamed:filename];
        }
    }
    
    [window makeKeyAndVisible];
    [self showTitle];
    
    if ([defaults objectForKey:@"savedGameState"]) {
        [titleView removeFromSuperview];
        titleView = nil;
        [titleController release];
        titleController = nil;
        
        NSData *savedGameState = [[NSUserDefaults standardUserDefaults] objectForKey:@"savedGameState"];
        [defaults removeObjectForKey:@"savedGameState"];
        [defaults synchronize];
        
        [self playStageWithSaveData:savedGameState];
    }
    
    // Discontinued service initialization and review solicitation were removed.
}


- (void)dealloc {
    [gameController release];
    [hyperspaceController release];
    [hyperspaceView release];
    [stageSummaryController release];
    [window release];
    [super dealloc];
}




- (void)showTitle {
    [hyperspaceView removeFromSuperview];
    [hyperspaceController release];
    hyperspaceController = nil;
    hyperspaceView = nil;
    
    [Texture drainCache];
    [Model3D drainCache];
    
    
    [titleController release];
    
    titleController = [[TitleController alloc] init];
    [titleController fadeIn];
    titleView = titleController.view;
    [window addSubview:titleView];
}

- (void)showHyperspace {
    [self showHyperspaceWithStats:nil];
}

- (void)showHyperspaceWithStats:(NSDictionary *)stats {
    [titleView removeFromSuperview];
    [titleController release];
    titleController = nil;
    titleView = nil;
    
    [gameView endStage];
    [gameView removeFromSuperview];
        
    [Texture drainCache];
    [Model3D drainCache];
    [SoundEffect resetListenerPos];
    [SoundEffect drainCache];
    
    if (hyperspaceController == nil) {
        hyperspaceController = [[HyperspaceController alloc] init];
        
        GalaxyMapController *mapController       = [[GalaxyMapController alloc] init];
        WeaponsController *weaponsController     = [[WeaponsController   alloc] init];
        EquipmentController *equipmentController = [[EquipmentController alloc] init];
        ShipyardController *shipyardController   = [[ShipyardController  alloc] init];
        TitleController *aTitleController        = [[TitleController     alloc] init];
        [aTitleController hideContinue];
        
        hyperspaceController.viewControllers = [NSArray arrayWithObjects:
                                                                                        mapController,
                                                                                        weaponsController,
                                                                                        equipmentController,
                                                                                        shipyardController,
                                                                                        aTitleController,
                                                                                        nil];
        
        [mapController release];
        [weaponsController release];
        [equipmentController release];
        [shipyardController release];
        [aTitleController release];
    }
    
    Player *player = [[[Player alloc] init] autorelease];
    
    // add ships to purchaseable pool
    if (playedStageName) {
        if ([[player.completedStages lastObject] isEqualToString:playedStageName]) {
            [[hyperspaceController.viewControllers objectAtIndex:3] addShipsFromStage:playedStageName];
        }        
    }
    
    [hyperspaceController updateBadges];
    
    hyperspaceView = hyperspaceController.view;
    [window addSubview:hyperspaceView];
    
    
    // Show stats
    [stageSummaryController release];
    stageSummaryController = nil;
    if (stats) {
        stageSummaryController = [[StageSummaryController alloc] initWithStats:stats];
        [window addSubview:stageSummaryController.view];
    }
    
}

- (void)playStageNamed:(NSString *)stageName {
    [hyperspaceView removeFromSuperview];
    
    [Texture drainCache];
    [Model3D drainCache];
    [SoundEffect drainCache];
    
    if (gameController == nil) {
        gameController = [[FlightInterface alloc] initWithNibName:@"FlightInterface" bundle:[NSBundle mainBundle]];
        gameView = (EAGLView *)gameController.view;
    }
    
    [playedStageName release];
    playedStageName = [stageName copy];
    
    [window addSubview:gameView];
    
    NSString *tip = [[[Utility dataFile:@"Stages"] objectForKey:stageName] objectForKey:@"description"];
    [gameView showLoadingWithMessage:tip];
    [gameView performSelector:@selector(playStageNamed:) withObject:stageName afterDelay:0.1];
}

- (void)playStageWithSaveData:(NSData *)stageData {
    if (gameController == nil) {
        gameController = [[FlightInterface alloc] initWithNibName:@"FlightInterface" bundle:[NSBundle mainBundle]];
        gameView = (EAGLView *)gameController.view;
    }
    
    [playedStageName release];
    playedStageName = [[Game sharedGame].stageName copy];
    
    [window addSubview:gameView];
    
    [gameView showLoading];
    [gameView performSelector:@selector(playStageWithData:) withObject:stageData afterDelay:0.1];
}




- (BOOL)isLegit {
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"SignedIdentity"] == nil;
}

- (void)applicationWillTerminate:(UIApplication *)application {
    if ([Game sharedGame]) {
        NSData *savedGameState = [NSKeyedArchiver archivedDataWithRootObject:[Game sharedGame]];
        [[NSUserDefaults standardUserDefaults] setObject:savedGameState forKey:@"savedGameState"];
    }
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
//    [OpenFeint applicationDidBecomeActive];
}

- (void)applicationWillResignActive:(UIApplication *)application {
//    [OpenFeint applicationWillResignActive];
    if ([Game sharedGame] && !gameView.paused)
        [gameView togglePause];
//    [OpenFeint applicationWillResignActive];
}

- (BOOL)isOpenFeintNotificationAllowed:(OFNotificationData*)notificationData {
    return [[notificationData notificationText] rangeOfString:@"High Score"].location == NSNotFound;
}

+ (bool)canReceiveCallbacksNow {
    return YES;
}
+ (void)onHighScoreSubmissionSuccess {
    NSLog(@"Successfully submitted score");
}
+ (void)onHighScoreSubmissionFailure {
    NSLog(@"Failed to submit score");
}

@end
