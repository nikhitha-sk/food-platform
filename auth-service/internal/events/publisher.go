package events

import (
	"encoding/json"
	"fmt"

	"github.com/food-platform/auth-service/internal/models"
	"github.com/rabbitmq/amqp091-go"
)

// Publisher handles publishing events to RabbitMQ.
type Publisher interface {
	PublishUserCreated(event *models.UserCreatedEvent) error
	PublishUserDeleted(event *models.UserDeletedEvent) error
	Close() error
}

type rabbitmqPublisher struct {
	ch *amqp091.Channel
}

// NewPublisher creates a new RabbitMQ event publisher.
func NewPublisher(ch *amqp091.Channel) (Publisher, error) {
	// Declare exchanges
	if err := ch.ExchangeDeclare(
		"user_events", // name
		"topic",       // kind
		true,          // durable
		false,         // auto-delete
		false,         // internal
		false,         // no-wait
		nil,           // args
	); err != nil {
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	return &rabbitmqPublisher{ch: ch}, nil
}

// PublishUserCreated publishes a USER_CREATED event.
func (p *rabbitmqPublisher) PublishUserCreated(event *models.UserCreatedEvent) error {
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	return p.ch.Publish(
		"user_events",  // exchange
		"user.created", // routing key
		false,          // mandatory
		false,          // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}

// PublishUserDeleted publishes a USER_DELETED event.
func (p *rabbitmqPublisher) PublishUserDeleted(event *models.UserDeletedEvent) error {
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	return p.ch.Publish(
		"user_events",  // exchange
		"user.deleted", // routing key
		false,          // mandatory
		false,          // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}

// Close closes the publisher connection.
func (p *rabbitmqPublisher) Close() error {
	return p.ch.Close()
}
