package models

type User struct {
	ID       string `bson:"_id"`
	Email    string `bson:"email"`
	PassHash []byte `bson:"passHash"` // Для обеспечения безопасности
	IsAdmin  bool   `bson:"is_admin,omitempty"`
}
