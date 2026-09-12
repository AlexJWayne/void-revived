//
//    Texture.m
//    Void
//
//    Created for VOID on 9/18/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "Texture.h"

static NSMutableSet *cachedTextures;

@implementation Texture

@synthesize imageName;

+ (void)initialize {
    cachedTextures = [[NSMutableSet alloc] init];
}

+ (void)drainCache {
    [cachedTextures removeAllObjects];
}


+ (Texture *)textureNamed:(NSString *)anImageName {
    for (Texture *tex in cachedTextures) {
        if ([tex.imageName isEqualToString:anImageName]) return tex;
    }
    
    Texture *tex = [[[Texture alloc] initWithImageNamed:anImageName] autorelease];
    [cachedTextures addObject:tex];
    return tex;
}

- (id)initWithImageNamed:(NSString *)anImageName {
    [super init];
    
    NSBundle *bundle = [NSBundle mainBundle];
    imageName = [anImageName retain];
    
    CGImageRef spriteImage = nil;
	CGContextRef spriteContext;
	GLubyte *spriteData;
	size_t	width, height;
    
    NSString *filePath = nil;
    if ([anImageName rangeOfString:@".png"].location == NSNotFound) {
        anImageName = [anImageName stringByAppendingString:@".png"];
    }
    
    // Look for a @2x image for retina screens.
    if ([[UIScreen mainScreen] scale] == 2) {
        NSString *name2x = [anImageName stringByReplacingOccurrencesOfString:@".png" withString:@"@2x.png"];
        filePath = [bundle pathForResource:name2x ofType:nil];
    };
    
    // Look for a non @2x image.
    if (!filePath) {
        filePath = [bundle pathForResource:anImageName ofType:nil];
    }
    
    // Cant find anything, use a default texture.
    if (filePath == nil) {
        filePath = [bundle pathForResource:@"White.png" ofType:nil];
    }
    
    UIImage *spriteUIImage = [[[UIImage alloc] initWithContentsOfFile:filePath] autorelease];
	
    // Creates a Core Graphics image from an image file
	spriteImage = [spriteUIImage CGImage];
    
	// Get the width and height of the image
	width = CGImageGetWidth(spriteImage);
	height = CGImageGetHeight(spriteImage);
	// Texture dimensions must be a power of 2. If you write an application that allows users to supply an image,
	// you'll want to add code that checks the dimensions and takes appropriate action if they are not a power of 2.
    
    NSAssert(spriteImage, @"Unable to load texture from PNG file");
	
    // Allocated memory needed for the bitmap context
    spriteData = (GLubyte *) malloc(width * height * 4);
    // Esnure the bits are set to zeros.
    memset(spriteData, 0, width * height * 4);
    // Uses the bitmatp creation function provided by the Core Graphics framework. 
    spriteContext = CGBitmapContextCreate(spriteData, width, height, 8, width * 4, CGImageGetColorSpace(spriteImage), kCGImageAlphaPremultipliedLast);
    // After you create the context, you can draw the sprite image to the context.
    CGContextDrawImage(spriteContext, CGRectMake(0.0, 0.0, (CGFloat)width, (CGFloat)height), spriteImage);
    // You don't need the context at this point, so you need to release it to avoid memory leaks.
    CGContextRelease(spriteContext);
    
    // Use OpenGL ES to generate a name for the texture.
    glGenTextures(1, &textureName);
    // Bind the texture name. 
    glBindTexture(GL_TEXTURE_2D, textureName);
    
    // Generate MIPMAPS
    glTexParameterf(GL_TEXTURE_2D, GL_GENERATE_MIPMAP, GL_TRUE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    
    // Specify a 2D texture image, providing a pointer to the image data in memory
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, spriteData);
    // Release the image data
    free(spriteData);
    
    // Clamp the texture edges
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    
    return self;
}

- (void)enable {
    [self enableWithSrcFunc:GL_SRC_ALPHA destFunc:GL_ONE_MINUS_SRC_ALPHA];
}

- (void)enableWithSrcFunc:(GLenum)srcFunc destFunc:(GLenum)destFunc {
    // Load the texture as the active texture
    glBindTexture(GL_TEXTURE_2D, textureName);
    
    // Enable texturing of drawn polygons
    glEnable(GL_TEXTURE_2D);
    
    // Set blending function to use alpha of image
    glBlendFunc(srcFunc, destFunc);
    
    // Enable texture blending with the background
    glEnable(GL_BLEND);
}

- (void)disable {
    glDisable(GL_TEXTURE_2D);
}
- (void)dealloc {
    if (imageName) [imageName release];
    NSLog(@"dealloc texture: %@", imageName);
    glDeleteTextures(1, &textureName);
    [super dealloc];
}


@end
