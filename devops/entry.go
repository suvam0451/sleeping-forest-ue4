package main

import (
	"gitlab.com/suvam0451/src/docgen"
)

// Entry : Every entry in JSON file
type Entry struct {
	Id      string   `json: id`
	Headers []string `json: headers`
}

func main() {

	// process source json files (async)
	docgen.GenerateIntermediateJSON()
	docgen.GenerateSnippetDocs()
}

/*
func main() {
	var ParsedStruct []Entry
	jsonFile, err := os.Open("IncludeTemplates.json")
	if err == nil {
		byteValue, _ := ioutil.ReadAll(jsonFile)
		json.Unmarshal(byteValue, &ParsedStruct)
		fmt.Println(len(ParsedStruct))
	}

	sort.SliceStable(ParsedStruct, func(i, j int) bool {
		return ParsedStruct[i].Id < ParsedStruct[j].Id
	})

	// output filename
	f, err2 := os.Create("docs/01-header-module.mdx")

	if err2 == nil {

		dt := time.Now()
		fmt.Println(dt.Date())

		f.WriteString("---\n")
		f.WriteString("path: \"/docs/sleeping-forest/header-manager/1\"\n")
		f.WriteString("title: \"List of headers\"\n")
		f.WriteString("date: \"" + dt.Format("02-Jan-2006") + "\"\n")
		f.WriteString("submoduleID: 2\n")
		f.WriteString("seriesID: 2\n")
		f.WriteString("seriesIndex: 2\n")
		f.WriteString("draft: false\n")
		f.WriteString("---\n\n")

		f.WriteString("Following are the headers packages available as of " + dt.Format("**02-Jan-2006**") + "\n\n")

		f.WriteString("**List:** ")
		for k, entry := range ParsedStruct {
			fmt.Println(k)
			if k < len(ParsedStruct)-1 {
				f.WriteString(entry.Id + ", ")
			} else {
				f.WriteString(entry.Id)
			}
		}
		f.WriteString("\n\n")
	}
	for _, entry := range ParsedStruct {
		f.WriteString("##### " + entry.Id + "\n\n")

		f.WriteString("```cpp\n")
		for _, header := range entry.Headers {
			f.WriteString("#include \"" + header + "\"\n")
		}

		f.WriteString("```\n\n")
		// 		```cpp
		// #include "Components/SphereComponent.h"
		// #include "Components/BoxComponent.h"
		// #include "Components/CapsuleComponent.h"
		// ```
	}

	f.WriteString("You can also extend this module with your own lists. Read more about it in the next page.\n\n")
	f.WriteString("See you later... 🖐")

}

*/
