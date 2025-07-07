package mongodb

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

var (
	defaultConnectTimeout = 10 * time.Second
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
	config   *MongoDBConfig
	log      *slog.Logger
}

func NewMongoDB(ctx context.Context, cfg *MongoDBConfig, log *slog.Logger) (*MongoDB, error) {
	clientOpts := options.Client().
		ApplyURI(cfg.URI).
		SetConnectTimeout(cfg.ConnectTimeout).
		SetHeartbeatInterval(cfg.HeartbeatTimeout).
		SetMaxPoolSize(cfg.MaxPoolSize).
		SetMinPoolSize(cfg.MinPoolSize).
		SetRetryWrites(true)

	ctxConnect, cancel := context.WithTimeout(ctx, cfg.ConnectTimeout)
	defer cancel()

	client, err := mongo.Connect(ctxConnect, clientOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to mongo %w", err)
	}

	ctxPing, cancelPing := context.WithTimeout(ctx, cfg.PingTimeout)
	defer cancelPing()

	if err := client.Ping(ctxPing, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping mongo %w", err)
	}

	return &MongoDB{
		Client:   client,
		Database: client.Database(cfg.Database),
		config:   cfg,
		log:      log,
	}, nil
}

func (db *MongoDB) GetDB() *mongo.Database {
	return db.Database
}

func (db *MongoDB) Close(ctx context.Context) error {
	const op = "infrastructure.mongodb.Close"

	log := db.log.With(slog.String("op", op))

	if db.Client == nil {
		return nil
	}

	timeout := db.config.ConnectTimeout
	if timeout == 0 {
		timeout = defaultConnectTimeout
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	log.Info("mongo connection is closing")
	if err := db.Client.Disconnect(ctx); err != nil {
		return err
	}

	return nil
}

func (db *MongoDB) HealthCheck(ctx context.Context) error {
	if db.Client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if err := db.Client.Ping(ctx, readpref.Primary()); err != nil {
		return fmt.Errorf("mongoDB ping failed: %w", err)
	}

	return nil
}

func (db *MongoDB) WithTransaction(
	ctx context.Context,
	fn func(sessCtx mongo.SessionContext) (interface{}, error),
) (interface{}, error) {
	session, err := db.Client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	return session.WithTransaction(ctx, fn)
}
