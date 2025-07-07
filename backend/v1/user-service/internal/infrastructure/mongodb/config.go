package mongodb

import (
	"errors"
	"fmt"
	"time"
	"user-service/internal/config"
)

type MongoDBConfig struct {
	URI      string
	Database string

	ConnectTimeout   time.Duration
	HeartbeatTimeout time.Duration
	PingTimeout      time.Duration
	RequestTimeout   time.Duration

	MaxPoolSize uint64
	MinPoolSize uint64

	UsersCol string
}

func NewMongoConfig(cfg *config.Config) *MongoDBConfig {
	return &MongoDBConfig{
		URI:              cfg.DotEnv.MongoDB.URI,
		Database:         cfg.DotEnv.MongoDB.DB,
		ConnectTimeout:   cfg.Yaml.Mongo.ConnectTimeout,
		HeartbeatTimeout: cfg.Yaml.Mongo.HeartbeatTimeout,
		PingTimeout:      cfg.Yaml.Mongo.PingTimeout,
		RequestTimeout:   cfg.Yaml.Mongo.RequestTimeout,
		MaxPoolSize:      cfg.Yaml.Mongo.MaxPoolSize,
		MinPoolSize:      cfg.Yaml.Mongo.MinPoolSize,

		UsersCol: cfg.Yaml.Mongo.UsersCol,
	}
}

func (cfg *MongoDBConfig) Validate() error {
	if cfg.URI == "" {
		return errors.New("missing MongoDB URI")
	}
	if cfg.Database == "" {
		return errors.New("missing MongoDB database name")
	}
	if cfg.UsersCol == "" {
		return errors.New("missing MongoDB users collection name")
	}

	if cfg.ConnectTimeout <= 0 {
		return fmt.Errorf("invalid ConnectTimeout: %s", cfg.ConnectTimeout)
	}
	if cfg.HeartbeatTimeout <= 0 {
		return fmt.Errorf("invalid HeartbeatTimeout: %s", cfg.HeartbeatTimeout)
	}
	if cfg.PingTimeout <= 0 {
		return fmt.Errorf("invalid PingTimeout: %s", cfg.PingTimeout)
	}
	if cfg.RequestTimeout <= 0 {
		return fmt.Errorf("invalid RequestTimeout: %s", cfg.RequestTimeout)
	}

	if cfg.MaxPoolSize == 0 {
		return errors.New("MaxPoolSize must be > 0")
	}
	if cfg.MinPoolSize == 0 {
		return errors.New("MinPoolSize must be > 0")
	}

	if cfg.MinPoolSize > cfg.MaxPoolSize {
		return fmt.Errorf("MinPoolSize (%d) must not exceed MaxPoolSize (%d)", cfg.MinPoolSize, cfg.MaxPoolSize)
	}

	return nil
}
