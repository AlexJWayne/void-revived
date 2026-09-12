//
//    StarField.m
//    GLBalls
//
//    Created for VOID on 9/14/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "StarField.h"
#import "Game.h"

@implementation StarField

@synthesize pos, spawnArea, qty;

- (id)initWithPos:(Vector *)position quantity:(int)numberOfStars spawnArea:(Vector *)aSpawnArea sizeMin:(GLfloat)min sizeMax:(GLfloat)max {
    [super init];
    
    pos       = [[Vector alloc] initWithVector:position];
    spawnArea = [[Vector alloc] initWithVector:aSpawnArea];
    qty       = numberOfStars;
    minSize   = min;
    maxSize   = max;
    
    // allocate vertex array
    GLfloat vertices[qty * 3];
    GLubyte colors[qty * 12];
    GLfloat sizes[qty];
    
    // temp vectors to hold coordinates of points.
    Vector *starPos = [[[Vector alloc] init] autorelease];
    Vector *defaultPosition = [[[Vector alloc] initWithX:1000.0 y:1000.0 z:1000.0] autorelease];
    
    CGFloat scaleFactor = [Game sharedGame].screenScaleFactor;
        
    // generate stars
    for (int i = 0; i < qty; i++) {
        // generate random position
        [starPos setValuesToVector:defaultPosition];
        
        while ([starPos length] > 80.0) {
            starPos.x = ((GLfloat)rand()/RAND_MAX * 2 - 1) * spawnArea.x;
            starPos.y = ((GLfloat)rand()/RAND_MAX * 2 - 1) * spawnArea.y;
            starPos.z = ((GLfloat)rand()/RAND_MAX * 2 - 1) * spawnArea.z;            
        }
        [starPos add:pos];
                
        // Create vertex array entries
        int offset;
        
        offset = i*3;
        vertices[offset + 0] = starPos.x;
        vertices[offset + 1] = starPos.y;
        vertices[offset + 2] = starPos.z;
        
        // Generate colors
        GLubyte brightness = rand() % 200;
        offset = i*4;
        colors[offset + 0] = brightness + rand() % 55;
        colors[offset + 1] = brightness + rand() % 55;
        colors[offset + 2] = brightness + rand() % 55;
        colors[offset + 3] = 255;
        
        // Generate sizes
        sizes[i] = ((rand() % 2) + 1.5) * scaleFactor;
    }
    
    // Load vertices into vertex buffer
    glGenBuffers(1, &modelBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, modelBuffer);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    
    // Load colors into buffer
    glGenBuffers(1, &colorBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, colorBuffer);
    glBufferData(GL_ARRAY_BUFFER, sizeof(colors), colors, GL_STATIC_DRAW);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    
    // Load sizes into buffer
    glGenBuffers(1, &sizeBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, sizeBuffer);
    glBufferData(GL_ARRAY_BUFFER, sizeof(sizes), sizes, GL_STATIC_DRAW);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    
    return self;
}

- (void)update {
    //...
}

- (void)render {
    [benchUpdate start];
    
    // Position
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    
    // Load vertex buffer
    glBindBuffer(GL_ARRAY_BUFFER, modelBuffer);
    glVertexPointer(3, GL_FLOAT, 0, 0);
    glEnableClientState(GL_VERTEX_ARRAY);
    
    // Load colors buffer
    glBindBuffer(GL_ARRAY_BUFFER, colorBuffer);
    glColorPointer(4, GL_UNSIGNED_BYTE, 0, 0);
    glEnableClientState(GL_COLOR_ARRAY);
    
    // Load sizes buffer
    glBindBuffer(GL_ARRAY_BUFFER, sizeBuffer);
    glPointSizePointerOES(GL_FLOAT, 0, 0);
    glEnableClientState(GL_POINT_SIZE_ARRAY_OES);
    
    // Render
    glDrawArrays(GL_POINTS, 0, qty);
    
    // Cleanup
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glDisableClientState(GL_COLOR_ARRAY);
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_POINT_SIZE_ARRAY_OES);
    
    [benchUpdate stop];
}

- (void)dealloc {
    [pos release];
    [spawnArea release];
    [super dealloc];
}

@end
