db = db.getSiblingDB("poker_db");

db.createUser({
  user: "marcel",
  pwd: "123_soleil",
  roles: [
    {
      role: 'readWrite',
      db: 'poker_db'
    },
  ],
});

db.createCollection("tables_collection");

db.tables_collection.insertMany([
  {
    name: "Noobs",
    small_blind: 10,
    big_blind: 20
  },
  {
    name: "Rookies",
    small_blind: 20,
    big_blind: 40
  },
  {
    name: "Masters",
    small_blind: 100,
    big_blind: 200
  }
]);
