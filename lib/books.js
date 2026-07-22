const THEMES = [
  "Family Drama", "Historical Fiction", "Mystery & Suspense", "Fantasy", "Romance",
  "Science Fiction", "Memoir & Biography", "Social Justice", "Coming of Age", "War & Conflict",
  "Immigration & Identity", "Grief & Loss", "Humor & Satire", "Mythology & Folklore",
  "Psychological Depth", "Adventure & Survival"
];

const CURATED_BOOKS = [
  { id: "b1", title: "Where the Crawdads Sing", author: "Delia Owens", pages: 370, themes: ["Mystery & Suspense", "Coming of Age", "Grief & Loss"] },
  { id: "b2", title: "The Kite Runner", author: "Khaled Hosseini", pages: 371, themes: ["Family Drama", "War & Conflict", "Immigration & Identity"] },
  { id: "b3", title: "Circe", author: "Madeline Miller", pages: 393, themes: ["Mythology & Folklore", "Fantasy", "Coming of Age"] },
  { id: "b4", title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", pages: 400, themes: ["Romance", "Family Drama", "Psychological Depth"] },
  { id: "b5", title: "Project Hail Mary", author: "Andy Weir", pages: 496, themes: ["Science Fiction", "Adventure & Survival", "Humor & Satire"] },
  { id: "b6", title: "Educated", author: "Tara Westover", pages: 334, themes: ["Memoir & Biography", "Family Drama", "Coming of Age"] },
  { id: "b7", title: "The Silent Patient", author: "Alex Michaelides", pages: 336, themes: ["Mystery & Suspense", "Psychological Depth"] },
  { id: "b8", title: "Pachinko", author: "Min Jin Lee", pages: 490, themes: ["Historical Fiction", "Immigration & Identity", "Family Drama"] },
  { id: "b9", title: "The Song of Achilles", author: "Madeline Miller", pages: 416, themes: ["Mythology & Folklore", "Romance", "War & Conflict"] },
  { id: "b10", title: "Klara and the Sun", author: "Kazuo Ishiguro", pages: 303, themes: ["Science Fiction", "Grief & Loss", "Psychological Depth"] },
  { id: "b11", title: "Beach Read", author: "Emily Henry", pages: 361, themes: ["Romance", "Humor & Satire", "Grief & Loss"] },
  { id: "b12", title: "The Nightingale", author: "Kristin Hannah", pages: 440, themes: ["War & Conflict", "Historical Fiction", "Family Drama"] },
  { id: "b13", title: "Gone Girl", author: "Gillian Flynn", pages: 419, themes: ["Mystery & Suspense", "Psychological Depth"] },
  { id: "b14", title: "The House in the Cerulean Sea", author: "TJ Klune", pages: 396, themes: ["Fantasy", "Humor & Satire", "Family Drama"] },
  { id: "b15", title: "Between the World and Me", author: "Ta-Nehisi Coates", pages: 176, themes: ["Social Justice", "Memoir & Biography"] },
  { id: "b16", title: "The Midnight Library", author: "Matt Haig", pages: 304, themes: ["Fantasy", "Psychological Depth", "Grief & Loss"] },
  { id: "b17", title: "American Dirt", author: "Jeanine Cummins", pages: 400, themes: ["Immigration & Identity", "Adventure & Survival", "Family Drama"] },
  { id: "b18", title: "The Vanishing Half", author: "Brit Bennett", pages: 352, themes: ["Family Drama", "Social Justice", "Coming of Age"] },
  { id: "b19", title: "Malibu Rising", author: "Taylor Jenkins Reid", pages: 373, themes: ["Family Drama", "Romance"] },
  { id: "b20", title: "The Martian", author: "Andy Weir", pages: 384, themes: ["Science Fiction", "Adventure & Survival", "Humor & Satire"] },
  { id: "b21", title: "Little Fires Everywhere", author: "Celeste Ng", pages: 338, themes: ["Family Drama", "Social Justice"] },
  { id: "b22", title: "The Alchemist", author: "Paulo Coelho", pages: 208, themes: ["Adventure & Survival", "Mythology & Folklore", "Coming of Age"] },
  { id: "b23", title: "Homegoing", author: "Yaa Gyasi", pages: 305, themes: ["Historical Fiction", "Family Drama", "Social Justice"] },
  { id: "b24", title: "A Man Called Ove", author: "Fredrik Backman", pages: 337, themes: ["Humor & Satire", "Grief & Loss", "Family Drama"] },
  { id: "b25", title: "The Guest List", author: "Lucy Foley", pages: 320, themes: ["Mystery & Suspense", "Romance"] },
  { id: "b26", title: "Piranesi", author: "Susanna Clarke", pages: 245, themes: ["Fantasy", "Mystery & Suspense", "Psychological Depth"] },
  { id: "b27", title: "Untamed", author: "Glennon Doyle", pages: 352, themes: ["Memoir & Biography", "Social Justice", "Psychological Depth"] },
  { id: "b28", title: "The Book Thief", author: "Markus Zusak", pages: 552, themes: ["War & Conflict", "Historical Fiction", "Grief & Loss"] }
];

module.exports = { THEMES, CURATED_BOOKS };
