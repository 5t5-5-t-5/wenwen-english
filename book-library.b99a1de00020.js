import {books as whaleCartoonBooks, wordsBook as whaleWords} from './whale-cartoon-books.b99a1de00020.js';
import {books as whaleBooks, wordbook} from './books-data.b99a1de00020.js';
import {books as anglerBooks, wordsBook as anglerWords} from './anglerfish-books.b99a1de00020.js';
export const books=[...whaleCartoonBooks,...anglerBooks,...whaleBooks];
export const series=[
 {id:'sperm-whale-animation',title:'Sperm Whale',version:'Animation',poster:'assets/read-wc-first-frame-v1-fast1.webp',audio:'assets/read-series-whale-full-video-v1.mp3',wordbook:whaleWords.pdf,books:whaleCartoonBooks},
 {id:'anglerfish-animation',title:'Anglerfish',version:'Animation',poster:'assets/read-ac-first-frame-v1.jpg',audio:'assets/read-series-anglerfish-full-video-v1.mp3',video:'assets/anglerfish-cartoon-wenzhi-v1-mobile.mp4',wordbook:anglerWords.pdf,books:anglerBooks},
 {id:'sperm-whale-realistic',title:'Sperm Whale',version:'Realistic',poster:'assets/cover-deep-sea-v9.jpg',wordbook,books:whaleBooks}
];
