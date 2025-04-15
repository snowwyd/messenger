package config

import (
	"flag"
	"os"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

type Config struct {
	DotEnv DotEnvConfig
	Yaml   YamlConfig `yaml:"config"`
}

// Config opts from .env file
type DotEnvConfig struct {
	Storage DotEnvStorage
	Secrets SecretsConfig
}

type DotEnvStorage struct {
	StoragePath string
}

type SecretsConfig struct {
	AppSecret string
}

// Config opts from yaml file
type YamlConfig struct {
	App     AppConfig   `yaml:"app"`
	GRPC    GRPCConfig  `yaml:"grpc"`
	Storage YamlStorage `yaml:"storage"`

	Env      string        `yaml:"env" env-default:"local"`
	TokenTTL time.Duration `yaml:"token_ttl" env-required:"true"`
}

type AppConfig struct {
	MaxMessageLength int `yaml:"max_message_length"`
}

type GRPCConfig struct {
	Port    int           `yaml:"port"`
	Timeout time.Duration `yaml:"timeout"`
}

type YamlStorage struct {
	StorageName string `yaml:"storage_name"`
}

func MustLoad() *Config {
	path := fetchConfigPath()
	if path == "" {
		panic("config path is empty")
	}

	return MustLoadByPath(path)
}

func MustLoadByPath(configPath string) *Config {
	godotenv.Load()

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		panic("config file does not exist")
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		panic("cannot read config: " + err.Error())
	}

	cfg.DotEnv = DotEnvConfig{
		Storage: DotEnvStorage{
			StoragePath: getEnvParam("STORAGE_PATH", ""),
		},
		Secrets: SecretsConfig{
			AppSecret: getEnvParam("APP_SECRET", "app-secret"),
		},
	}

	return &cfg
}

func fetchConfigPath() string {
	var res string

	flag.StringVar(&res, "config", "", "path to config file")
	flag.Parse()

	if res == "" {
		res = os.Getenv("CONFIG_PATH")
	}
	return res
}

func getEnvParam(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value != "" {
		return value
	}

	if defaultValue == "" {
		panic("cannot load config, value and default value are empty")
	}
	return defaultValue
}
