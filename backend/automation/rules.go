package automation

import (
	"regexp"
)

// Rule 编译后的替换规则
type Rule struct {
	Pattern    *regexp.Regexp
	ReplaceStr string
}

// RuleConfig JSON 序列化的规则配置
type RuleConfig struct {
	Pattern     string `json:"pattern"`
	Replacement string `json:"replacement"`
	Enabled     bool   `json:"enabled"`
}

var Rules []Rule

// LoadRulesFromConfig 从配置列表加载替换规则
func LoadRulesFromConfig(configs []RuleConfig) error {
	Rules = nil
	for _, cfg := range configs {
		if !cfg.Enabled {
			continue
		}
		pattern, err := regexp.Compile(cfg.Pattern)
		if err != nil {
			continue
		}
		Rules = append(Rules, Rule{
			Pattern:    pattern,
			ReplaceStr: cfg.Replacement,
		})
	}
	return nil
}

func ApplyRules(text string) string {
	for _, rule := range Rules {
		text = rule.Pattern.ReplaceAllString(text, rule.ReplaceStr)
	}
	return text
}
