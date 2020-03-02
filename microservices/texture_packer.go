package main

import (
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/draw"

	// "image/jpeg"
	"image/png"
	_ "image/png"
	"io/ioutil"
	"log"
	"os"
	"path"
	"regexp"
	"strings"
)

// TextureTypes should have
type TextureTypes struct {
	Albedo       []string `json:"albedo"`
	Normal       []string `json:"normal"`
	Ao           []string `json:"ao"`
	Roughness    []string `json:"roughness"`
	Height       []string `json:"height"`
	Transparency []string `json:"tarnsparency"`
	Translucency []string `json:"translucency"`
	RMA          []string `json:"rma"`
	Emissive     []string `json:"emissive"`
	Metallic     []string `json:"metallic"`
	Detail       []string `json:"detail"`
	Opacity      []string `json:"opacity"`
	Specular     []string `json:"specular"`
}

// Tex4Settings should have
type Tex4Settings struct {
	TextureSize          int          `json:"TextureSize"`
	FillMissingWithWhite bool         `json:"fillMissingWithWhite"`
	Okay                 []int        `json:"okay"`
	Alias                TextureTypes `json:"alias"`
}

// TextureSet is
type TextureSet struct {
	albedo       string
	normal       string
	ao           string
	roughness    string
	height       string
	transparency string
	translucency string
	rma          string
	emissive     string
	metallic     string
	detail       string
	opacity      string
	specular     string
}

// FileData is
type FileData struct {
	IsDir    bool   // Whether a directory path
	fullpath string //
	filename string //
	nickname string //
	fileext  string //
}

// SeekDir god
func SeekDir(pathIn string, includeDir bool, includeFiles bool) (retval []FileData) {
	var ret []FileData // retval

	if includeDir {
		info2, _ := ioutil.ReadDir(os.Args[2])
		for _, s := range info2 {
			if includeDir {
				ret = append(ret, FileData{
					IsDir:    true,
					nickname: s.Name(),
					fullpath: path.Join(pathIn, s.Name()),
					filename: "",
					fileext:  "",
				})
			}
		}
	}
	if includeFiles {
		f, _ := os.Open(pathIn)
		filesinfo, _ := f.Readdir(-1)
		for _, s := range filesinfo {
			ret = append(ret, FileData{
				IsDir:    false,
				nickname: s.Name(),
				fullpath: path.Join(pathIn, s.Name()),
				filename: strings.TrimSuffix(s.Name(), path.Ext(s.Name())),
				fileext:  path.Ext(s.Name()),
			})
		}
	}
	return ret
}

