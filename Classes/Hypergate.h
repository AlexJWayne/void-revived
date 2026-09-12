//
//  Hypergate.h
//  Void
//
//  Created for VOID on 9/30/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SpaceObject.h"
#import "Texture.h"

@interface Hypergate : SpaceObject {
    GLfloat angle2;

    Texture *layer1;
    Texture *layer2;

    int birthDuration;
    int birthProgress;
	
    int particleQty;
    NSMutableArray *particles;
}

- (id)initAtPosition:(Vector *)position;
- (void)render;

@end
