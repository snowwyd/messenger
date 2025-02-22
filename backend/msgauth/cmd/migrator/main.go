package main

import (
	"errors"
	"flag"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mongodb"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	var dbURI, dbName, migrationsPath string
	flag.StringVar(&dbURI, "db-uri", "mongodb://localhost:27017", "MongoDB connection URI")
	flag.StringVar(&dbName, "db-name", "messenger", "MongoDB database name")
	flag.StringVar(&migrationsPath, "migrations-path", "", "Path to migrations")
	flag.Parse()

	if migrationsPath == "" {
		log.Fatal("migrations-path flag is required")
	}

	dbURL := fmt.Sprintf("mongodb://%s/%s", dbURI, dbName)
	m, err := migrate.New(
		"file://"+migrationsPath,
		dbURL,
	)
	if err != nil {
		log.Fatalf("failed to create migrate instance: %v", err)
	}

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			fmt.Println("no migrations to apply")
			return
		}
		log.Fatalf("migration failed: %v", err)
	}

	fmt.Println("migrations applied successfully")
}
