// Парсинг конфигов

package config

import (
	"flag"
	"github.com/ilyakaznacheev/cleanenv"
	"os"
	"time"
)

// Config - go структура конфига со стракт-тегами для дальнейшего парсинга
type Config struct {
	Env         string        `yaml:"env" env-default:"local"` // для парсинга файла через cleanenv
	StoragePath string        `yaml:"storage_path" env-required:"true"`
	TokenTTL    time.Duration `yaml:"token_ttl" env-required:"true"`
	GRPC        GRPCConfig    `yaml:"grpc"`
}

// GRPCConfig - go структура grpc со стракт-тегами
type GRPCConfig struct {
	Port    int           `yaml:"port"`
	Timeout time.Duration `yaml:"timeout"`
}

// MustLoad парсит конфиг в структуру Config
func MustLoad() *Config {
	path := fetchConfigPath()
	if path == "" {
		panic("config path is empty")
	}

	// через os Stat проверяется, существует ли файл в данной директории
	if _, err := os.Stat(path); os.IsNotExist(err) {
		panic("config file does not exist" + path)
	}

	var cfg Config

	// парсинг в структуру через cleanenv и обработка ошибки
	if err := cleanenv.ReadConfig(path, &cfg); err != nil {
		panic("failed to read config: " + err.Error())
	}
	return &cfg
}

// fetchConfigPath читает из 1)Флага 2)Переменной окружения параметр и парсит в string
func fetchConfigPath() string {
	var res string

	// Priority: flag > env > default (empty string)

	flag.StringVar(&res, "config", "", "path to config file")
	flag.Parse()

	if res == "" {
		res = os.Getenv("CONFIG_PATH")
	}
	return res
}
