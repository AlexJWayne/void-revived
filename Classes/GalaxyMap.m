//
//    GalaxyMap.m
//    Void
//
//    Created for VOID on 10/9/08.
//    Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "GalaxyMap.h"
#import "Utility.h"

@implementation GalaxyMap

@synthesize highlightStage;

- (id)initWithCoder:(NSCoder *)coder {
    if (self = [super initWithCoder:coder]) {
        stages = [Utility dataFile:@"Stages"];
        
        Player *player = [[Player alloc] init];
        self.highlightStage = player.currentStage;
        [player release];
        
        stageHighliter = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"StageHighlight.png"]];
        [self addSubview:stageHighliter];
        [self sendSubviewToBack:stageHighliter];
    }
    return self;
}

#define STAGE_SIZE 12.0

- (void)drawRect:(CGRect)rect {
    CGContextRef context = UIGraphicsGetCurrentContext();
    
    Player *player = [[[Player alloc] init] autorelease];
    
    // Setup
	CGContextSetLineWidth(context, 2.0);
    
    // Draw background
    CGContextDrawImage(context, rect, [UIImage imageNamed:@"GalaxyMap.png"].CGImage);

    // Draw player location
    [self highlightStage:self.highlightStage];
    
    // Draw connections
    for (NSString *stageName in [stages allKeys]) {
        NSDictionary *stageData = [stages objectForKey:stageName];
        CGPoint stagePos = [self stageLocation:stageName];
        
        for (NSString *connectedToStageNamed in [stageData objectForKey:@"connections"]) {
            if ([player.completedStages indexOfObject:stageName] != NSNotFound || [player.completedStages indexOfObject:connectedToStageNamed] != NSNotFound) {
                CGContextSetRGBStrokeColor(context, 1.0, 1.0, 1.0, 0.75);
            } else {
                CGContextSetRGBStrokeColor(context, 1.0, 1.0, 1.0, 0.0);
            }
            
            CGPoint targetPos = [self stageLocation:connectedToStageNamed];
            CGContextMoveToPoint(context, stagePos.x, stagePos.y);
            CGContextAddLineToPoint(context, targetPos.x, targetPos.y);
            CGContextStrokePath(context);
        }
    }
    
    // Draw stage circles
    for (NSString *stageName in [stages allKeys]) {
        CGPoint stagePos = [self stageLocation:stageName];
        int zone = [[[stages objectForKey:stageName] objectForKey:@"zone"] intValue];
        float fade = [[[stages objectForKey:stageName] objectForKey:@"tier"] floatValue] / 5.0;
        
        float r;
        float g;
        float b;
        
        switch (zone) {
            case 0: // Uninhabited
                r = 0.8; g = 0.8; b = 0.8; break;
                
            case 1: // Cyber
                r = 1.0; g = 0; b = 0; break;
                
            case 2: // Crystal
                r = 0; g = 1.0; b = 0; break;
                
            case 3: // Organic
                r = 1.0; g = 0.4; b = 0; break;
                
            case 4: // Energy
                r = 0; g = 0.4; b = 1.0; break;
                
            default:
                break;
        }
        
        CGContextSetRGBFillColor(context, r*fade, g*fade, b*fade, 1.0);
        
        if ([player.completedStages indexOfObject:stageName] != NSNotFound || [stageName isEqualToString:@"Discipulus Minor"]) {
            // player has completed this stage
            CGContextSetRGBStrokeColor(context, 1.0, 1.0, 1.0, 1.0);
        } else {
            // player has not completed this stage
            CGContextSetRGBStrokeColor(context, 1.0, 1.0, 1.0, 0.25);
        }
        
        float size;
        if (fade == 1.0) {
            size = STAGE_SIZE * 1.5;
        } else {
            size = STAGE_SIZE;
        }
        
        CGContextFillEllipseInRect(    context, CGRectMake(stagePos.x - size/2, stagePos.y - size/2, size, size));
        CGContextStrokeEllipseInRect(context, CGRectMake(stagePos.x - size/2, stagePos.y - size/2, size, size));
    }
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
    CGPoint touchPos = [[touches anyObject] locationInView:self];
    NSString *stageName = [self stageNameAtLocation:touchPos];
    if (stageName) [delegate tappedStage:stageName];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    [self touchesMoved:touches withEvent:event];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event {
    if ([delegate shouldHighlightNewStage]) {
        NSString *oldStage = [self.highlightStage copy];
        self.highlightStage = [self stageNameAtLocation:[[touches anyObject] locationInView:self]];
        if (![oldStage isEqualToString:self.highlightStage]) [self highlightStage:self.highlightStage];
        [oldStage release];        
    }
}

- (void)highlightStage:(NSString *)stageName {
    CGPoint stagePos = [self stageLocation:stageName];
    
    [UIView beginAnimations:@"stageHighlighterMove" context:nil];
        [UIView setAnimationBeginsFromCurrentState:YES];
        [UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
        [UIView setAnimationDuration:0.15];
        stageHighliter.frame = CGRectMake(stagePos.x - stageHighliter.frame.size.width/2,
                                                                            stagePos.y - stageHighliter.frame.size.height/2,
                                                                            stageHighliter.frame.size.width,
                                                                            stageHighliter.frame.size.height);
    [UIView commitAnimations];
}


    
    
- (CGPoint)stageLocation:(NSString *)stageName {
    NSDictionary *stageData = [stages objectForKey:stageName];
    return CGPointMake([[stageData valueForKeyPath:@"galaxyPosition.x"] floatValue], [[stageData valueForKeyPath:@"galaxyPosition.y"] floatValue]);
}

- (NSString *)stageNameAtLocation:(CGPoint)location {
    float closestDistance = 64.0;
    NSString *closestStageName = nil;
    
    for (NSString *stageName in [stages allKeys]) {
        CGPoint stagePos = [self stageLocation:stageName];
        
        float distance = sqrt(pow(location.x - stagePos.x, 2) + pow(location.y - stagePos.y, 2));
        
        if (distance < closestDistance) {
            closestDistance = distance;
            
            if (closestStageName) [closestStageName release];
            closestStageName = [stageName retain];
        }
    }
    
    if (closestStageName) {
        return [closestStageName autorelease];
    } else {
        return nil;
    }
}


- (void)dealloc {
    //[stages release];
    [highlightStage release];
    [stageHighliter release];
    [super dealloc];
}


@end
