package automation

import (
	"os"
	"regexp"
	"strings"
)

type Rule struct {
	Pattern    *regexp.Regexp
	ReplaceStr string
}

var Rules []Rule

func LoadRules(ruleFilePath string) error {
	data, err := os.ReadFile(ruleFilePath)
	if err != nil {
		return err
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		patternStr := strings.TrimSpace(parts[0])
		replaceStr := strings.TrimSpace(parts[1])

		pattern, err := regexp.Compile(patternStr)
		if err != nil {
			continue
		}

		Rules = append(Rules, Rule{
			Pattern:    pattern,
			ReplaceStr: replaceStr,
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
