import {books as originalWhaleCartoonBooks, wordsBook as whaleWords} from './whale-cartoon-books.fe4ffcab4b63.js';
import {books as originalWhaleBooks, wordbook} from './books-data.fe4ffcab4b63.js';
import {books as originalAnglerBooks, wordsBook as anglerWords} from './anglerfish-books.fe4ffcab4b63.js';
import {squareBookCovers} from './square-book-covers.fe4ffcab4b63.js';
const withSquareCovers = items => items.map(book => squareBookCovers[book.id] ? {...book,...squareBookCovers[book.id]} : book);
const whaleCartoonBooks = withSquareCovers(originalWhaleCartoonBooks);
const whaleBooks = withSquareCovers(originalWhaleBooks);
const anglerBooks = withSquareCovers(originalAnglerBooks);
export const books=[...whaleCartoonBooks,...anglerBooks,...whaleBooks];
export const series=[
 {id:'sperm-whale-animation',title:'Sperm Whale',version:'Animation',poster:'assets/read-wc-first-frame-v1-fast1.webp',audio:'assets/read-series-whale-full-video-v1.mp3',wordbook:whaleWords.pdf,books:whaleCartoonBooks},
 {id:'anglerfish-animation',title:'Anglerfish',version:'Animation',poster:'assets/read-ac-first-frame-v1.jpg',audio:'assets/read-series-anglerfish-full-video-v1.mp3',video:'assets/anglerfish-cartoon-wenzhi-v1-mobile.mp4',wordbook:anglerWords.pdf,books:anglerBooks},
 {id:'sperm-whale-realistic',title:'Sperm Whale',version:'Realistic',poster:'assets/cover-deep-sea-v9.jpg',wordbook,books:whaleBooks}
];
