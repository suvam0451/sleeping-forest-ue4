// © 2020 Debashish Patra Some Rights Reserved

package unrealremark

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"suvam0451/critstrike/unreal"
	"suvam0451/critstrike/utility"
)

type hLSLParserInstructions struct {
	UVSlot          int
	NodeName        string
	NodeDescription string
	ReturnType      string
	MaterialDomain  string
	TesselationMode string
	CodePath        string
}

// ParamStruct : Struct param
type paramStruct struct {
	paramName    string
	paramType    string // const, float,float2, float3, float4, Texture
	defultValues []float32
	singleValue  float32 // Sometimes users expect to be able to input values to be auto-interpreted --> (0.1f) --> (0.1f, 0.1f, 0.1f)
}

// ParseHlslFile : Read JSON files and generate intermediate files to be interpreted for final mdx generation
func ParseHlslFile(inpath, outpath, codeprefix string) {

	// Output node mapping
	outputnode := make(map[string]string)
	outputnode["emissive"] = "unreal.MaterialProperty.MP_EMISSIVE_COLOR"     // 0
	outputnode["opacity"] = "unreal.MaterialProperty.MP_OPACITY"             // 1
	outputnode["opacity"] = "unreal.MaterialProperty.MP_OPACITY_MASK"        // 2
	outputnode["basecolor"] = "unreal.MaterialProperty.MP_BASE_COLOR"        // 5
	outputnode["metallic"] = "unreal.MaterialProperty.MP_METALLIC"           // 6
	outputnode["specular"] = "unreal.MaterialProperty.MP_SPECULAR"           // 7
	outputnode["roughness"] = "unreal.MaterialProperty.MP_ROUGHNESS"         // 8
	outputnode["normal"] = "unreal.MaterialProperty.MP_NORMAL"               // 9
	outputnode["subsurface"] = "unreal.MaterialProperty.MP_SUBSURFACE_COLOR" // 13
	outputnode["ao"] = "unreal.MaterialProperty.MP_AMBIENT_OCCLUSION"        // 16
	outputnode["refraction"] = "unreal.MaterialProperty.MP_REFRACTION"       // 17

	// MaterialDomain mapping
	matdomain := make(map[string]string)
	matdomain["0"] = "unreal.MaterialDomain.MD_SURFACE"                                          // 0
	matdomain["MD_SURFACE"] = "unreal.MaterialDomain.MD_SURFACE"                                 // 0
	matdomain["1"] = "unreal.MaterialDomain.MD_DEFERRED_DECAL"                                   // 1
	matdomain["MD_DEFERRED_DECAL"] = "unreal.MaterialDomain.MD_DEFERRED_DECAL"                   // 1
	matdomain["2"] = "unreal.MaterialDomain.MD_LIGHT_FUNCTION"                                   // 2
	matdomain["MD_LIGHT_FUNCTION"] = "unreal.MaterialDomain.MD_LIGHT_FUNCTION"                   // 2
	matdomain["3"] = "unreal.MaterialDomain.MD_VOLUME"                                           // 3
	matdomain["MD_VOLUME"] = "unreal.MaterialDomain.MD_VOLUME"                                   // 3
	matdomain["4"] = "unreal.MaterialDomain.MD_POST_PROCESS"                                     // 4
	matdomain["MD_POST_PROCESS"] = "unreal.MaterialDomain.MD_POST_PROCESS"                       // 4
	matdomain["5"] = "unreal.MaterialDomain.MD_UI"                                               // 5
	matdomain["MD_UI"] = "unreal.MaterialDomain.MD_UI"                                           // 5
	matdomain["6"] = "unreal.MaterialDomain.MD_RUNTIME_VIRTUAL_TEXTURE"                          // 6
	matdomain["MD_RUNTIME_VIRTUAL_TEXTURE"] = "unreal.MaterialDomain.MD_RUNTIME_VIRTUAL_TEXTURE" // 6

	if textFile, err := os.Open(inpath); err == nil {
		LinesToWrite := []string{}
		var DataStruct hLSLParserInstructions
		paramlist := []string{}        // holds name of param
		paramtype := []int{}           // holds type of param float{/2/3/4}
		usewithString := []string{}    // usewith directives
		usewithoutString := []string{} // usewithout directive

		// actualParamStruct := []paramStruct{}
		// returntype := ""

		// Regexes
		namex, _ := regexp.Compile("@name.*?([A-Za-z_0-9]+)")
		descx, _ := regexp.Compile("@desc +.*?([A-Za-z_0-9 ]+)")
		paramx, _ := regexp.Compile("@param +.*?([A-Za-z_0-9]+) +(float[1-4]?|Texture)(\\(([0-9,\\.f]*)\\))?")
		usewithx, _ := regexp.Compile("@usewith +.*?([A-Za-z ,]+)")
		usewithoutx, _ := regexp.Compile("@nousewith +.*?([A-Za-z ,]+)")
		returnx, _ := regexp.Compile("@returntype .*?([A-Za-z_0-9]+)")
		domainx, _ := regexp.Compile("@domain .*?([A-Za-z_0-9]+)")
		tessellationx, _ := regexp.Compile("@tessellation .*?([0-9]+)")
		ue4pathx, _ := regexp.Compile("@folder .+?([a-zA-Z0-9_-]+)$")

		// lines to string list
		scanner := bufio.NewScanner(textFile)
		scanner.Split(bufio.ScanLines)
		for scanner.Scan() {
			text := scanner.Text() // the line

			if match := namex.MatchString(text); match {
				// @name : Name of custom node specified
				DataStruct.NodeName = namex.FindStringSubmatch(text)[1]
			} else if match := descx.MatchString(text); match {
				// @param : Capture node description
				DataStruct.NodeDescription = descx.FindStringSubmatch(text)[1]
			} else if match := paramx.MatchString(text); match {
				// @param : Capture param
				tmpmatch := paramx.FindStringSubmatch(text)
				paramlist = append(paramlist, tmpmatch[1])
				if len(tmpmatch) > 3 {

					if mynumber, err := strconv.Atoi(tmpmatch[3]); err == nil {

						paramtype = append(paramtype, mynumber)
					} else {
						paramtype = append(paramtype, 0)
					}
				}
				// Handle special params that can't be obtained in
				// HLSL --> { UV, }
				switch tmpmatch[1] {
				case "UV":
					DataStruct.UVSlot = len(paramlist)
				}
			} else if match := returnx.MatchString(text); match {
				// @return : Capture return type mentioned
				DataStruct.ReturnType = returnx.FindStringSubmatch(text)[1]
			} else if match := domainx.MatchString(text); match {
				// @domain : Capture material domain type
				DataStruct.MaterialDomain = domainx.FindStringSubmatch(text)[1]
			} else if match := tessellationx.MatchString(text); match { // tessellation
				// @tessellation : Capture tessalation mode {0/1/2}
				tmpmatch := tessellationx.FindStringSubmatch(text)
				DataStruct.TesselationMode = tmpmatch[1]
			} else if match := usewithx.MatchString(text); match {
				// @usewith : Tick these material usage modes. Tick out all else.
				tmpmatch := usewithx.FindStringSubmatch(text)
				usewithString = append(usewithString, strings.Split(tmpmatch[1], ",")...)
			} else if match := usewithoutx.MatchString(text); match {
				// @usewith : Tick these material usage modes. Tick out all else.
				tmpmatch := usewithoutx.FindStringSubmatch(text)
				usewithoutString = append(usewithoutString, strings.Split(tmpmatch[1], ",")...)
			} else if match := ue4pathx.MatchString(text); match {
				// @ue4path : Relative location of ush code. Also relative location in editor
				tmpmatch := ue4pathx.FindStringSubmatch(text)
				DataStruct.CodePath = tmpmatch[1]
			}
		}

		// This is the material refernce in python file
		matref := "matref"

		// --- DEFINE USER VARIABLES ---

		LinesToWrite = append(LinesToWrite, "import unreal")
		LinesToWrite = append(LinesToWrite, "\nasset_path = \"/Game/Materials/\"")

		// --- MATERIAL CREATION ---

		LinesToWrite = append(LinesToWrite,
			fmt.Sprintf("%s = unreal.AssetToolsHelpers.get_asset_tools().create_asset(\"%s\", asset_path, unreal.Material, unreal.MaterialFactoryNew())",
				matref, DataStruct.NodeName))

		// --- SET MATERIAL PARAMETERS

		if DataStruct.MaterialDomain != "" {
			appendEditorProperty(&LinesToWrite, matref, "material_domain", DataStruct.MaterialDomain, true)
		}

		// Set tesselation mode if directed
		switch DataStruct.TesselationMode {
		case "0":
			appendEditorProperty(&LinesToWrite, matref, "d3d11_tessellation_mode", "unreal.MaterialTessellationMode.MTM_NO_TESSELLATION", false)
		case "1":
			appendEditorProperty(&LinesToWrite, matref, "d3d11_tessellation_mode", "unreal.MaterialTessellationMode.MTM_FLAT_TESSELLATION", false)
		case "2":
			appendEditorProperty(&LinesToWrite, matref, "d3d11_tessellation_mode", "unreal.MaterialTessellationMode.MTM_PN_TRIANGLES", false)
		default:
		}

		// --- MATERIAL USAGE DOMAIN SETTINGS
		LinesToWrite = append(LinesToWrite, resolveUseWithDirectives(usewithString, usewithoutString)...)

		// return type for the node
		ReturnEnum := "CMOT_FLOAT1"
		switch DataStruct.ReturnType {
		case "0", "float":
			ReturnEnum = "CMOT_FLOAT1"
		case "1", "float2":
			ReturnEnum = "CMOT_FLOAT2"
		case "2", "float3":
			ReturnEnum = "CMOT_FLOAT3"
		case "3", "float4":
			ReturnEnum = "CMOT_FLOAT4"
		}

		// --- GENERATE CODE FIELD FOR CUSTOM EXPRESSION

		// #include "/CS/Blending/PickupOutline.usf" *for source alias "/CS" and ue4path = "Blending" *
		// return 0;

		var codestring string
		if codeprefix == "" {
			codestring = "/" + filepath.Base(inpath)
		} else if DataStruct.CodePath == "" {
			codestring = codeprefix + "/" + filepath.Base(inpath)
		} else {
			codestring = codeprefix + "/" + DataStruct.CodePath + "/" + filepath.Base(inpath)
		}

		codestring = fmt.Sprintf("#include \"%s\"\\nreturn 0;", codestring)

		// --- GENERATE CUSTOM EXPRESSION
		firstCustom := unreal.MaterialExpressionCustom{
			UniqueID:    utility.UID(),
			Code:        codestring,
			Desc:        DataStruct.NodeName,
			Description: DataStruct.NodeDescription,
			OutputType:  ReturnEnum,
		}

		// Add lines for custom node initialization (Appending of input nodes still pending)
		LinesToWrite = append(LinesToWrite, "\n# Attach custom expression node",
			fmt.Sprintf("%s = unreal.MaterialEditingLibrary.create_material_expression(matref, unreal.MaterialExpressionCustom, -400, 0)", firstCustom.GetID()))
		LinesToWrite = append(LinesToWrite, firstCustom.GetLines()...)

		// -----------------------------------------------

		// --- ATTACH INPUT PINS TO CUSTOMEXPRESSION ---

		// This should be added to .py file after pins are connected
		CustomNodeInputSetup := []string{}

		inputliststring := "["
		appendComment(&LinesToWrite, "List of pins to attach", true)
		for i, param := range paramlist {

			// Generate the CustomInput pins in custom node
			node := unreal.CustomInput{
				UniqueID:  utility.UID(),
				InputName: param,
			}
			LinesToWrite = append(LinesToWrite, node.GetLines()...)

			// insert input pins to list
			if i == 0 {
				inputliststring += node.GetID()
			} else {
				inputliststring += ", " + node.GetID()
			}

			// ---- APPEND PARAM EXPRESSIONS
			letter := unreal.MaterialExpressionScalarParameter{
				MaterialID:    matref,
				UniqueID:      utility.UID(),
				Desc:          "No description provided",
				ParameterName: param,
				DefaultValue:  10.00,
			}

			LinesToWrite = append(LinesToWrite, letter.GetLines()...)
			CustomNodeInputSetup = append(CustomNodeInputSetup, unreal.ConectMaterialExpressions(letter, firstCustom, "", param))
		}
		inputliststring = inputliststring + "]"

		// --- SPECIFY THE PINS TO CUSTOM NODES

		appendComment(&LinesToWrite, "Inserting pins to custom expression", true)
		appendEditorProperty(&LinesToWrite, firstCustom.GetID(), "inputs", inputliststring, false)

		appendComment(&LinesToWrite, "Connecting input pins", true)
		LinesToWrite = append(LinesToWrite, CustomNodeInputSetup...)

		fmt.Println("DONE :", "name ", DataStruct.NodeName, ", params :", paramlist, "returns:", DataStruct.ReturnType)

		if f, err := os.Create(outpath); err == nil {
			for _, line := range LinesToWrite {
				f.WriteString(line + "\n")
			}
		}
	}
}

