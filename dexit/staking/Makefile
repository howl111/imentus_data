GOBIN = ./build/bin
GO ?= latest
GORUN = env GO111MODULE=on go run

all:
	go build -o build/bin main.go
	
run:
	$(GORUN) stake/stake.go install