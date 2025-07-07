package domain

import "go.mongodb.org/mongo-driver/bson/primitive"

type MongoUser struct {
	ID       primitive.ObjectID `bson:"_id"`
	Email    string             `bson:"email"`
	Username string             `bson:"username"`
	PassHash []byte             `bson:"passHash"`
}
