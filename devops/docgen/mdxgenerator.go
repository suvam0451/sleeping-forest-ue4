// © 2020 Debashish Patra Some Rights Reserved

package docgen

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"sync"
	"time"
)

// entry function

// GenerateSnippetDocs : Generates documentations for snippet namespaces
func GenerateSnippetDocs(inputpath, outputpath string) {

	var wg sync.WaitGroup
	snippetFileList := []string{} // list of .json files

	if _, err := os.Stat(inputpath); err != nil {
		return
	}
	// Ensure that output path exists
	if _, err := os.Stat(outputpath); os.IsNotExist(err) {
		fmt.Println("Generating", outputpath)
		os.MkdirAll(outputpath, os.ModeDir.Perm())
	}

	filepath.Walk(inputpath,
		func(path string, info os.FileInfo, err error) error {
			if info.IsDir() == false {
				snippetFileList = append(snippetFileList, info.Name())
			}
			return nil
		})

	// Map the obtained list to input/output/name pairs
	for i, snippet := range snippetFileList {
		snippetInPath := path.Join(inputpath, snippet)              // read from
		snippetName := snippet[:len(snippet)-5]                     // uprop.json --> uprop
		snippetOutPath := path.Join(outputpath, snippetName+".mdx") // write to
		wg.Add(1)
		go snippetDocTemplate(&wg, snippetName, i, snippetInPath, snippetOutPath)
	}
	wg.Wait()
}

// Generates the frontmatter for .mdx files
func frontmatterGen(path, title string, submoduleID, seriesID, seriesIndex int) (retval []string) {
	retval = []string{}
	dt := time.Now()

	retval = append(retval, "---\n")
	retval = append(retval, "path: \""+path+"\"\n")
	retval = append(retval, "title: \""+title+"\"\n")
	retval = append(retval, "date: \""+dt.Format("02-Jan-2006")+"\"\n")
	retval = append(retval, "submoduleID: "+strconv.Itoa(submoduleID)+"\n")
	retval = append(retval, "seriesID: "+strconv.Itoa(seriesID)+"\n")
	retval = append(retval, "seriesIndex: "+strconv.Itoa(seriesIndex)+"\n")
	retval = append(retval, "draft: false\n")
	retval = append(retval, "---\n\n")
	return
}

// handles filling of frontmatter in file for us
func fillFrontmatter(f *os.File, path, title string, submoduleID, seriesID, seriesIndex int) {
	frontmatter := frontmatterGen(path, title, submoduleID, seriesID, seriesIndex)
	for _, line := range frontmatter {
		f.WriteString(line)
	}
}

// Inserts field initializer lines into file
func writeTableToFile(f *os.File, label string) {
	f.WriteString("\n#### " + label + "\n\n")
	f.WriteString("| macro           | feature                      | context key?           |\n")
	f.WriteString("| --------------- | ---------------------------- | ---------------------- |\n")
}

// generated ". " separated string from slice/array
func stringFromSlice(slice []string) (retval string) {
	for _, line := range slice {
		retval = retval + line + ". "
	}
	return
}

func getLinkAndTitle(name, module string) (link, title string, moduleID, submoduleID int) {

	switch module {
	case "snippet":
		{
			link = "/docs/sleeping-forest/snippet-lists/" + name
			title = "list of " + name + " snippets"
			moduleID = 2
			submoduleID = 2
			return
		}
	}
	return
}

// takes file as input. returns array of snippet data
func getSnippetList(inFile string) (retval []SnippetEntry, reterr error) {
	if jsonFile, err := os.Open(inFile); err == nil {
		byteValue, _ := ioutil.ReadAll(jsonFile)
		json.Unmarshal(byteValue, &retval)

		// Sort entries alphabetically
		sort.SliceStable(retval, func(i, j int) bool {
			return retval[i].Category < retval[j].Category
		})
		return
	}
	reterr = errors.New("Failed to open file")
	return
}

// formats and inserts a table entry for snippet data
func writeSnippetDocEntryToFile(f *os.File, entry SnippetEntry) {
	descriptionString := stringFromSlice(entry.Description)
	f.WriteString("| " + entry.prefix + " | " + descriptionString + " | " + entry.Context + " |" + "\n")
}

// Generates documentation from given input "snippet.json" file
func snippetDocTemplate(wg *sync.WaitGroup, name string, targetIndex int, inpath, outpath string) {
	defer wg.Done()
	previousGroup := "None" // used for grouping tables

	// main loop
	if EntryList, err := getSnippetList(inpath); err == nil {
		if f, err2 := os.Create(outpath); err2 == nil {
			// Fill frontmatter
			link, title, moduleID, submoduleID := getLinkAndTitle(name, "snippet")
			fillFrontmatter(f, link, title, moduleID, submoduleID, targetIndex)
			f.WriteString("Following snippets are available in " + name + " namespace. *Last updated: " + time.Now().Format("**02-Jan-2006***") + "\n\n")

			for _, entry := range EntryList {
				// When group changes(already sorted), add a new subsection
				if entry.Category != previousGroup {
					writeTableToFile(f, entry.Category)
					previousGroup = entry.Category
				}
				writeSnippetDocEntryToFile(f, entry)
			}
			f.WriteString("\nSee you later... 🖐")
		}
	} else {
		fmt.Println("Intermediate snippet files could not be generated")
	}
}