/**
@arg 0 Name of the binary
@arg 1 Setting file location
@arg 2 Location to a compatible structured folder
*/
func main() {
	var mySettings Tex4Settings
	if len(os.Args) < 3 {
		println("Inadequate number of arguments !!!")
		return
	}
	fmt.Println("All checks completed")
	settingFileLoc := os.Args[1]
	jsonFile, _ := os.Open(settingFileLoc)
	jsonFileData, _ := ioutil.ReadAll(jsonFile)
	json.Unmarshal(jsonFileData, &mySettings)

	// const initializations
	_size := mySettings.TextureSize                                                   // Workspace texture size
	_rect := image.Rectangle{image.Point{0, 0}, image.Point{_size, _size}}            // Rectangle for a texture
	_outRect := image.Rectangle{image.Point{0, 0}, image.Point{_size * 2, _size * 2}} // Output dimensions

	p1 := image.Rectangle{image.Point{0, 0}, image.Point{_size, _size}}
	p2 := image.Rectangle{image.Point{_size, 0}, image.Point{_size * 2, _size}}
	p3 := image.Rectangle{image.Point{0, _size}, image.Point{_size, _size * 2}}
	p4 := image.Rectangle{image.Point{_size, _size}, image.Point{_size * 2, _size * 2}}

	var texSet TextureSet
	info := SeekDir(os.Args[2], true, false)
	for _, s := range info {
		fileInfo := SeekDir(s.fullpath, false, true)
		for _, file := range fileInfo {
			for _, pattern := range mySettings.Alias.Albedo {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.albedo = file.fullpath
					break
				}
			}
			for _, pattern := range mySettings.Alias.Normal {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.normal = file.fullpath
					break
				}
			}
			for _, pattern := range mySettings.Alias.Ao {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.ao = file.fullpath
					break
				}
			}
			for _, pattern := range mySettings.Alias.Roughness {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.roughness = file.fullpath
					break
				}
			}
			for _, pattern := range mySettings.Alias.Height {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.height = file.fullpath
					break
				}
			}
			for _, pattern := range mySettings.Alias.Transparency {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.transparency = file.fullpath
					break
				}
			}
			for _, pattern := range mySettings.Alias.Translucency {
				res, _ := regexp.MatchString(pattern, file.nickname)
				if res {
					texSet.translucency = file.fullpath
					break
				}
			}
		}
	}

	// per-folder scoped const params
	rgba := image.NewRGBA(_outRect)
	var matches []string // To print the textures found for a folder

	// var target1 draw.Image = image.NewRGBA(_rect) // albedo slot
	// var target2 draw.Image = image.NewRGBA(_rect) // normal slot
	// taregt3 := c
	var target3 draw.Image = image.NewRGBA(_rect) // rma slot
	var target4 draw.Image = image.NewRGBA(_rect) // misc slot

	// println(texSet.albedo, texSet.ao, texSet.height, texSet.normal, texSet.roughness, texSet.translucency, texSet.transparency)

	readerAlbedo, _ := os.Open(texSet.albedo)
	readerNormal, _ := os.Open(texSet.normal)
	readerAo, _ := os.Open(texSet.ao)
	readerRoughness, _ := os.Open(texSet.roughness)
	readerHeight, _ := os.Open(texSet.height)
	readerTransparency, _ := os.Open(texSet.transparency)
	readerTranslucency, _ := os.Open(texSet.translucency)
	readerEmissive, _ := os.Open(texSet.emissive)
	readerRMA, _ := os.Open(texSet.rma)
	readerMetallic, _ := os.Open(texSet.metallic)
	readerDetail, _ := os.Open(texSet.detail)
	readerOpacity, _ := os.Open(texSet.opacity)
	readerSpecular, _ := os.Open(texSet.specular)

	// Image streams
	imgAlbedo, _, errAlbedo := image.Decode(readerAlbedo)
	imgNormal, _, errNormal := image.Decode(readerNormal)
	imgAo, _, errAo := image.Decode(readerAo)
	imgRough, _, errRough := image.Decode(readerRoughness)
	imgHeight, _, errHeight := image.Decode(readerHeight)
	imgTransparency, _, errTransparency := image.Decode(readerTransparency)
	_ = imgTransparency
	imgTranslucency, _, errTranslucency := image.Decode(readerTranslucency)
	_ = imgTranslucency
	imgRMA, _, errRMA := image.Decode(readerRMA)
	_ = imgRMA
	imgEmissive, _, errEmissive := image.Decode(readerEmissive)
	_ = imgEmissive
	imgMetallic, _, errMetallic := image.Decode(readerMetallic)
	_ = imgMetallic
	imgDetail, _, errDetail := image.Decode(readerDetail)
	_ = imgDetail
	imgOpacity, _, errOpacity := image.Decode(readerOpacity)
	_ = imgOpacity
	imgSpecular, _, errSpecular := image.Decode(readerSpecular)
	_ = imgSpecular

	if errAlbedo != nil || errNormal != nil {
		// WARN and continue to next folder
		// println("albedo/normal map not detected for ", s.fullpath)
		log.Fatal(errAlbedo)
	}
	_ = p4

	// _ = rgba

	if errAlbedo == nil { // Draw albedo slot
		matches = append(matches, "albedo")
		draw.Draw(rgba, p1, imgAlbedo, image.Point{0, 0}, draw.Src)
	}
	if errNormal == nil { // Draw normal slot
		matches = append(matches, "normal")
		draw.Draw(rgba, p2, imgNormal, image.Point{0, 0}, draw.Src)
	}

	// If RMA map is present, ignore roughness, metallic, AO maps
	if errRMA == nil {
		matches = append(matches, "rma(skipped rough, metal,ao)")
	} else {
		if errAo == nil {
			matches = append(matches, "ao")
			target3 = ReplaceChannel(target3, imgAo, "R")
		}
		if errRough == nil {
			matches = append(matches, "rough")
			target3 = ReplaceChannel(target3, imgRough, "G")
		}
		if errMetallic == nil {
			matches = append(matches, "metallic")
			target3 = ReplaceChannel(target3, imgMetallic, "B")
		}
	}
	if errHeight == nil {
		matches = append(matches, "height")
		target4 = ReplaceChannel(target4, imgHeight, "R")
	}
	if errTransparency == nil {
		matches = append(matches, "transparency")
	}
	if errTranslucency == nil {
		matches = append(matches, "translucency")
	}
	if errEmissive == nil {
		matches = append(matches, "emissive")
	}
	if errOpacity == nil {
		matches = append(matches, "opacity")
	}
	if errDetail == nil {
		matches = append(matches, "detail")
	}
	if errSpecular == nil {
		matches = append(matches, "specular")
	}

	// Fill rest of the slots
	var finalRMA image.Image = target3
	draw.Draw(rgba, p3, finalRMA, image.Point{0, 0}, draw.Src)
	var finalMisc image.Image = target4
	draw.Draw(rgba, p4, finalMisc, image.Point{0, 0}, draw.Src)

	// out, err := os.Create("./output.jpg")
	// if err != nil {
	// 	print(err)
	// }
	// if true {
	// 	var opt jpeg.Options
	// 	opt.Quality = 75
	// 	jpeg.Encode(out, rgba, &opt)
	// } else {
	out, err := os.Create("./output.png")
	if err == nil {
		png.Encode(out, rgba)
	}
	// }

	fmt.Println(matches)
	// w.SetContent(widget.NewLabel("Hello World"))
	// w.ShowAndRun()
}

// ReplaceChannel goes like
func ReplaceChannel(target draw.Image, source image.Image, channel string) (retval draw.Image) {
	for x := source.Bounds().Min.X; x < source.Bounds().Max.X; x++ {
		for y := source.Bounds().Min.Y; y < source.Bounds().Max.Y; y++ {
			// Note type assertion to get a color.RGBA
			// variable initialization
			_R1, _G1, _B1, _A1 := source.At(x, y).RGBA()

			_R, _G, _B, _A := target.At(x, y).RGBA()
			colNew := color.RGBA{
				R: uint8(_R >> 8),
				G: uint8(_G >> 8),
				B: uint8(_B >> 8),
				A: uint8(_A >> 8),
			}

			switch channel {
			case "R":
				{
					colNew.R = uint8(_R1 >> 8)
					break
				}
			case "G":
				{
					colNew.G = uint8(_G1 >> 8)
					break
				}
			case "B":
				{
					colNew.B = uint8(_B1 >> 8)
					break
				}
			case "A":
				{
					colNew.A = uint8(_A1 >> 8)
					break
				}
			default:
				break
			}
			target.Set(x, y, colNew)
		}
	}
	return target
}
