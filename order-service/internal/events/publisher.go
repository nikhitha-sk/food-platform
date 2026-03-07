package events

import (
	"encoding/json"
	"fmt"

	"github.com/food-platform/order-service/internal/models"
	"github.com/rabbitmq/amqp091-go"
)

// Publisher publishes order-related events.
type Publisher interface {
	PublishOrderPlaced(ev *models.OutboxEvent) error
	PublishOrderCancelled(ev *models.OutboxEvent) error
	Close() error
}

type rabbitmqPublisher struct {
	ch *amqp091.Channel
}

// NewPublisher declares exchange and returns a Publisher.
func NewPublisher(ch *amqp091.Channel) (Publisher, error) {
	if err := ch.ExchangeDeclare(
		"order_events",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}
	return &rabbitmqPublisher{ch: ch}, nil
}

func (p *rabbitmqPublisher) PublishOrderPlaced(ev *models.OutboxEvent) error {
	body, err := json.Marshal(ev.Payload)
	if err != nil {
		return err
	}
	return p.ch.Publish("order_events", ev.EventType, false, false, amqp091.Publishing{
		ContentType: "application/json",
		Body:        body,
	})
}

func (p *rabbitmqPublisher) PublishOrderCancelled(ev *models.OutboxEvent) error {
	body, err := json.Marshal(ev.Payload)
	if err != nil {
		return err
	}
	return p.ch.Publish("order_events", ev.EventType, false, false, amqp091.Publishing{
		ContentType: "application/json",
		Body:        body,
	})
}

func (p *rabbitmqPublisher) Close() error {
	return p.ch.Close()
}
