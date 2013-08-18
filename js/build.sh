#! /bin/bash

BUILDER="/home/mjl/Projects/pearson/closure/closure-library/closure/bin/build/closurebuilder.py"
COMPILER="/home/mjl/Projects/pearson/closure/closure-compiler/compiler.jar" 
LIBRARYDIR="/home/mjl/Projects/pearson/closure/closure-library/" 
OUTFILE="brixlib-compiled.js"

declare -a COMPILER_ARGS=(\
	'--compilation_level=SIMPLE_OPTIMIZATIONS'\
	'--source_map_format=V3'\
	"--create_source_map=${OUTFILE}.map"\
	"--language_in=ECMASCRIPT5_STRICT"\
	"--warning_level=VERBOSE"\
	"--extra_annotation_name=note"\
	"--externs=d3.v3-externs.js"\
	)

BRIX_ARGS=$(cat <<EOF
	--input=eventmanager.js
	--input=widget-base.js
	--input=widget-image.js
	--input=widget-carousel.js
	--input=widget-imageviewer.js
	--root=.
	--root=$LIBRARYDIR
	--output_mode=compiled
	--output_file=$OUTFILE
	--compiler_jar=$COMPILER
	${COMPILER_ARGS[*]/#/--compiler_flags=}
EOF
)

$BUILDER $BRIX_ARGS
