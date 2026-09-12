//
//  GenericButton.m
//  Void
//
//  Created for VOID on 10/31/08.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "GenericButton.h"


@implementation GenericButton


- (id)initWithCoder:(NSCoder*)coder {
  if ((self = [super initWithCoder:coder])) {
    [self setBackgroundImage:[[UIImage imageNamed:@"GeneralButtonNormal.png"] stretchableImageWithLeftCapWidth:12.0 topCapHeight:0.0] forState:UIControlStateNormal];
    [self setBackgroundImage:[[UIImage imageNamed:@"GeneralButtonHighlighted.png"] stretchableImageWithLeftCapWidth:12.0 topCapHeight:0.0] forState:UIControlStateHighlighted];
    [self setBackgroundImage:[[UIImage imageNamed:@"GeneralButtonDisabled.png"] stretchableImageWithLeftCapWidth:12.0 topCapHeight:0.0] forState:UIControlStateDisabled];
    
    [self setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    [self setTitleColor:[UIColor grayColor] forState:UIControlStateDisabled];
    
    [self setTitleShadowColor:[UIColor colorWithRed:0 green:0.043 blue:0.25 alpha:1.0] forState:UIControlStateNormal];
    [self setTitleShadowOffset:CGSizeMake(0.0, -1.0)];
  }
  return self;
}

- (void)dealloc {
    [super dealloc];
}


@end
