//
//  Model3D.m
//  Void
//
//  Created for VOID on 9/23/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Model3D.h"

static NSMutableSet *cachedModels;

@implementation Model3D

@synthesize modelName;

+ (void)initialize {
  cachedModels = [[NSMutableSet alloc] init];
}

+ (Model3D *)modelNamed:(NSString *)aModelName {
  for (Model3D *mdl in cachedModels) {
    if ([mdl.modelName isEqualToString:aModelName]) return mdl;
  }
  return [[[Model3D alloc] initWithModelNamed:aModelName] autorelease];
}

+ (void)drainCache {
  [cachedModels removeAllObjects];
}

- (void)renderWithAlpha:(GLfloat)alpha {
  // Load vertex buffer
  glBindBuffer(GL_ARRAY_BUFFER, modelBuffer);
  glVertexPointer(3, GL_FLOAT, 0, 0);
  glEnableClientState(GL_VERTEX_ARRAY);
  
  // Load normals buffer
  glBindBuffer(GL_ARRAY_BUFFER, normalBuffer);
  glNormalPointer(GL_FLOAT, 0, 0);
  glEnableClientState(GL_NORMAL_ARRAY);
  
  // Load UV buffer
  glBindBuffer(GL_ARRAY_BUFFER, texCoordsBuffer);
  glTexCoordPointer(2, GL_FLOAT, 0, 0);
	glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  
  // Set Color to white
  glColor4f(1.0, 1.0, 1.0, alpha);
  
  // Render
  glDrawArrays(GL_TRIANGLES, 0, faceCount*3);
  
  // Cleanup
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  
}

- (void)render {
  [self renderWithAlpha:1.0];
}

- (void)dealloc {
  NSLog(@"dealloc model: %@", modelName);
  glDeleteBuffers(1, &modelBuffer);
  glDeleteBuffers(1, &normalBuffer);
  glDeleteBuffers(1, &texCoordsBuffer);
  [super dealloc];
}


- (id)initWithModelNamed:(NSString *)aModelName {
  [super init];
  
  modelName = [aModelName retain];
  
  NSString *path = [[NSBundle mainBundle] pathForResource:modelName ofType:@"vmdl"];
  if (path == nil) path = [[NSBundle mainBundle] pathForResource:@"Cone" ofType:@"vmdl"];
  
  NSArray *modelData = [[NSString stringWithContentsOfFile:path usedEncoding:nil error:nil] componentsSeparatedByString:@"\n"];
  
  faceCount = [[modelData objectAtIndex:0] intValue];
  GLfloat vertices[faceCount * 9];
  GLfloat normals[faceCount * 9];
  GLfloat texCoords[faceCount * 6];
  int i;
  
  NSArray *vertData = [[modelData objectAtIndex:1] componentsSeparatedByString:@","];
  for (i = 0; i < faceCount * 9; i++) {
    vertices[i] = [[vertData objectAtIndex:i] floatValue];
  }
  
  NSArray *normalData = [[modelData objectAtIndex:2] componentsSeparatedByString:@","];
  for (i = 0; i < faceCount * 9; i++) {
    normals[i] = [[normalData objectAtIndex:i] floatValue];
  }
  
  NSArray *texData = [[modelData objectAtIndex:3] componentsSeparatedByString:@","];
  for (i = 0; i < faceCount * 6; i++) {
    texCoords[i] = [[texData objectAtIndex:i] floatValue];
  }
  
  // Load buffers
  glGenBuffers(1, &modelBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, modelBuffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  
  glGenBuffers(1, &normalBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, normalBuffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(normals), normals, GL_STATIC_DRAW);
  
  glGenBuffers(1, &texCoordsBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, texCoordsBuffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(texCoords), texCoords, GL_STATIC_DRAW);
  
  
  
  
  //
  // Place holder
  //
  
  
  
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  
  [cachedModels addObject:self];
  return self;
}

@end
