//
//    Utility.m
//    Void
//
//    Created for VOID on 10/11/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Utility.h"

static NSMutableDictionary *dataFiles;

@implementation Utility

+ (void)cacheDataFiles {
    dataFiles = [[NSMutableDictionary alloc] init];
    [self cacheDataFile:@"Equipment"];
    [self cacheDataFile:@"Weapons"];
    [self cacheDataFile:@"ShipTypes"];
    [self cacheDataFile:@"Stages"];
    [self cacheDataFile:@"NewPlayerDev"];
    [self cacheDataFile:@"NewPlayer"];
    [self cacheDataFile:@"Enemies"];
    [self cacheDataFile:@"LootTables"];
    [self cacheDataFile:@"Achievements"];
}

+ (void)cacheDataFile:(NSString *)dataFileName {
    NSString *path = [[NSBundle mainBundle] pathForResource:dataFileName ofType:@"plist"];
    NSMutableDictionary *data = [NSMutableDictionary dictionaryWithContentsOfFile:path];
    [dataFiles setObject:data forKey:dataFileName];
}

+ (GLfloat)angleDifference:(GLfloat)from to:(GLfloat)to {
    GLfloat angleDifference = from - to;
    while (angleDifference < 0.0)   angleDifference += 360.0;
    while (angleDifference > 360.0) angleDifference -= 360.0;
    if    (angleDifference > 180)   angleDifference = 360.0 - angleDifference;
    
    return angleDifference;
}

+ (NSMutableDictionary *)dataFile:(NSString *)dataFileName {
    NSMutableDictionary *data = [dataFiles objectForKey:dataFileName];
    if (data == nil) {
        [NSException raise:@"No data file" format:@"No data file named: %@", dataFileName];
    }
    return data;
}

+ (void)showError:(NSString *)message {
    NSLog(@"--- Error!");
    NSLog(@"%@", message);
    NSLog(@"---");
    
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"ERROR"
                                                                                                    message:message
                                                                                                 delegate:nil
                                                                                cancelButtonTitle:@"OK"
                                                                                otherButtonTitles:nil];
    [alert show];
    [alert release];
}


+ (float)deg2rad:(float)degrees {
    return degrees * M_PI / 180;
}

+ (float)rad2deg:(float)radians {
    return radians * 180 / M_PI;
}

@end
