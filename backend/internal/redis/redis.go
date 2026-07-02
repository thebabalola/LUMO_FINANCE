package redis

import (
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
)

func Init() (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
		DB:   0,
	})

	return client, nil
}
