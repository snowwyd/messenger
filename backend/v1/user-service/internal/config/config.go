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
	MongoDB MongoDBConfig

	Secrets SecretsConfig
}

type MongoDBConfig struct {
	URI string
	DB  string
}

type SecretsConfig struct {
	AppSecret string
}

type YamlConfig struct {
	GRPC  GRPCConfig  `yaml:"grpc"`
	Mongo MongoConfig `yaml:"mongo"`

	Env      string        `yaml:"env"`
	TokenTTL time.Duration `yaml:"token_ttl"`
}

type GRPCConfig struct {
	Port    int           `yaml:"port"`
	Timeout time.Duration `yaml:"timeout"`
}

type MongoConfig struct {
	ConnectTimeout   time.Duration `yaml:"connect_timeout"`
	HeartbeatTimeout time.Duration `yaml:"heartbeat_timeout"`
	PingTimeout      time.Duration `yaml:"ping_timeout"`
	RequestTimeout   time.Duration `yaml:"req_timeout"`

	MaxPoolSize uint64 `yaml:"max_pool_size"`
	MinPoolSize uint64 `yaml:"min_pool_size"`

	UsersCol string `yaml:"users_col"`
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
		MongoDB: MongoDBConfig{
			URI: getEnvParam("MONGO_URI", ""),
			DB:  getEnvParam("MONGO_DB", ""),
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
