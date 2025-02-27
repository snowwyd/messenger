package models

type App struct {
	ID     string `bson:"_id, omitempty"`
	Name   string `bson:"name"`
	Secret string `bson:"app_secret"` // AppSecret для подписи токенов и валидации их на клиентской стороне
}
