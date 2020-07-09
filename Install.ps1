cd devops

# Build the binaries
echo "Building the golang binaries"

# Create directory for each video file, if missing
if(!(Test-Path -Path "../bin/linux")) {
    New-Item -ItemType Directory -Force -Path "../bin/linux"
}
if(!(Test-Path -Path "../bin/macos")) {
    New-Item -ItemType Directory -Force -Path "../bin/macos"
}
if(!(Test-Path -Path "../bin/win64")) {
    New-Item -ItemType Directory -Force -Path "../bin/win64"
}

$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -o ../bin/linux/critstrike critstrike.go
$env:GOOS = "darwin"
$env:GOARCH = "amd64"
go build -o ../bin/macos/critstrike critstrike.go
$env:GOOS = "windows"
$env:GOARCH = "amd64"
go build -o ../bin/win64/critstrike.exe critstrike.go

echo "Packaging the extensions"
yarn install
yarn run webpack
yarn vsce package
cd ..