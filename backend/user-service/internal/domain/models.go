package domain

type User struct {
	ID       string `bson:"_id,omitempty"`
	Email    string `bson:"email,omitempty"`
	PassHash []byte `bson:"passHash"`
	IsAdmin  bool   `bson:"is_admin,omitempty"`
	Username string `bson:"username"`
}
