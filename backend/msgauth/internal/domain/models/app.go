package models

type App struct {
	ID     string
	Name   string
	Secret string // AppSecret для подписи токенов и валидации их на клиентской стороне
}
