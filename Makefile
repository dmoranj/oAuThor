BIN = ./node_modules/.bin

.PHONY: all
all: lib

lib-cov: clean-coverage lib
	$(BIN)/istanbul instrument --output lib-cov --no-compact --variable global.__coverage__ lib

.PHONY: test
test:
	LIB_ROOT=lib $(BIN)/mocha --reporter spec

.PHONY: coverage
coverage: lib-cov
	LIB_ROOT=lib-cov $(BIN)/mocha --reporter mocha-istanbul
	@echo
	@echo Open html-report/index.html file in your browser

.PHONY: clean
clean: clean-coverage clean-doc

.PHONY: clean-coverage
clean-coverage:
	-rm -rf lib-cov
	-rm -rf html-report

.PHONY: doc
doc:
	$(BIN)/dox-foundation --source lib --target doc

.PHONY: clean-doc
clean-doc:
	-rm -rf doc
