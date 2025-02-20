package models

type User struct {
	ID       string
	Email    string
	PassHash []byte // Для обеспечения безопасности
	IsAdmin  bool   `bson:"is_admin,omitempty"`
}
