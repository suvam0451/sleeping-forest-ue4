package texpack

import (
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"log"
	"regexp"
	"sync"
	"time"

	"github.com/disintegration/imaging"
	_ "github.com/disintegration/imaging"
	_ "golang.org/x/image/tiff" // Some images might be tiff format

	// "image/jpeg"
	"image/png"
	"io/ioutil"
	"os"
	"path"
	"strings"
)

// TextureTypes should have
type TextureTypes struct {
	Albedo       []string `json:"albedo"`
	Normal       []string `json:"normal"`
	Ao           []string `json:"ao"`
	Roughness    []string `json:"roughness"`
	Height       []string `json:"height"`
	Transparency []string `json:"transparency"`
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
	FillMissingWithWhite bool         `json:"FillMissingWithWhite"`
	Alias                TextureTypes `json:"Alias"`
}

// ImageContainer is
type ImageContainer struct {
	name      string
	aliases   []string
	filePtr   *os.File
	image     image.Image
	foundFlag bool
}

// FileData is
type FileData struct {
	IsDir    bool   // Whether a directory path
	fullpath string //
	filename string //
	nickname string //
	fileext  string //
}

// SeekDir looks at a given folder and returs list of file/folder data
func SeekDir(pathIn string, includeDir bool, includeFiles bool) (retval []FileData) {
	var ret []FileData // retval

	if includeDir {
		info2, _ := ioutil.ReadDir(pathIn)
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

// QuadPackEntry : Is nothing
func QuadPackEntry(inPath, outPath, settingFileLoc string) {

	var wg sync.WaitGroup
	var mySettings Tex4Settings // Imported settings

	start := time.Now()

	jsonFile, _ := os.Open(settingFileLoc)
	jsonFileData, _ := ioutil.ReadAll(jsonFile)
	json.Unmarshal(jsonFileData, &mySettings)

	info := SeekDir(inPath, true, false)

	fmt.Println(mySettings.TextureSize)

	for _, targetFolder := range info {
		fmt.Println(targetFolder.fullpath)
		wg.Add(1)
		go func(_targetFolder FileData, _outPath string) {
			assembleImageFromFolderAsync(_targetFolder, _outPath, mySettings)
			wg.Done()
		}(targetFolder, outPath)
	}

	wg.Wait()

	elapsed := time.Since(start)
	log.Printf("That took %s", elapsed)
}

// checks dimensions for image and resizes if necessary.
func assembleImageFromFolderAsync(folderData FileData, outpath string, settings Tex4Settings) {

	imageFiles := SeekDir(folderData.fullpath, false, true)
	// fmt.Println(imageFiles)

	// const initializations
	_size := settings.TextureSize                                                     // Workspace texture size
	_rect := image.Rectangle{image.Point{0, 0}, image.Point{_size, _size}}            // Rectangle for a texture
	_outRect := image.Rectangle{image.Point{0, 0}, image.Point{_size * 2, _size * 2}} // Output dimensions

	p1 := image.Rectangle{image.Point{0, 0}, image.Point{_size, _size}}
	p2 := image.Rectangle{image.Point{_size, 0}, image.Point{_size * 2, _size}}
	p3 := image.Rectangle{image.Point{0, _size}, image.Point{_size, _size * 2}}
	p4 := image.Rectangle{image.Point{_size, _size}, image.Point{_size * 2, _size * 2}}

	myMap := make(map[string](*ImageContainer))

	// if tmpAlbedo, albErr := os.Open(texSet.albedo); albErr == nil {
	// 	fmt.Println("No problemo here...")
	// 	myMap["Albedo"] = &ImageContainer{name: "Albedo", aliases: settings.Alias.Albedo, filePtr: tmpAlbedo}
	// 	myMap["Albedo"].filePtr = tmpAlbedo
	// }
	myMap["Albedo"] = &ImageContainer{name: "Albedo", aliases: settings.Alias.Albedo, foundFlag: false}
	myMap["AO"] = &ImageContainer{name: "Ao", aliases: settings.Alias.Ao, foundFlag: false}
	myMap["Detail"] = &ImageContainer{name: "Detail", aliases: settings.Alias.Detail, foundFlag: false}
	myMap["Emissive"] = &ImageContainer{name: "Emissive", aliases: settings.Alias.Emissive, foundFlag: false}
	myMap["Height"] = &ImageContainer{name: "Height", aliases: settings.Alias.Height, foundFlag: false}
	myMap["Metallic"] = &ImageContainer{name: "Metallic", aliases: settings.Alias.Metallic, foundFlag: false}
	myMap["Normal"] = &ImageContainer{name: "Normal", aliases: settings.Alias.Normal, foundFlag: false}
	myMap["Opacity"] = &ImageContainer{name: "Opacity", aliases: settings.Alias.Opacity, foundFlag: false}
	myMap["RMA"] = &ImageContainer{name: "RMA", aliases: settings.Alias.RMA, foundFlag: false}
	myMap["Roughness"] = &ImageContainer{name: "Roughness", aliases: settings.Alias.Roughness, foundFlag: false}
	myMap["Specular"] = &ImageContainer{name: "Specular", aliases: settings.Alias.Specular, foundFlag: false}
	myMap["Translucency"] = &ImageContainer{name: "Translucency", aliases: settings.Alias.Translucency, foundFlag: false}
	myMap["Transparency"] = &ImageContainer{name: "Transparency", aliases: settings.Alias.Transparency, foundFlag: false}

	for _, file := range imageFiles {
		found := false
		for iter, y := range myMap {
			for _, pattern := range y.aliases {
				if res := regexp.MustCompile("(?i)" + pattern).MatchString(file.nickname); res {
					// map to appropriate key if regex passes
					if tmpFile, albErr := os.Open(file.fullpath); albErr == nil {
						if img, _, err := image.Decode(tmpFile); err == nil {
							// _ = img
							myMap[iter].image = img
							myMap[iter].foundFlag = true
						}
					}
					found = true
					break
				}
			}
			if found {
				break
			}
		}
	}

	// per-folder scoped const params
	rgba := image.NewRGBA(_outRect)
	var matches []string // To print the textures found for a folder

	var target3 draw.Image = image.NewRGBA(_rect) // rma slot
	var target4 draw.Image = image.NewRGBA(_rect) // misc slot

	if _, ok1 := myMap["Albedo"]; !ok1 {
		if _, ok2 := myMap["Normal"]; !ok2 {
			log.Println("Albedo/Normal map not found for", folderData.nickname)
			return
		}
	}

	// Slot 1
	if albedo, ok := myMap["Albedo"]; ok && albedo.foundFlag {
		matches = append(matches, "albedo")
		if albedo.image.Bounds().Size().X != _size {
			_Resized := imaging.Resize(albedo.image, _size, _size, imaging.CatmullRom)
			draw.Draw(rgba, p1, _Resized, image.Point{0, 0}, draw.Src)
		} else {
			draw.Draw(rgba, p1, albedo.image, image.Point{0, 0}, draw.Src)
		}

		// Alpha fixes for other 2 quadrants
		target3 = ReplaceChannel(target3, albedo.image, "A") // Fix alpha
		target4 = ReplaceChannel(target4, albedo.image, "A") // Fix alpha
	}

	// Slot 2
	if normal, ok := myMap["Normal"]; ok && normal.foundFlag {
		matches = append(matches, "normal")
		if normal.image.Bounds().Size().X != _size {
			_Resized := imaging.Resize(normal.image, _size, _size, imaging.CatmullRom)
			draw.Draw(rgba, p2, _Resized, image.Point{0, 0}, draw.Src)
		} else {
			draw.Draw(rgba, p2, normal.image, image.Point{0, 0}, draw.Src)
		}
	}

	// Slot 3
	if rma, ok := myMap["RMA"]; ok && rma.foundFlag {
		matches = append(matches, "rma(skipped rough, metal,ao)")
		rma.image = SetImageSquareDimension(rma.image, _size)

		target3 = ReplaceChannel(target3, rma.image, "R", "G", "B")
	} else {
		if ao, ok := myMap["AO"]; ok && ao.foundFlag {
			matches = append(matches, "ao")
			ao.image = SetImageSquareDimension(ao.image, _size)
			target3 = ReplaceChannel(target3, ao.image, "R")
		}
		if rough, ok := myMap["Roughness"]; ok && rough.foundFlag {
			matches = append(matches, "rough")
			rough.image = SetImageSquareDimension(rough.image, _size)
			target3 = ReplaceChannel(target3, rough.image, "G")
		}
		if metal, ok := myMap[""]; ok && metal.foundFlag {
			matches = append(matches, "metallic")
			metal.image = SetImageSquareDimension(metal.image, _size)
			target3 = ReplaceChannel(target3, metal.image, "B")
		}
		if transparency, ok := myMap[""]; ok && transparency.foundFlag {
			matches = append(matches, "transparency")
			transparency.image = SetImageSquareDimension(transparency.image, _size)
			target3 = ReplaceChannel(target3, transparency.image, "A")
		}
	}

	// Slot 4
	if height, ok := myMap["Height"]; ok && height.foundFlag {
		matches = append(matches, "height")
		height.image = SetImageSquareDimension(height.image, _size)
		target4 = ReplaceChannel(target4, height.image, "R")
	}
	if opacity, ok := myMap["Opacity"]; ok && opacity.foundFlag {
		matches = append(matches, "opacity")
		opacity.image = SetImageSquareDimension(opacity.image, _size)
		target4 = ReplaceChannel(target4, opacity.image, "G")
	}
	if specular, ok := myMap["Specular"]; ok && specular.foundFlag {
		matches = append(matches, "specular")
		specular.image = SetImageSquareDimension(specular.image, _size)
		target4 = ReplaceChannel(target4, specular.image, "B")
	}
	if translucency, ok := myMap["Emissive"]; ok && translucency.foundFlag {
		matches = append(matches, "emissive")
		translucency.image = SetImageSquareDimension(translucency.image, _size)
		target4 = ReplaceChannel(target4, translucency.image, "A")
	}

	draw.Draw(rgba, p3, target3, image.Point{0, 0}, draw.Src)
	draw.Draw(rgba, p4, target4, image.Point{0, 0}, draw.Src)

	// Hangle PNG request
	out, err := os.Create(path.Join(outpath, folderData.nickname+".png")) // Texture for every folder

	if err == nil {
		png.Encode(out, rgba)
	}
	fmt.Println(folderData.nickname, matches)
}

// SetImageSquareDimension checks dimensions for image and resizes if necessary.
func SetImageSquareDimension(target image.Image, _size int) (retval image.Image) {
	if target.Bounds().Size().X != _size {

		return imaging.Resize(target, _size, _size, imaging.CatmullRom)
	}
	return target
}

// ReplaceChannel draws source image on top of target image for given channel
func ReplaceChannel(target draw.Image, source image.Image, channel ...string) (retval draw.Image) {
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

			for _, channelData := range channel {
				switch channelData {
				case "R":
					colNew.R = uint8(_R1 >> 8)
				case "G":
					colNew.G = uint8(_G1 >> 8)
				case "B":
					colNew.B = uint8(_B1 >> 8)
				case "A":
					colNew.A = uint8(_A1 >> 8)
				default:
					break
				}
			}

			target.Set(x, y, colNew)
		}
	}
	return target
}
