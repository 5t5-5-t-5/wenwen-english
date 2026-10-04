import * as deepSea from './data.9e24cd868e07.js';
import * as ancientOcean from './ancient-data.9e24cd868e07.js';
import * as greenlandShark from './greenland-data.9e24cd868e07.js';
import * as trex from './trex-data.9e24cd868e07.js';
import * as carnotaurus from './carnotaurus-data.9e24cd868e07.js';
import {assetURL} from './paths.9e24cd868e07.js';
export const courses = [
  {...deepSea,lesson:{...deepSea.lesson,tags:'海洋 · 动物 · 自然',tracks:{en:assetURL('assets/en-v9.vtt'),zh:assetURL('assets/zh-v9.vtt')},chapters:[[0,'一起潜入深海'],[8,'认识抹香鲸'],[19,'大王乌贼的秘密'],[27,'会变色的洪堡鱿鱼'],[35,'深海里的追逐'],[41,'轮到你说单词'],[57,'和海洋朋友说再见']]}},
  ancientOcean,
  greenlandShark,
  trex,
  carnotaurus
];
export const courseById = id => courses.find(c=>c.lesson.id===id);
