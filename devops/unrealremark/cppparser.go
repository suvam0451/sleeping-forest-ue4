// © 2020 Debashish Patra Some Rights Reserved

package unrealremark

/**
This package module parses your header(.h) files for comments like the following and injects
code/macros/comments as necessary.. the parser is smart enough to avoid conflicts.

List of uprop macros parsed :
$RO 			--> UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "C++")
$RW				--> UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "C++")
$ADV			--> UPROPERTY(..., AdvancedDisplay)
$WIDGET			--> UPROPERTY(MakeEditWidget) # Ignored if not FVector
$CLAMP{M,N}		--> UPROPERTY(..., ClampMin="M", ClampMax="N")
$CLAMP{_,N}		--> UPROPERTY(..., ClampMax="N")
$CAT{XYZ}		--> UPROPERTY(..., Category("XYZ"))

UEnum, FStruct parsers are more aggressive and add metadata for every parameter/entry.
Few notable exceptions are (u)int16, char etc. since BP supports only { uint8, int32 }

Do note that (BlueprintType) and GENERATED_(STRUCT)_BODY are auto added if missing if tagged

List of aggressive generators (enums, structs) :
$ENUM_BP		--> Injects $RW for all compatible members. Checks for additional directives.
$STRUCT_BP		--> Injects $RW for all compatible members. Checks for additional directives.
*/

import (
	"os"
)

// ParseCppFile : Read JSON files and generate intermediate files to be interpreted for final mdx generation
func ParseCppFile(filepath string) {
	if _, err := os.Open(filepath); err == nil {
		// Regexes (clamp needs capture groups)
		// exRO := regexp.MustCompile(`\/\/.*?\$RO`)
		// exRW := regexp.MustCompile(`\/\/.*?\$RW`)
		// exCLAMP := regexp.MustCompile(`\/\/.*?\$CLAMP{(.*?), ?(.*?)}`)
		// exWIDGET := regexp.MustCompile(`\/\/.*?\$WIDGET`)
		// exADV := regexp.MustCompile(`\/\/.*?\$ADV`)

		// 	var txtlines []string

		// 	// lines to string list
		// 	scanner := bufio.NewScanner(textFile)
		// 	scanner.Split(bufio.ScanLines)
		// 	for scanner.Scan() {
		// 		// Remove struct keys and make it a an array
		// 		txtlines = append(txtlines, exRO.ReplaceAllString(scanner.Text(), "{"))
		// 	}
	}
}
