package events

import (
	"encoding/json"
	"fmt"

	"github.com/food-platform/notification-service/internal/service"
	"github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

type Consumer struct {
	ch     *amqp091.Channel
	svc    service.NotificationService
	logger *zap.Logger
}

type binding struct {
	Exchange   string
	Queue      string
	RoutingKey string
}

var bindings = []binding{
	{Exchange: "order_events", Queue: "notify.order_placed", RoutingKey: "ORDER_PLACED"},
	{Exchange: "delivery_events", Queue: "notify.driver_assigned", RoutingKey: "DRIVER_ASSIGNED"},
	{Exchange: "delivery_events", Queue: "notify.order_delivered", RoutingKey: "ORDER_DELIVERED"},
	{Exchange: "delivery_events", Queue: "notify.order_failed", RoutingKey: "ORDER_FAILED"},
	{Exchange: "order_events", Queue: "notify.order_cancelled", RoutingKey: "ORDER_CANCELLED"},
}

func NewConsumer(ch *amqp091.Channel, svc service.NotificationService, logger *zap.Logger) (*Consumer, error) {
	for _, ex := range []string{"order_events", "delivery_events"} {
		if err := ch.ExchangeDeclare(ex, "topic", true, false, false, false, nil); err != nil {
			return nil, fmt.Errorf("failed to declare exchange %s: %w", ex, err)
		}
	}

	for _, b := range bindings {
		if _, err := ch.QueueDeclare(b.Queue, true, false, false, false, nil); err != nil {
			return nil, fmt.Errorf("failed to declare queue %s: %w", b.Queue, err)
		}
		if err := ch.QueueBind(b.Queue, b.RoutingKey, b.Exchange, false, nil); err != nil {
			return nil, fmt.Errorf("failed to bind queue %s: %w", b.Queue, err)
		}
	}

	return &Consumer{ch: ch, svc: svc, logger: logger}, nil
}

func (c *Consumer) Start() {
	go c.consume("notify.order_placed", c.handleOrderPlaced)
	go c.consume("notify.driver_assigned", c.handleDriverAssigned)
	go c.consume("notify.order_delivered", c.handleOrderDelivered)
	go c.consume("notify.order_failed", c.handleOrderFailed)
	go c.consume("notify.order_cancelled", c.handleOrderCancelled)
}

func (c *Consumer) consume(queue string, handler func(amqp091.Delivery)) {
	msgs, err := c.ch.Consume(queue, "", false, false, false, false, nil)
	if err != nil {
		c.logger.Fatal("failed to consume", zap.String("queue", queue), zap.Error(err))
	}
	c.logger.Info("consumer started", zap.String("queue", queue))
	for msg := range msgs {
		handler(msg)
	}
}

func (c *Consumer) handleOrderPlaced(msg amqp091.Delivery) {
	var payload struct {
		OrderID           uint `json:"order_id"`
		UserID            uint `json:"user_id"`
		RestaurantOwnerID uint `json:"restaurant_owner_id"`
	}
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		c.logger.Error("ORDER_PLACED: bad payload", zap.Error(err))
		msg.Nack(false, false) //nolint:errcheck
		return
	}

	n, err := c.svc.CreateNotification(
		payload.UserID,
		"ORDER_PLACED",
		"Order Placed",
		"Order placed and payment captured. Waiting for restaurant to confirm.",
	)
	if err != nil {
		c.logger.Error("ORDER_PLACED: failed to create user notification", zap.Error(err))
		msg.Nack(false, true) //nolint:errcheck
		return
	}
	c.logger.Info("NOTIFICATION",
		zap.Uint("user_id", n.UserID),
		zap.String("title", n.Title),
		zap.String("body", n.Body),
	)

	if payload.RestaurantOwnerID > 0 {
		body := fmt.Sprintf("New order #%d received.", payload.OrderID)
		n2, err := c.svc.CreateNotification(
			payload.RestaurantOwnerID,
			"ORDER_PLACED",
			"New Order Received",
			body,
		)
		if err != nil {
			c.logger.Error("ORDER_PLACED: failed to create owner notification", zap.Error(err))
			msg.Nack(false, true) //nolint:errcheck
			return
		}
		c.logger.Info("NOTIFICATION",
			zap.Uint("user_id", n2.UserID),
			zap.String("title", n2.Title),
			zap.String("body", n2.Body),
		)
	}

	msg.Ack(false) //nolint:errcheck
}

