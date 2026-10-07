import {books as whaleBooks, wordbook} from './books-data.899a47c4c2b4.js';
import {books as anglerBooks} from './anglerfish-books.899a47c4c2b4.js';
export const books=[...anglerBooks,...whaleBooks];
export const series=[
 {id:'anglerfish-animation',title:'Anglerfish',version:'Animation',poster:'assets/read-ac-first-frame-v1.jpg',video:'assets/anglerfish-cartoon-wenzhi-v1-mobile.mp4',wordbook:'assets/read-ac-words-v1.pdf',books:anglerBooks},
 {id:'sperm-whale-realistic',title:'Sperm Whale',version:'Realistic',poster:'assets/cover-deep-sea-v9.jpg',wordbook,books:whaleBooks}
];
