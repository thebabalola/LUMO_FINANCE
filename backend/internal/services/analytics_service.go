package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsService struct {
	dbPool *pgxpool.Pool
}

type SpendingByType struct {
	Type             string `json:"type"`
	TotalKobo        int64  `json:"total_kobo"`
	TransactionCount int64  `json:"transaction_count"`
}

type SpendingSummary struct {
	Period           string           `json:"period"`
	TotalSpentKobo   int64            `json:"total_spent_kobo"`
	TransactionCount int64            `json:"transaction_count"`
	ByType           []SpendingByType `json:"by_type"`
}

func NewAnalyticsService(dbPool *pgxpool.Pool) *AnalyticsService {
	return &AnalyticsService{dbPool: dbPool}
}

func periodToInterval(period string) (string, error) {
	switch period {
	case "week":
		return "7 days", nil
	case "month", "":
		return "30 days", nil
	case "quarter":
		return "90 days", nil
	}
	return "", fmt.Errorf("period must be one of: week, month, quarter")
}

// GetSpending aggregates completed outgoing transactions by type over the
// given period ("week", "month", or "quarter").
func (service *AnalyticsService) GetSpending(ctx context.Context, userID string, period string) (*SpendingSummary, error) {
	interval, err := periodToInterval(period)
	if err != nil {
		return nil, err
	}
	if period == "" {
		period = "month"
	}

	rows, err := service.dbPool.Query(ctx,
		`SELECT type, COALESCE(SUM(amount), 0), COUNT(*)
		 FROM transactions
		 WHERE user_id = $1 AND status = 'completed' AND created_at >= NOW() - $2::interval
		 GROUP BY type ORDER BY SUM(amount) DESC`,
		userID, interval)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	summary := &SpendingSummary{Period: period, ByType: []SpendingByType{}}
	for rows.Next() {
		var spendingByType SpendingByType
		if err := rows.Scan(&spendingByType.Type, &spendingByType.TotalKobo, &spendingByType.TransactionCount); err != nil {
			return nil, err
		}
		summary.ByType = append(summary.ByType, spendingByType)
		summary.TotalSpentKobo += spendingByType.TotalKobo
		summary.TransactionCount += spendingByType.TransactionCount
	}
	return summary, rows.Err()
}

// GetSummary is the dashboard overview: current-month spend plus totals.
func (service *AnalyticsService) GetSummary(ctx context.Context, userID string) (*SpendingSummary, error) {
	return service.GetSpending(ctx, userID, "month")
}
