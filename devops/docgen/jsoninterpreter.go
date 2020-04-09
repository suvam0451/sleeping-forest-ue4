// © 2020 Debashish Patra Some Rights Reserved

package docgen

// go run snippetdocumentation.go

import (
	"bufio"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sync"
)

// SnippetEntry : Every entry in JSON file
type SnippetEntry struct {
	prefix      string   `json: "prefix"`
	Body        []string `json: "body"`
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
func GenerateIntermediateJSON(inputpath, outputpath string) {

	var wg sync.WaitGroup
	snippetFileList := []string{} // list of .json files

	if _, err := os.Stat(inputpath); err != nil {
		return
	}
	// Ensure that output path exists
	if _, err := os.Stat(outputpath); os.IsNotExist(err) {
		os.Mkdir(outputpath, os.ModeDir)
	}

	// Get names of all the snippet files
	filepath.Walk(inputpath,
		func(path string, info os.FileInfo, err error) error {
			if info.IsDir() == false {
				snippetFileList = append(snippetFileList, info.Name())
			}
			return nil
		})

	// Map the obtained list to input/output pairs
	for _, snippet := range snippetFileList {
		snippetInPath := path.Join(inputpath, snippet)   // read from
		snippetOutPath := path.Join(outputpath, snippet) // write to

		wg.Add(1)
		go func(inputpath, outputpath string) {
			ParseSnippetFile(inputpath, outputpath)
			wg.Done()
		}(snippetInPath, snippetOutPath)
	}

	wg.Wait()
}

// ParseSnippetFile : Parses a single json file and produces intermediate files
func ParseSnippetFile(inputpath, outputpath string) {
	// general variables
	ex := regexp.MustCompile(`\".*?\": {`)

	if textFile, err := os.Open(inputpath); err == nil {
		var txtlines []string

		// lines to string list
		scanner := bufio.NewScanner(textFile)
		scanner.Split(bufio.ScanLines)
		for scanner.Scan() {
			// Remove struct keys and make it a an array
			txtlines = append(txtlines, ex.ReplaceAllString(scanner.Text(), "{"))
		}

		// Remove conflicting object keys
		if f, err := os.Create(outputpath); err == nil {
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
	}
}
