// © 2020 Debashish Patra Some Rights Reserved

package unreal

import (
	"fmt"
	"strings"
	"suvam0451/critstrike/utility"
)

// MaterialTessellationMode : This is used by the drawing passes to determine tessellation policy, so changes here need to be supported in native code.
type MaterialTessellationMode int

const (
	MTM_FLAT_TESSELLATION MaterialTessellationMode = iota
	MTM_NO_TESSELLATION
	MTM_PN_TRIANGLES
)

func (e MaterialTessellationMode) String() string {
	switch e {
	case MTM_FLAT_TESSELLATION:
		return "Onii"
	case MTM_NO_TESSELLATION:
		return "Chan"
	case MTM_PN_TRIANGLES:
		return "Daisuki"
	}
	return ""
}

//	-------------- INTERFACE ---------------------------

// PythonWriter : Ability to generate python file lines
type PythonWriter interface {
	GetLines() []string
	GetID() string
}

/** ---------------------------------------------------------------------------------------
-------------------------  MaterialExpressionCustom  ----------------------------
---------------------------------------------------------------------------------------*/

// MaterialExpressionCustom : Custom HLSL code node
type MaterialExpressionCustom struct {
	UniqueID    string         // String ID reference of parent
	Code        string         // [Read-Write] Code. Must be of form --> #include "ABC/DEF/XYZ.usf"
	Desc        string         // [Read-Write] A description that level designers can add (shows in the material editor UI).
	Description string         // [Read-Write] Description
	Inputs      []*CustomInput // [Read-Write] Inputs
	OutputType  string         // (CustomMaterialOutputType): [Read-Write] Output Type
}

// SetCode : Set "code" field
func (node MaterialExpressionCustom) SetCode(codevalue string) {
	node.Code = codevalue
}

// GetLines : MaterialExpressionScalarParameter
func (node MaterialExpressionCustom) GetLines() (lines []string) {
	appendEditorProperty(&lines, node.UniqueID, "description", node.Desc, true)
	if node.Description == "" {
		appendEditorProperty(&lines, node.UniqueID, "desc", "No description provided.", true)
	} else {
		appendEditorProperty(&lines, node.UniqueID, "desc", node.Description, true)
	}

	// return type for the node
	ReturnEnum := "CMOT_FLOAT1"
	switch node.OutputType {
	case "0", "float":
		ReturnEnum = "CMOT_FLOAT1"
	case "1", "float2":
		ReturnEnum = "CMOT_FLOAT2"
	case "2", "float3":
		ReturnEnum = "CMOT_FLOAT3"
	case "3", "float4":
		ReturnEnum = "CMOT_FLOAT4"
	}
	appendEditorProperty(&lines, node.UniqueID, "output_type", fmt.Sprintf("unreal.CustomMaterialOutputType.%s", ReturnEnum), false)
	appendEditorProperty(&lines, node.UniqueID, "code", "'"+node.Code+"'", false)
	return
}

// GetID : Implement
func (node MaterialExpressionCustom) GetID() string {
	return node.UniqueID
}

/** ---------------------------------------------------------------------------------------
-------------------------  MaterialExpressionComponentMask  ----------------------------
---------------------------------------------------------------------------------------*/

// MaterialExpressionComponentMask : float param node
type MaterialExpressionComponentMask struct {
	MaterialID string // String ID reference of parent
	UniqueID   string // Unique string ID for node
	A          bool   // [Read-Write] A
	B          bool   // [Read-Write] B
	Desc       string // [Read-Write] A description that level designers can add (shows in the material editor UI).
	G          bool   // [Read-Write] G
	R          bool   //  [Read-Write] R
}

// NewComponentMask : Syntax sugar for component masks
func NewComponentMask(RGBA, MatID string) *MaterialExpressionComponentMask {
	retval := MaterialExpressionComponentMask{
		MaterialID: MatID,
		UniqueID:   utility.UID(),
	}
	if strings.ContainsAny(RGBA, "RrXx") {
		retval.R = true
	}
	if strings.ContainsAny(RGBA, "GgYy") {
		retval.G = true
	}
	if strings.ContainsAny(RGBA, "BbZz") {
		retval.B = true
	}
	if strings.ContainsAny(RGBA, "AaWw") {
		retval.A = true
	}
	return &retval
}

