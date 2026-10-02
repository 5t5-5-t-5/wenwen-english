import * as deepSea from './data.js';
import * as ancientOcean from './ancient-data.js';
import {assetURL} from './paths.js';
export const courses = [
  {...deepSea,lesson:{...deepSea.lesson,tags:'海洋 · 动物 · 自然',tracks:{en:assetURL('assets/en-v8.vtt'),zh:assetURL('assets/zh-v8.vtt')},chapters:[[0,'一起潜入深海'],[8,'认识抹香鲸'],[19,'大王乌贼的秘密'],[27,'会变色的洪堡鱿鱼'],[35,'深海里的追逐'],[41,'轮到你说单词'],[57,'和海洋朋友说再见']]}},
  ancientOcean
];
export const courseById = id => courses.find(c=>c.lesson.id===id);