func (c *Consumer) handleDriverAssigned(msg amqp091.Delivery) {
	var payload struct {
		UserID     uint   `json:"user_id"`
		DriverName string `json:"driver_name"`
	}
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		c.logger.Error("DRIVER_ASSIGNED: bad payload", zap.Error(err))
		msg.Nack(false, false) //nolint:errcheck
		return
	}

	body := fmt.Sprintf("Driver %s has been assigned and is on the way.", payload.DriverName)
	n, err := c.svc.CreateNotification(payload.UserID, "DRIVER_ASSIGNED", "Driver Assigned", body)
	if err != nil {
		c.logger.Error("DRIVER_ASSIGNED: failed to create notification", zap.Error(err))
		msg.Nack(false, true) //nolint:errcheck
		return
	}
	c.logger.Info("NOTIFICATION",
		zap.Uint("user_id", n.UserID),
		zap.String("title", n.Title),
		zap.String("body", n.Body),
	)
	msg.Ack(false) //nolint:errcheck
}

func (c *Consumer) handleOrderDelivered(msg amqp091.Delivery) {
	var payload struct {
		UserID uint `json:"user_id"`
	}
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		c.logger.Error("ORDER_DELIVERED: bad payload", zap.Error(err))
		msg.Nack(false, false) //nolint:errcheck
		return
	}

	n, err := c.svc.CreateNotification(
		payload.UserID,
		"ORDER_DELIVERED",
		"Order Delivered",
		"Your order has been delivered. Enjoy your meal!",
	)
	if err != nil {
		c.logger.Error("ORDER_DELIVERED: failed to create notification", zap.Error(err))
		msg.Nack(false, true) //nolint:errcheck
		return
	}
	c.logger.Info("NOTIFICATION",
		zap.Uint("user_id", n.UserID),
		zap.String("title", n.Title),
		zap.String("body", n.Body),
	)
	msg.Ack(false) //nolint:errcheck
}

func (c *Consumer) handleOrderFailed(msg amqp091.Delivery) {
	var payload struct {
		UserID uint `json:"user_id"`
	}
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		c.logger.Error("ORDER_FAILED: bad payload", zap.Error(err))
		msg.Nack(false, false) //nolint:errcheck
		return
	}

	n, err := c.svc.CreateNotification(
		payload.UserID,
		"ORDER_FAILED",
		"Delivery Failed",
		"Delivery failed. A refund has been initiated.",
	)
	if err != nil {
		c.logger.Error("ORDER_FAILED: failed to create notification", zap.Error(err))
		msg.Nack(false, true) //nolint:errcheck
		return
	}
	c.logger.Info("NOTIFICATION",
		zap.Uint("user_id", n.UserID),
		zap.String("title", n.Title),
		zap.String("body", n.Body),
	)
	msg.Ack(false) //nolint:errcheck
}

func (c *Consumer) handleOrderCancelled(msg amqp091.Delivery) {
	var payload struct {
		UserID uint `json:"user_id"`
	}
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		c.logger.Error("ORDER_CANCELLED: bad payload", zap.Error(err))
		msg.Nack(false, false) //nolint:errcheck
		return
	}

	n, err := c.svc.CreateNotification(
		payload.UserID,
		"ORDER_CANCELLED",
		"Order Cancelled",
		"Order cancelled. Refund will appear in 3-5 business days.",
	)
	if err != nil {
		c.logger.Error("ORDER_CANCELLED: failed to create notification", zap.Error(err))
		msg.Nack(false, true) //nolint:errcheck
		return
	}
	c.logger.Info("NOTIFICATION",
		zap.Uint("user_id", n.UserID),
		zap.String("title", n.Title),
		zap.String("body", n.Body),
	)
	msg.Ack(false) //nolint:errcheck
}
