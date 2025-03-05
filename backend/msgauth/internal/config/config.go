// Парсинг конфигов

package config

import (
	"flag"
	"os"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

// Config - go структура конфига со стракт-тегами для дальнейшего парсинга
type Config struct {
	Env         string        `yaml:"env" env-default:"local"` // для парсинга файла через cleanenv
	TokenTTL    time.Duration `yaml:"token_ttl" env-required:"true"`
	GRPC        GRPCConfig    `yaml:"grpc"`
	AppSecret   string
	StoragePath string
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

	//godotenv.Load()
	return MustLoadByPath(path)
}

func MustLoadByPath(configPath string) *Config {
	// через os Stat проверяется, существует ли файл в данной директории

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		panic("config file does not exist")
	}

	var cfg Config
	// парсинг в структуру через cleanenv и обработка ошибки
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		panic("cannot read config: " + err.Error())
	}
	godotenv.Load()
	cfg.StoragePath = os.Getenv("STORAGE_PATH")
	cfg.AppSecret = os.Getenv("APP_SECRET")
	if cfg.StoragePath == "" || cfg.AppSecret == "" {
		panic("cannot get .env")
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
