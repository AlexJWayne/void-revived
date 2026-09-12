//
//  Utility.h
//  Void
//
//  Created for VOID on 10/11/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES1/gl.h>
#import <OpenGLES/ES1/glext.h>
#import "Vector.h"

@interface Utility : NSObject {
  
}

+ (void)cacheDataFiles;
+ (void)cacheDataFile:(NSString *)dataFileName;

+ (GLfloat)angleDifference:(GLfloat)from to:(GLfloat)to;
+ (NSMutableDictionary *)dataFile:(NSString *)dataFileName;

+ (void)showError:(NSString *)message;

+ (float)deg2rad:(float)degrees;
+ (float)rad2deg:(float)radians;

@end
