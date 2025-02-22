db = db.getSiblingDB('auth');

db.users.drop();
db.apps.drop();

print("Migration 1_init.down.js applied");