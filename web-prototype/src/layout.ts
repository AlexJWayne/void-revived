export const GAME_WIDTH=480;
export const GAME_HEIGHT=320;

export interface ViewportSize {width:number;height:number}
export interface ViewportMetrics {
  layout:ViewportSize;
  visual?:ViewportSize;
  screen:ViewportSize;
  standalone:boolean;
  landscape:boolean;
}

export function resolveViewport(metrics:ViewportMetrics):ViewportSize {
  if(!metrics.standalone)return metrics.layout;
  const screen=metrics.landscape
    ? {width:Math.max(metrics.screen.width,metrics.screen.height),height:Math.min(metrics.screen.width,metrics.screen.height)}
    : {width:Math.min(metrics.screen.width,metrics.screen.height),height:Math.max(metrics.screen.width,metrics.screen.height)};
  return {
    width:Math.min(metrics.layout.width,metrics.visual?.width??Infinity,screen.width),
    height:Math.min(metrics.layout.height,metrics.visual?.height??Infinity,screen.height)
  };
}

export function isLandscapeViewport(width:number,height:number,angle:number) {
  return Math.abs(angle)%180===90||width>height;
}

export function fitGame(availableWidth:number,availableHeight:number) {
  const scale=Math.min(availableWidth/GAME_WIDTH,availableHeight/GAME_HEIGHT);
  return {width:GAME_WIDTH*scale,height:GAME_HEIGHT*scale};
}
