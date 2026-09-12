//
//  Nebula.h
//  Void
//
//  Created for VOID on 2/9/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SpaceObject.h"
#import "Texture.h"
#import "Utility.h"

@interface Nebula : SpaceObject {
  Texture *texture;
  
  GLfloat size;
  GLfloat opacity;
  
  GLfloat drag;
  GLfloat energyRegen;
  GLfloat shieldRegen;
  GLfloat armorRegen;
}

@property (readwrite) GLfloat size;
@property (readwrite) GLfloat drag;
@property (readwrite) GLfloat energyRegen;
@property (readwrite) GLfloat shieldRegen;
@property (readwrite) GLfloat armorRegen;

- (id)initWithDictionary:(NSDictionary *)data;

@end
