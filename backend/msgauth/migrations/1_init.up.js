db = db.getSiblingDB('auth');

db.createCollection("users");
db.createCollection("apps");

db.users.createIndex({ email: 1 }, { unique: true });
db.apps.createIndex({ name: 1 }, { unique: false });

print("Migration 1_init.up.js applied");