// GetLines : MaterialExpressionComponentMask
func (node MaterialExpressionComponentMask) GetLines() (lines []string) {
	lines = append(lines,
		fmt.Sprintf("%s = unreal.MaterialEditingLibrary.create_material_expression(%s, unreal.MaterialExpressionComponentMask, -600, 0)", node.UniqueID, node.MaterialID))
	if node.Desc != "" {
		appendEditorProperty(&lines, node.UniqueID, "desc", node.Desc, true)
	}
	if node.A {
		appendEditorProperty(&lines, node.UniqueID, "A", "True", false)
	} else {
		appendEditorProperty(&lines, node.UniqueID, "A", "False", false)
	}
	if node.R {
		appendEditorProperty(&lines, node.UniqueID, "R", "True", false)
	} else {
		appendEditorProperty(&lines, node.UniqueID, "R", "False", false)
	}
	if node.G {
		appendEditorProperty(&lines, node.UniqueID, "G", "True", false)
	} else {
		appendEditorProperty(&lines, node.UniqueID, "G", "False", false)
	}
	if node.B {
		appendEditorProperty(&lines, node.UniqueID, "B", "True", false)
	} else {
		appendEditorProperty(&lines, node.UniqueID, "B", "False", false)
	}
	return
}

// GetID : For MaterialExpressionComponentMask
func (node MaterialExpressionComponentMask) GetID() string {
	return node.UniqueID
}

// unreal.MaterialExpressionComponentMask

/** ---------------------------------------------------------------------------------------
-------------------------  MaterialExpressionScalarParameter  ----------------------------
---------------------------------------------------------------------------------------*/

// MaterialExpressionScalarParameter : float param node
type MaterialExpressionScalarParameter struct {
	MaterialID    string  // String ID reference of parent
	UniqueID      string  // Unique string ID for node
	Desc          string  // Description string
	ParameterName string  // In-Engine name of the node
	DefaultValue  float64 // Default value
}

// GetLines : MaterialExpressionScalarParameter
func (node MaterialExpressionScalarParameter) GetLines() (lines []string) {
	lines = append(lines, fmt.Sprintf("%s = unreal.MaterialEditingLibrary.create_material_expression(%s, unreal.MaterialExpressionScalarParameter, -600, 0)", node.UniqueID, node.MaterialID))
	appendEditorProperty(&lines, node.UniqueID, "desc", node.Desc, true)
	appendEditorProperty(&lines, node.UniqueID, "default_value", fmt.Sprintf("%f", node.DefaultValue), false)
	appendEditorProperty(&lines, node.UniqueID, "parameter_name", node.ParameterName, true)
	return
}

// GetID : Implement
func (node MaterialExpressionScalarParameter) GetID() string {
	return node.UniqueID
}

/* Helper function to handle the appending for us */
func appendEditorProperty(slice *[]string, objectname, propname, value string, wrapString bool) {
	*slice = append(*slice, setEditorProperty(objectname, propname, value, wrapString))
}

func appendComment(slice *[]string, commentString string, precedeWithNewline bool) {
	if precedeWithNewline {
		*slice = append(*slice, fmt.Sprintf("\n# %s", commentString))
	}
	*slice = append(*slice, fmt.Sprintf("# %s", commentString))
}

// Makes a material expressiona nd appends the creation code to the slice
func appendMaterialExpression(slice *[]string, parentmat, expressiontype string, offset int) {
	appendstr := createMaterialExpression(parentmat, expressiontype, offset)
	*slice = append(*slice, appendstr)
}

// Generates string for a material expression type
func createMaterialExpression(parentmat, expressiontype string, offset int) (expressionstr string) {
	expressionstr = fmt.Sprintf("unreal.MaterialEditingLibrary.create_material_expression(%s, unreal.%s, -600, 0)", parentmat, expressiontype)
	return
}

// ConectMaterialExpressions : Connect 2 nodes in graph
func ConectMaterialExpressions(source, target PythonWriter, sourcepin, targetpin string) string {
	return fmt.Sprintf("unreal.MaterialEditingLibrary.connect_material_expressions(%s, \"%s\", %s, \"%s\")", source.GetID(), sourcepin, target.GetID(), targetpin)
}

/* creates this string --> objectname.set_editor_property("propname", "value").
Wrapping with string is optional */
func setEditorProperty(objectname, propname, value string, wrapString bool) string {
	if wrapString {
		return fmt.Sprintf("%s.set_editor_property(\"%s\", \"%s\")", objectname, propname, value)
	}
	return fmt.Sprintf("%s.set_editor_property(\"%s\", %s)", objectname, propname, value)
}

/** ---------------------------------------------------------------------------------------
-------------------------  CustomInput  ----------------------------
---------------------------------------------------------------------------------------*/

// CustomInput : float param node
type CustomInput struct {
	UniqueID  string
	InputName string
}

// GetLines : PythonWriter for CustomInput
func (node CustomInput) GetLines() (lines []string) {
	lines = append(lines, fmt.Sprintf("%s = unreal.CustomInput()", node.UniqueID))
	appendEditorProperty(&lines, node.UniqueID, "input_name", node.InputName, true)
	return
}

// GetID : Implement
func (node CustomInput) GetID() string {
	return node.UniqueID
}
