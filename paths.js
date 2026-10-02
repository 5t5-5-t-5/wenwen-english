// Paths are relative to the application, so a static host or a subdirectory works.
export const appBase = new URL('./', import.meta.url);
export const assetURL = path => new URL(path.replace(/^\/+/, ''), appBase).href;
export const routeURL = route => `${appBase.pathname}#${route.startsWith('/')?route:`/${route}`}`;
export function currentRoute(locationLike=location){
  const hash=locationLike.hash.slice(1);
  return ['/','/lesson/deep-sea','/lesson/ancient-ocean','/review','/review/deep-sea','/review/ancient-ocean'].includes(hash)?hash:'/';
}
