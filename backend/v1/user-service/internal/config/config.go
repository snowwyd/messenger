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

type DotEnvConfig struct {
	Secrets SecretsConfig
}

type SecretsConfig struct {
	AppSecret string
}

type YamlConfig struct {
	GRPC GRPCConfig `yaml:"grpc"`

	Env      string        `yaml:"env"`
	TokenTTL time.Duration `yaml:"token_ttl"`
}

type GRPCConfig struct {
	Port    int           `yaml:"port"`
	Timeout time.Duration `yaml:"timeout"`
}

func MustLoad() *Config {
	path := fetchConfigPath()
	if path == "" {
		panic("config path is empty")
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		panic("config file does not exist")
	}

	var cfg Config

	if err := cleanenv.ReadConfig(path, &cfg); err != nil {
		panic("failed to read config" + err.Error())
	}

	godotenv.Load(".env_dev")
	cfg.DotEnv = DotEnvConfig{
		Secrets: SecretsConfig{
			AppSecret: getEnvParam("APP_SECRET", "app_secret"),
		},
	}

	// TODO: config field check

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
		panic("cannot load config: value and default value are empty")
	}

	return defaultValue
}
