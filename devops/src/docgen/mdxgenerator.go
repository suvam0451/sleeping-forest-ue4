package docgen

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"sort"
	"strconv"
	"sync"
	"time"
)

// entry function

// GenerateSnippetDocs : Generates documentations for snippet namespaces
func GenerateSnippetDocs() {
	var wg sync.WaitGroup
	wg.Add(12)

	// Asynchronously generate mdx files from intermediate json
	go snippetDocTemplate(&wg, "uai", 1)
	go snippetDocTemplate(&wg, "uclass", 2)
	go snippetDocTemplate(&wg, "udebug", 3)
	go snippetDocTemplate(&wg, "uget", 4)
	go snippetDocTemplate(&wg, "ugs", 5)
	go snippetDocTemplate(&wg, "uinit", 6)
	go snippetDocTemplate(&wg, "ulog", 7)
	go snippetDocTemplate(&wg, "umat", 8)
	go snippetDocTemplate(&wg, "uprop", 9)
	go snippetDocTemplate(&wg, "utrace", 10)
	go snippetDocTemplate(&wg, "uwidget", 11)
	go snippetDocTemplate(&wg, "ue4_suvam0451", 12)

	wg.Wait()
}

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

func getFileMapping(name, module string, context int) (infile, outfile string) {
	switch module {
	case "snippet":
		{
			infile = "intermediate/" + name + ".json"
			outfile = "content/sleeping-forest/02-Snippets/02-Full-list/0" + strconv.Itoa(context) + "-" + name + ".mdx"
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
	f.WriteString("| " + entry.Prefix + " | " + descriptionString + " | " + entry.Context + " |" + "\n")
}

func snippetDocTemplate(wg *sync.WaitGroup, name string, targetIndex int) {
	defer wg.Done()
	previousGroup := "None" // used for grouping tables
	inFile, outFile := getFileMapping(name, "snippet", targetIndex)

	// main loop
	if EntryList, err := getSnippetList(inFile); err == nil {
		if f, err2 := os.Create(outFile); err2 == nil {
			// Fill frontmatter
			link, title, moduleID, submoduleID := getLinkAndTitle(name, "snippet")
			fillFrontmatter(f, link, title, moduleID, submoduleID, targetIndex)
			f.WriteString("Following snippets are available in " + name + " namespace. *Updated " + time.Now().Format("**02-Jan-2006***") + "\n\n")

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
	}
}
