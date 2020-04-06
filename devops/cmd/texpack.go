// Copyright © 2020 Debashish Patra suvam0451@outlook.com
// Distributed under MPL-v2 license. http://www.apache.org/licenses/LICENSE-2.0

package cmd

import (
	"fmt"
	"os"
	"suvam0451/critstrike/texpack"

	"github.com/spf13/cobra"
)

// texpackCmd represents the texpack command
var texpackCmd = &cobra.Command{
	Use:   "texpack",
	Short: "Packs textures from same folder into single texture/atlas",
	Run: func(cmd *cobra.Command, args []string) {

		// Generate
		ipath, _ := cmd.Flags().GetString("inputpath")
		opath, _ := cmd.Flags().GetString("outputpath")
		config, _ := cmd.Flags().GetString("config")

		// Handle edge case errors
		if _, err := os.Stat(ipath); err != nil {
			fmt.Println("No input directory provided/not-found. See --help.")
			return
		} else if _, err := os.Stat(opath); err != nil {
			fmt.Println("No output directory provided/not-found. See --help.")
			return
		} else if _, err := os.Stat(config); err != nil {
			fmt.Println("No config file detected. See --help.")
			return
		} else {
			texpack.QuadPackEntry(ipath, opath, config)
		}
	},
}

func init() {
	rootCmd.AddCommand(texpackCmd)
	// Flags
	texpackCmd.Flags().StringP("mode", "m", "quadpack", "Mode of texture packing to use.")
	texpackCmd.Flags().StringP("inputpath", "i", "", "Folder with subfolders with texture sets.")
	texpackCmd.Flags().StringP("outputpath", "o", "", "Folder to output packed textures to.")
	texpackCmd.Flags().StringP("config", "c", "", "Invoking this command needs a valid compatible config filee.")
}
