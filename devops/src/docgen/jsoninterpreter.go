package docgen

// go run snippetdocumentation.go

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"sync"
)

// SnippetEntry : Every entry in JSON file
type SnippetEntry struct {
	Prefix      string   `json: prefix`
	Body        []string `json: body`
	Description []string `json: description, omitempty`
	Category    string   `json: category, omitempty`
	Context     string   `json: context, omitempty`
}

// Description : Every entry in JSON file
type Description struct {
	list []string `json: list`
}

// DescWrapper : wrapper
type DescWrapper struct {
	Description
	Partial bool `json: -`
}

// GenerateIntermediateJSON : Read JSON files and generate intermediate files to be interpreted for final mdx generation
func GenerateIntermediateJSON() {
	var wg sync.WaitGroup

	// list of snippet namespaces in order in which they appear in website
	snippetFiles := []string{"uai", "uclass", "udebug", "uget", "ugs", "uinit", "ulog", "umat", "uprop", "utrace", "uwidget", "ue4_suvam0451"}

	for _, snippetFile := range snippetFiles {
		wg.Add(1)
		go func(filePath string) {
			ParseSnippetFile(filePath)
			wg.Done()
		}(snippetFile)
	}

	wg.Wait()
}

// ParseSnippetFile : Parses a single json file and produces intermediate files
func ParseSnippetFile(snippetFile string) {
	// general variables
	ex := regexp.MustCompile(`\".*?\": {`)

	fileLoc := "snippets/" + snippetFile + ".json"
	outLoc := "intermediate/" + snippetFile + ".json"
	if textFile, err := os.Open(fileLoc); err == nil {
		var txtlines []string

		// lines to string list
		scanner := bufio.NewScanner(textFile)
		scanner.Split(bufio.ScanLines)
		for scanner.Scan() {
			txtlines = append(txtlines, ex.ReplaceAllString(scanner.Text(), "{"))
		}

		// Remove conflicting object keys
		if f, err := os.Create(outLoc); err == nil {
			for i, line := range txtlines {
				if i == 0 {
					f.WriteString("[\n")
				} else if i == len(txtlines)-1 {
					f.WriteString("]")
				} else {
					f.WriteString(line + "\n")
				}
			}
		}

		var ParsedStruct []SnippetEntry
		jsonFile, jsonerr := os.Open(outLoc)
		if jsonerr == nil {
			byteValue, _ := ioutil.ReadAll(jsonFile)
			marshalError := json.Unmarshal(byteValue, &ParsedStruct)
			if marshalError != nil {
				fmt.Println(snippetFile, ":", marshalError)
			}
		} else {
		}
	}
}
