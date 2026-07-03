package tools

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestIsMoneyMovingTool(t *testing.T) {
	moneyMovingTools := []string{ToolTransferMoney, ToolBuyAirtime, ToolBuyData, ToolPayBill}
	for _, toolName := range moneyMovingTools {
		if !IsMoneyMovingTool(toolName) {
			t.Errorf("expected %s to be money-moving", toolName)
		}
	}

	readOnlyTools := []string{ToolGetBalance, ToolGetTransactions, ToolAnalyzeSpending, ToolVerifyRecipient}
	for _, toolName := range readOnlyTools {
		if IsMoneyMovingTool(toolName) {
			t.Errorf("expected %s to be read-only", toolName)
		}
	}
}

func TestDefinitionsMarshalToValidToolSchemas(t *testing.T) {
	definitions := Definitions()
	if len(definitions) != 8 {
		t.Fatalf("expected 8 tool definitions, got %d", len(definitions))
	}

	seenNames := map[string]bool{}
	for _, definition := range definitions {
		definitionJSON, err := json.Marshal(definition)
		if err != nil {
			t.Fatalf("tool definition failed to marshal: %v", err)
		}

		var decoded struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			InputSchema struct {
				Type string `json:"type"`
			} `json:"input_schema"`
		}
		if err := json.Unmarshal(definitionJSON, &decoded); err != nil {
			t.Fatalf("tool definition JSON is not decodable: %v", err)
		}
		if decoded.Name == "" {
			t.Errorf("tool definition missing name: %s", definitionJSON)
		}
		if decoded.Description == "" {
			t.Errorf("tool %s missing description", decoded.Name)
		}
		if decoded.InputSchema.Type != "object" {
			t.Errorf("tool %s input_schema.type should be object, got %q", decoded.Name, decoded.InputSchema.Type)
		}
		if seenNames[decoded.Name] {
			t.Errorf("duplicate tool name %s", decoded.Name)
		}
		seenNames[decoded.Name] = true

		if IsMoneyMovingTool(decoded.Name) && !strings.Contains(decoded.Description, "does NOT move money") {
			t.Errorf("money-moving tool %s must state it does not move money", decoded.Name)
		}
	}
}
