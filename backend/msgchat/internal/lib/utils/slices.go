package utils

// вспомогательные функции
func Contains(slice []string, value string) bool {
	for _, v := range slice {
		if v == value {
			return true
		}
	}
	return false
}

func UniqueStrings(input []string) []string {
	uniqueMap := make(map[string]struct{})
	var result []string

	for _, str := range input {
		if _, exists := uniqueMap[str]; !exists {
			uniqueMap[str] = struct{}{}
			result = append(result, str)
		}
	}

	return result
}
