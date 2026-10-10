import {books as originalBooks} from './books-data.c77162e6acd9.js';
const artwork = {"1":{"cover":"assets/read-wc-cover-l2-color-v3-fast1.webp","pdf":"assets/read-wc-l2-color-v3-fast1.pdf","images":["assets/read-wc-art-l1-01-v1-fast1.webp","assets/read-wc-art-l1-02-v1-fast1.webp","assets/read-wc-art-l1-03-v1-fast1.webp","assets/read-wc-art-l1-04-v1-fast1.webp","assets/read-wc-art-l1-05-v1-fast1.webp","assets/read-wc-art-l1-06-v1-fast1.webp","assets/read-wc-art-l1-07-v1-fast1.webp","assets/read-wc-art-l1-08-v1-fast1.webp"]},"2":{"cover":"assets/read-wc-cover-l1-color-v3-fast1.webp","pdf":"assets/read-wc-l1-color-v3-fast1.pdf","images":["assets/read-wc-art-l2-01-v1-fast1.webp","assets/read-wc-art-l2-02-v1-fast1.webp","assets/read-wc-art-l2-03-v1-fast1.webp","assets/read-wc-art-l2-04-v1-fast1.webp","assets/read-wc-art-l2-05-v1-fast1.webp","assets/read-wc-art-l2-06-v1-fast1.webp","assets/read-wc-art-l2-07-v1-fast1.webp"]},"3":{"cover":"assets/read-wc-cover-l3-color-v2-fast1.webp","pdf":"assets/read-wc-l3-color-v2-fast1.pdf","images":["assets/read-wc-art-l3-01-v1-fast1.webp","assets/read-wc-art-l3-02-v1-fast1.webp","assets/read-wc-art-l3-03-v1-fast1.webp","assets/read-wc-art-l3-04-v1-fast1.webp","assets/read-wc-art-l3-05-v1-fast1.webp","assets/read-wc-art-l3-06-v1-fast1.webp","assets/read-wc-art-l3-07-v1-fast1.webp","assets/read-wc-art-l3-08-v1-fast1.webp"]},"4":{"cover":"assets/read-wc-cover-l4-color-v2-fast1.webp","pdf":"assets/read-wc-l4-color-v2-fast1.pdf","images":["assets/read-wc-art-l4-01-v1-fast1.webp","assets/read-wc-art-l4-02-v1-fast1.webp","assets/read-wc-art-l4-03-v1-fast1.webp","assets/read-wc-art-l4-04-v1-fast1.webp","assets/read-wc-art-l4-05-v1-fast1.webp","assets/read-wc-art-l4-06-v1-fast1.webp","assets/read-wc-art-l4-07-v1-fast1.webp","assets/read-wc-art-l4-08-v1-fast1.webp"]},"5":{"cover":"assets/read-wc-cover-l5-color-v2-fast1.webp","pdf":"assets/read-wc-l5-color-v2-fast1.pdf","images":["assets/read-wc-art-l5-01-v1-fast1.webp","assets/read-wc-art-l5-02-v1-fast1.webp","assets/read-wc-art-l5-03-v1-fast1.webp","assets/read-wc-art-l5-04-v1-fast1.webp","assets/read-wc-art-l5-05-v1-fast1.webp","assets/read-wc-art-l5-06-v1-fast1.webp","assets/read-wc-art-l5-07-v1-fast1.webp","assets/read-wc-art-l5-08-v1-fast1.webp"]},"6":{"cover":"assets/read-wc-cover-l6-color-v2-fast1.webp","pdf":"assets/read-wc-l6-color-v2-fast1.pdf","images":["assets/read-wc-art-l6-01-v1-fast1.webp","assets/read-wc-art-l6-02-v1-fast1.webp","assets/read-wc-art-l6-03-v1-fast1.webp","assets/read-wc-art-l6-04-v1-fast1.webp","assets/read-wc-art-l6-05-v1-fast1.webp","assets/read-wc-art-l6-06-v1-fast1.webp","assets/read-wc-art-l6-07-v1-fast1.webp"]},"0":{"cover":"assets/read-wc-cover-words-color-v2-fast1.webp","pdf":"assets/read-wc-words-color-v2-fast1.pdf","images":["assets/read-wc-art-w-01-v1-fast1.webp","assets/read-wc-art-w-02-v1-fast1.webp","assets/read-wc-art-w-03-v1-fast1.webp","assets/read-wc-art-w-04-v1-fast1.webp","assets/read-wc-art-w-05-v1-fast1.webp","assets/read-wc-art-w-06-v1-fast1.webp","assets/read-wc-art-w-07-v1-fast1.webp","assets/read-wc-art-w-08-v1-fast1.webp","assets/read-wc-art-w-09-v1-fast1.webp","assets/read-wc-art-w-10-v1-fast1.webp","assets/read-wc-art-w-11-v1-fast1.webp","assets/read-wc-art-w-12-v1-fast1.webp","assets/read-wc-art-w-13-v1-fast1.webp","assets/read-wc-art-w-14-v1-fast1.webp"]}};
export const storyBooks = originalBooks.map(book => {
 const level=book.level===1?2:book.level===2?1:book.level;
 return {...book,level,id:`sperm-whale-cartoon-level-${level}`,cover:artwork[book.level].cover,pdf:artwork[book.level].pdf,pages:book.pages.map((page,index)=>({...page,image:artwork[book.level].images[index]}))};
}).sort((a,b)=>a.level-b.level);
export const wordsBook = {
  "id": "sperm-whale-cartoon-words",
  "kind": "words",
  "level": 0,
  "title": "Deep-Sea Words",
  "color": "#32677b",
  "cover": "assets/read-wc-cover-words-color-v2-fast1.webp",
  "pdf": "assets/read-wc-words-color-v2-fast1.pdf",
  "audio": "assets/read-continuous-d4336fa2a6-v1.mp3",
  "pages": [
    {
      "number": 1,
      "text": "deep",
      "image": "assets/read-wc-art-w-01-v1-fast1.webp",
      "audio": "assets/read-wc-w-01-v1-fast1.mp3",
      "duration": 0.545,
      "words": [
        {
          "text": "deep",
          "start": 0,
          "end": 0.23
        }
      ]
    },
    {
      "number": 2,
      "text": "dark",
      "image": "assets/read-wc-art-w-02-v1-fast1.webp",
      "audio": "assets/read-wc-w-02-v1-fast1.mp3",
      "duration": 0.74,
      "words": [
        {
          "text": "dark",
          "start": 0,
          "end": 0.35
        }
      ]
    },
    {
      "number": 3,
      "text": "sperm whale",
      "image": "assets/read-wc-art-w-03-v1-fast1.webp",
      "audio": "assets/read-wc-w-03-v1-fast1.mp3",
      "duration": 1.085,
      "words": [
        {
          "text": "sperm",
          "start": 0,
          "end": 0.49
        },
        {
          "text": "whale",
          "start": 0.49,
          "end": 0.89
        }
      ]
    },
    {
      "number": 4,
      "text": "big",
      "image": "assets/read-wc-art-w-04-v1-fast1.webp",
      "audio": "assets/read-wc-w-04-v1-fast1.mp3",
      "duration": 0.5851666666666666,
      "words": [
        {
          "text": "big",
          "start": 0,
          "end": 0.29
        }
      ]
    },
    {
      "number": 5,
      "text": "teeth",
      "image": "assets/read-wc-art-w-05-v1-fast1.webp",
      "audio": "assets/read-wc-w-05-v1-fast1.mp3",
      "duration": 0.675,
      "words": [
        {
          "text": "teeth",
          "start": 0,
          "end": 0.31
        }
      ]
    },
    {
      "number": 6,
      "text": "dive",
      "image": "assets/read-wc-art-w-06-v1-fast1.webp",
      "audio": "assets/read-wc-w-06-v1-fast1.mp3",
      "duration": 0.8001666666666667,
      "words": [
        {
          "text": "dive",
          "start": 0,
          "end": 0.45
        }
      ]
    },
    {
      "number": 7,
      "text": "giant squid",
      "image": "assets/read-wc-art-w-07-v1-fast1.webp",
      "audio": "assets/read-wc-w-07-v1-fast1.mp3",
      "duration": 1.055,
      "words": [
        {
          "text": "giant",
          "start": 0,
          "end": 0.39
        },
        {
          "text": "squid",
          "start": 0.39,
          "end": 0.81
        }
      ]
    },
    {
      "number": 8,
      "text": "eyes",
      "image": "assets/read-wc-art-w-08-v1-fast1.webp",
      "audio": "assets/read-wc-w-08-v1-fast1.mp3",
      "duration": 0.815,
      "words": [
        {
          "text": "eyes",
          "start": 0,
          "end": 0.43
        }
      ]
    },
    {
      "number": 9,
      "text": "tentacles",
      "image": "assets/read-wc-art-w-09-v1-fast1.webp",
      "audio": "assets/read-wc-w-09-v1-fast1.mp3",
      "duration": 1.1151666666666666,
      "words": [
        {
          "text": "tentacles",
          "start": 0,
          "end": 0.75
        }
      ]
    },
    {
      "number": 10,
      "text": "Humboldt squid",
      "image": "assets/read-wc-art-w-10-v1-fast1.webp",
      "audio": "assets/read-wc-w-10-v1-fast1.mp3",
      "duration": 1.51,
      "words": [
        {
          "text": "Humboldt",
          "start": 0,
          "end": 0.81
        },
        {
          "text": "squid",
          "start": 0.81,
          "end": 1.13
        }
      ]
    },
    {
      "number": 11,
      "text": "red",
      "image": "assets/read-wc-art-w-11-v1-fast1.webp",
      "audio": "assets/read-wc-w-11-v1-fast1.mp3",
      "duration": 0.595,
      "words": [
        {
          "text": "red",
          "start": 0,
          "end": 0.33
        }
      ]
    },
    {
      "number": 12,
      "text": "fast",
      "image": "assets/read-wc-art-w-12-v1-fast1.webp",
      "audio": "assets/read-wc-w-12-v1-fast1.mp3",
      "duration": 0.86,
      "words": [
        {
          "text": "fast",
          "start": 0,
          "end": 0.41
        }
      ]
    },
    {
      "number": 13,
      "text": "swim",
      "image": "assets/read-wc-art-w-13-v1-fast1.webp",
      "audio": "assets/read-wc-w-13-v1-fast1.mp3",
      "duration": 0.715,
      "words": [
        {
          "text": "swim",
          "start": 0,
          "end": 0.41
        }
      ]
    },
    {
      "number": 14,
      "text": "hunt",
      "image": "assets/read-wc-art-w-14-v1-fast1.webp",
      "audio": "assets/read-wc-w-14-v1-fast1.mp3",
      "duration": 0.645,
      "words": [
        {
          "text": "hunt",
          "start": 0,
          "end": 0.31
        }
      ]
    }
  ]
};
export const books = [...storyBooks,wordsBook];
