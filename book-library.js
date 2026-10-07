import {books as whaleBooks, wordbook} from './books-data.607087d02d5a.js';
import {books as anglerBooks} from './anglerfish-books.607087d02d5a.js';
export const books=[...anglerBooks,...whaleBooks];
export const series=[
 {id:'anglerfish-animation',title:'Anglerfish',version:'Animation',poster:'assets/read-ac-first-frame-v1.jpg',video:'assets/anglerfish-cartoon-wenzhi-v1-mobile.mp4',wordbook:'assets/read-ac-words-v1.pdf',books:anglerBooks},
 {id:'sperm-whale-realistic',title:'Sperm Whale',version:'Realistic',poster:'assets/cover-deep-sea-v9.jpg',wordbook,books:whaleBooks}
];
