/*
Copyright © 2020 NAME HERE <EMAIL ADDRESS>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package cmd

import (
	"fmt"
	"suvam0451/critstrike/unrealremark"

	"github.com/spf13/cobra"
)

// usftoolsCmd represents the usftools command
var usftoolsCmd = &cobra.Command{
	Use:   "usftools",
	Short: "Parse/lint shader files(.usf/.ush) for ue4 (using python API)",
	Long:  `Although the input file should be .usf/.ush. and output to a python file, you may run it on any file you want`,
	Run: func(cmd *cobra.Command, args []string) {
		// Generate
		ipath, _ := cmd.Flags().GetString("inputpath")
		opath, _ := cmd.Flags().GetString("outputpath")
		pre, _ := cmd.Flags().GetString("alias")

		if ipath != "" && opath != "" {
			unrealremark.ParseHlslFile(ipath, opath, pre)
			fmt.Println("Finished parsing the shader file.")
		} else {
			fmt.Println("Input or output specified was invalid.")
		}
	},
}

func init() {
	rootCmd.AddCommand(usftoolsCmd)
	usftoolsCmd.PersistentFlags().StringP("inputpath", "i", ".", "usf file to parse.")
	usftoolsCmd.PersistentFlags().StringP("outputpath", "o", "", "python file location to output to.")
	usftoolsCmd.PersistentFlags().StringP("alias", "a", "", "Virtual shader source path alias.")
}
