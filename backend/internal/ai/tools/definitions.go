package tools

import "github.com/anthropics/anthropic-sdk-go"

// Tool names the model can invoke. Read-only tools execute immediately
// server-side; money-moving tools only ever create a pending action that
// the user must confirm with their PIN.
const (
	ToolGetBalance      = "getBalance"
	ToolGetTransactions = "getTransactions"
	ToolAnalyzeSpending = "analyzeSpending"
	ToolVerifyRecipient = "verifyRecipient"
	ToolTransferMoney   = "transferMoney"
	ToolBuyAirtime      = "buyAirtime"
	ToolBuyData         = "buyData"
	ToolPayBill         = "payBill"
)

func IsMoneyMovingTool(toolName string) bool {
	switch toolName {
	case ToolTransferMoney, ToolBuyAirtime, ToolBuyData, ToolPayBill:
		return true
	}
	return false
}

func customTool(name string, description string, properties map[string]interface{}, required []string) anthropic.ToolUnionParam {
	return anthropic.ToolUnionParam{
		OfTool: &anthropic.ToolParam{
			Name:        name,
			Description: anthropic.String(description),
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: properties,
				Required:   required,
			},
		},
	}
}

// Definitions returns the eight Lumo tools sent to Claude on every request.
func Definitions() []anthropic.ToolUnionParam {
	networkProperty := map[string]interface{}{
		"type":        "string",
		"enum":        []string{"mtn", "glo", "airtel", "9mobile"},
		"description": "Mobile network operator",
	}

	return []anthropic.ToolUnionParam{
		customTool(ToolGetBalance,
			"Get the user's current Lumo wallet balance. Use whenever the user asks about their balance or before checking if they can afford something.",
			map[string]interface{}{}, nil),

		customTool(ToolGetTransactions,
			"Fetch the user's recent transactions, newest first. Use when the user asks about their transaction history or a recent payment.",
			map[string]interface{}{
				"limit": map[string]interface{}{
					"type":        "integer",
					"description": "Maximum number of transactions to return (default 10, max 50)",
				},
			}, nil),

		customTool(ToolAnalyzeSpending,
			"Summarize the user's completed spending grouped by category over a period. Use when the user asks where their money went or how much they spent.",
			map[string]interface{}{
				"period": map[string]interface{}{
					"type":        "string",
					"enum":        []string{"week", "month", "quarter"},
					"description": "Time period to analyze",
				},
			}, []string{"period"}),

		customTool(ToolVerifyRecipient,
			"Resolve a Nigerian bank account to the account holder's name. Always use this before preparing a bank transfer so the user can confirm the recipient.",
			map[string]interface{}{
				"bank_code": map[string]interface{}{
					"type":        "string",
					"description": "CBN bank code, e.g. 058 for GTBank, 044 for Access Bank",
				},
				"account_number": map[string]interface{}{
					"type":        "string",
					"description": "10-digit account number",
				},
			}, []string{"bank_code", "account_number"}),

		customTool(ToolTransferMoney,
			"Prepare a bank transfer for the user to confirm with their PIN. This does NOT move money — it creates a pending transaction. Verify the recipient first with verifyRecipient.",
			map[string]interface{}{
				"amount_kobo": map[string]interface{}{
					"type":        "integer",
					"description": "Amount in kobo (₦1 = 100 kobo)",
				},
				"bank_code": map[string]interface{}{
					"type":        "string",
					"description": "CBN bank code of the recipient's bank",
				},
				"account_number": map[string]interface{}{
					"type":        "string",
					"description": "Recipient's 10-digit account number",
				},
				"recipient_name": map[string]interface{}{
					"type":        "string",
					"description": "Recipient's account name as resolved by verifyRecipient",
				},
				"narration": map[string]interface{}{
					"type":        "string",
					"description": "Short description shown on the recipient's statement",
				},
			}, []string{"amount_kobo", "bank_code", "account_number"}),

		customTool(ToolBuyAirtime,
			"Prepare an airtime purchase for the user to confirm with their PIN. This does NOT move money.",
			map[string]interface{}{
				"amount_kobo": map[string]interface{}{
					"type":        "integer",
					"description": "Amount in kobo (₦1 = 100 kobo)",
				},
				"phone_number": map[string]interface{}{
					"type":        "string",
					"description": "Nigerian phone number to top up",
				},
				"network": networkProperty,
			}, []string{"amount_kobo", "phone_number", "network"}),

		customTool(ToolBuyData,
			"Prepare a mobile data purchase for the user to confirm with their PIN. This does NOT move money.",
			map[string]interface{}{
				"amount_kobo": map[string]interface{}{
					"type":        "integer",
					"description": "Price of the data plan in kobo",
				},
				"phone_number": map[string]interface{}{
					"type":        "string",
					"description": "Nigerian phone number to buy data for",
				},
				"network": networkProperty,
				"plan_code": map[string]interface{}{
					"type":        "string",
					"description": "Data plan identifier, e.g. mtn-5gb-monthly",
				},
			}, []string{"amount_kobo", "phone_number", "network", "plan_code"}),

		customTool(ToolPayBill,
			"Prepare a bill payment (electricity, cable TV, internet) for the user to confirm with their PIN. This does NOT move money.",
			map[string]interface{}{
				"amount_kobo": map[string]interface{}{
					"type":        "integer",
					"description": "Amount in kobo (₦1 = 100 kobo)",
				},
				"biller_code": map[string]interface{}{
					"type":        "string",
					"description": "Biller identifier, e.g. ikeja-electric, dstv",
				},
				"customer_id": map[string]interface{}{
					"type":        "string",
					"description": "Customer identifier with the biller: meter number, smartcard number, or account ID",
				},
			}, []string{"amount_kobo", "biller_code", "customer_id"}),
	}
}
