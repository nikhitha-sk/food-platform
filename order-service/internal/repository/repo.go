package repository

import (
	"errors"

	"github.com/food-platform/order-service/internal/models"
	"gorm.io/gorm"
)

// OrderRepository handles basic CRUD for orders.
type OrderRepository interface {
	Create(tx *gorm.DB, o *models.Order) error
	GetByID(id uint) (*models.Order, error)
	ListByUser(userID uint) ([]models.Order, error)
	ListByRestaurant(restID uint) ([]models.Order, error)
	Update(tx *gorm.DB, o *models.Order) error
}

// PaymentRepository handles payments.
type PaymentRepository interface {
	Create(tx *gorm.DB, p *models.Payment) error
	GetByOrder(orderID uint) (*models.Payment, error)
	GetByIdempotencyKey(key string) (*models.Payment, error)
	Update(tx *gorm.DB, p *models.Payment) error
}

// OutboxRepository for writing and scanning outbox events.
type OutboxRepository interface {
	Create(tx *gorm.DB, e *models.OutboxEvent) error
	ListUnpublished(limit int) ([]models.OutboxEvent, error)
	MarkPublished(id uint) error
}

// ── gorm implementations

// orderRepo is a gorm-based implementation of OrderRepository.
type orderRepo struct{ db *gorm.DB }

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepo{db: db}
}

func (r *orderRepo) Create(tx *gorm.DB, o *models.Order) error {
	return tx.Create(o).Error
}

func (r *orderRepo) GetByID(id uint) (*models.Order, error) {
	var o models.Order
	err := r.db.First(&o, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &o, err
}

func (r *orderRepo) ListByUser(userID uint) ([]models.Order, error) {
	var list []models.Order
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *orderRepo) ListByRestaurant(restID uint) ([]models.Order, error) {
	var list []models.Order
	err := r.db.Where("restaurant_id = ?", restID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *orderRepo) Update(tx *gorm.DB, o *models.Order) error {
	return tx.Save(o).Error
}

// paymentRepo implements PaymentRepository

type paymentRepo struct{ db *gorm.DB }

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepo{db: db}
}

func (r *paymentRepo) Create(tx *gorm.DB, p *models.Payment) error {
	return tx.Create(p).Error
}

func (r *paymentRepo) GetByOrder(orderID uint) (*models.Payment, error) {
	var p models.Payment
	err := r.db.Where("order_id = ?", orderID).First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &p, err
}

func (r *paymentRepo) GetByIdempotencyKey(key string) (*models.Payment, error) {
	var p models.Payment
	err := r.db.Where("idempotency_key = ?", key).First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &p, err
}

func (r *paymentRepo) Update(tx *gorm.DB, p *models.Payment) error {
	return tx.Save(p).Error
}

// outboxRepo implements OutboxRepository

type outboxRepo struct{ db *gorm.DB }

func NewOutboxRepository(db *gorm.DB) OutboxRepository {
	return &outboxRepo{db: db}
}

func (r *outboxRepo) Create(tx *gorm.DB, e *models.OutboxEvent) error {
	return tx.Create(e).Error
}

func (r *outboxRepo) ListUnpublished(limit int) ([]models.OutboxEvent, error) {
	var events []models.OutboxEvent
	err := r.db.Where("published = ?", false).Order("id").Limit(limit).Find(&events).Error
	return events, err
}

func (r *outboxRepo) MarkPublished(id uint) error {
	return r.db.Model(&models.OutboxEvent{}).Where("id = ?", id).Update("published", true).Error
}
