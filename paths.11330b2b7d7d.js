import {fastAssets} from './fast-assets.11330b2b7d7d.js';
// Paths are relative to the application, so a static host or a subdirectory works.
export const appBase = new URL('./', import.meta.url);
export const assetURL = path => {const clean=path.replace(/^\/+/, '');return new URL(fastAssets[clean]||clean,appBase).href;};
export const routeURL = route => `${appBase.pathname}#${route.startsWith('/')?route:`/${route}`}`;
export function currentRoute(locationLike=location){
  const hash=locationLike.hash.slice(1);
  if(hash==='/books'||/^\/books\/(?:level-[1-6]|anglerfish-cartoon-level-[1-6]|sperm-whale-cartoon-level-[1-6]|sperm-whale-cartoon-words|anglerfish-cartoon-words)(?:\/\d+)?$/.test(hash))return hash;
  return ['/','/lesson/deep-sea','/lesson/ancient-ocean','/lesson/greenland-shark','/lesson/anglerfish','/lesson/t-rex','/lesson/carnotaurus','/review','/review/deep-sea','/review/ancient-ocean','/review/greenland-shark','/review/anglerfish','/review/t-rex','/review/carnotaurus'].includes(hash)?hash:'/';
}
