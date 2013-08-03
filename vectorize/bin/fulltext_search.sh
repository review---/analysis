#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  fulltext_search.sh [options]

Options :
    -h, --help                : This message
    -s, --source      ns      : Target collection ns
    -w, --word        string  : Search word
    -F, --forward-match       : Left-hand match
    -V, --verbose             : With document
USAGE
  exit $1
}

EVAL=''
FOWARD=''
VERBOSE="var _VERBOSE=false;"

OPTIONS=`getopt -o hs:v:w:FV --long help,source:,word:,forward-match,verbose, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)     EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-w|--word)       EVAL="${EVAL}var _WORD='${OPTARG}';";shift;;
				-F|--forward-match) FORWARD=1;;
				-V|--verbose)    VERBOSE="var _VERBOSE=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${VERBOSE}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../../monmorp/lib/dictionary.js ${CURDIR}/../../monmorp/lib/morpho.js ${CURDIR}/../../monmorp/lib/jptokenizer.js ${CURDIR}/../lib/search.js | grep -v '^loading file:'


