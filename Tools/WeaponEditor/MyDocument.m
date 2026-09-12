//
//  MyDocument.m
//  WeaponEditor
//
//  Created for VOID on 9/30/08.
//  Copyright __MyCompanyName__ 2008 . All rights reserved.
//

#import "MyDocument.h"

@implementation MyDocument

- (id)init {
  self = [super init];
  if (self) {
    weapons = [[NSMutableArray alloc] init];
  }
  return self;
}

- (void)setWeapons:(NSMutableArray *)a {
  if (a == weapons) return;
  [a retain];
  [weapons release];
  weapons = a;
}

- (NSString *)windowNibName
{
    // Override returning the nib file name of the document
    // If you need to use a subclass of NSWindowController or if your document supports multiple NSWindowControllers, you should remove this method and override -makeWindowControllers instead.
    return @"MyDocument";
}

- (void)windowControllerDidLoadNib:(NSWindowController *) aController
{
    [super windowControllerDidLoadNib:aController];
    // Add any code here that needs to be executed once the windowController has loaded the document's window.
}

- (BOOL)writeToURL:(NSURL *)absoluteURL ofType:(NSString *)typeName error:(NSError **)outError {
  NSMutableDictionary *output = [[NSMutableDictionary alloc] init];
  for (Weapon *weapon in weapons) {
    [output setObject:[weapon dictionary] forKey:weapon.name];
  }
  [output writeToURL:absoluteURL atomically:YES];
  return YES;
}

- (BOOL)readFromURL:(NSURL *)absoluteURL ofType:(NSString *)typeName error:(NSError **)outError {
  NSMutableArray *newWeapons = [[NSMutableArray alloc] init];
  NSDictionary *file = [NSDictionary dictionaryWithContentsOfURL:absoluteURL];
  for (NSString *name in [file allKeys]) {
    [newWeapons addObject:[[Weapon alloc] initWithDictionary:[file objectForKey:name] name:name]];
  }
  [self setWeapons:newWeapons];
  [newWeapons release];
  
  
  if (outError != NULL) {
		*outError = [NSError errorWithDomain:NSOSStatusErrorDomain code:unimpErr userInfo:NULL];
	}
  return YES;
}

@end