type usageModeMap struct {
	use           bool
	representedBy string
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

/* creates this string --> objectname.set_editor_property("propname", "value").
Wrapping with string is optional */
func setEditorProperty(objectname, propname, value string, wrapString bool) string {
	if wrapString {
		return fmt.Sprintf("%s.set_editor_property(\"%s\", \"%s\")", objectname, propname, value)
	}
	return fmt.Sprintf("%s.set_editor_property(\"%s\", %s)", objectname, propname, value)
}

// Takes two lists analyzes usage modes which should be filled
func resolveUseWithDirectives(withlist, withoutlist []string) (retval []string) {
	usagemodes := make(map[string]*usageModeMap)
	// *Mesh* category
	usagemodes["SkeletalMesh"] = &usageModeMap{false, "used_with_skeletal_mesh"}
	usagemodes["SplineMesh"] = &usageModeMap{false, "used_with_spline_meshes"}
	usagemodes["InstancedMesh"] = &usageModeMap{false, "used_with_instanced_static_meshes"}
	// *Cascade* category
	usagemodes["ParticleSprite"] = &usageModeMap{false, "used_with_particle_sprites"}
	usagemodes["BeamTrail"] = &usageModeMap{false, "used_with_beam_trails"}
	usagemodes["MeshParticle"] = &usageModeMap{false, "used_with_mesh_particles"}
	// *Niagara* category
	usagemodes["NiagaraSprite"] = &usageModeMap{false, "used_with_niagara_sprites"}
	usagemodes["NiagaraRibbon"] = &usageModeMap{false, "used_with_niagara_ribbons"}
	usagemodes["NiagaraMesh"] = &usageModeMap{false, "used_with_niagara_mesh_particles"}

	usagemodes["EditorComp"] = &usageModeMap{false, "used_with_editor_compositing"}
	usagemodes["GeometryCache"] = &usageModeMap{false, "used_with_geometry_cache"}
	usagemodes["StaticLight"] = &usageModeMap{false, "used_with_static_lighting"}
	usagemodes["Morphtarget"] = &usageModeMap{false, "used_with_morph_targets"}
	usagemodes["GeometryCollection"] = &usageModeMap{false, "used_with_geometry_collections"}
	// *Simulation* category
	usagemodes["Clothing"] = &usageModeMap{false, "used_with_clothing"}
	usagemodes["Water"] = &usageModeMap{false, "used_with_water"}
	usagemodes["HairStrand"] = &usageModeMap{false, "used_with_hair_strands"}

	bChangesMade := false

	// ----------------------------------------
	// 			WITH KEYS
	// ----------------------------------------
	for _, with := range withlist {
		symbol := strings.TrimSpace(with)
		bParsed := false
		for key := range usagemodes {
			if key == symbol {
				bChangesMade = true
				usagemodes[key].use = true
				bParsed = true
				break
			}
		}

		// Check for modules if key was not found in map
		if bParsed == false {
			fmt.Println(symbol)
			bChangesMade = true
			switch symbol {
			case "Niagara":
				usagemodes["NiagaraSprite"].use = true
				usagemodes["NiagaraRibbon"].use = true
				usagemodes["NiagaraMesh"].use = true
			case "Cascade":
				usagemodes["ParticleSprite"].use = true
				usagemodes["BeamTrail"].use = true
				usagemodes["MeshParticle"].use = true
			case "Simulation":
				usagemodes["Clothing"].use = true
				usagemodes["Water"].use = true
				usagemodes["HairStrand"].use = true
			case "AnyMesh":
				usagemodes["SkeletalMesh"].use = true
				usagemodes["SplineMesh"].use = true
				usagemodes["InstancedMesh"].use = true
			}
		}
	}

	// ----------------------------------------

	// ----------------------------------------
	// 			WITHOUT KEYS
	// ----------------------------------------
	for _, without := range withoutlist {
		symbol := strings.TrimSpace(without)
		bParsed := false
		for key := range usagemodes {
			if key == symbol {
				bChangesMade = true
				usagemodes[key].use = false
				bParsed = true
				break
			}
		}

		// Check for modules if key was not found in map
		if bParsed == false {
			bChangesMade = true
			switch symbol {
			case "Niagara":
				usagemodes["NiagaraSprite"].use = false
				usagemodes["NiagaraRibbon"].use = false
				usagemodes["NiagaraMesh"].use = false
			case "Cascade":
				usagemodes["ParticleSprite"].use = false
				usagemodes["BeamTrail"].use = false
				usagemodes["MeshParticle"].use = false
			case "Simulation":
				usagemodes["Clothing"].use = false
				usagemodes["Water"].use = false
				usagemodes["HairStrand"].use = false
			case "AnyMesh":
				usagemodes["SkeletalMesh"].use = false
				usagemodes["SplineMesh"].use = false
				usagemodes["InstancedMesh"].use = false
			}
		}
	}

	// If any changes were registered, print the new hierarchy
	if bChangesMade {
		// Set automatic usage determination to false
		retval = append(retval, "matref.set_editor_property(\"automatically_set_usage_in_editor\", False)")
		for key := range usagemodes {
			if usagemodes[key].use == true {
				retval = append(retval, fmt.Sprintf("matref.set_editor_property(\"%s\", True)",
					usagemodes[key].representedBy))
			} else {
				retval = append(retval, fmt.Sprintf("matref.set_editor_property(\"%s\", False)",
					usagemodes[key].representedBy))
			}
		}
	}
	return
}

// UID : Returns a unique string name
// func UID() (retval string) {
// 	uuidNew := uuid.New()
// 	bytearr := []byte(uuidNew.String())
// 	uid := bytearr[0:8]
// 	retval = base64.RawURLEncoding.EncodeToString(uid)
// 	return
// }
